import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import "@tensorflow/tfjs-backend-webgl";
import { reactive } from "vue";

export interface Point {
  x: number;
  y: number;
}

export interface CalibrationData {
  minX: number; // Eye looking Left (Iris at outer corner)
  maxX: number; // Eye looking Right (Iris at inner corner)
  minY: number; // Eye looking Up
  maxY: number; // Eye looking Down
}

class FaceMeshService {
  private detector: faceLandmarksDetection.FaceLandmarksDetector | null = null;
  private video: HTMLVideoElement | null = null;
  private rafId: number | null = null;

  public isReady = false;

  // Calibration: We track the "Normalized Iris Position" ranges
  // 0 = Center, -1 = Left/Up, 1 = Right/Down (approximately)
  private calibration = reactive<CalibrationData>({
    minX: -0.2,
    maxX: 0.2,
    minY: -0.1,
    maxY: 0.3,
  });

  public debugData = reactive({
    headYaw: 0,

    headPitch: 0,

    gazeX: 0,

    gazeY: 0,

    blinkDetected: false,
    eyeOpenness: 1.0, // 0 = closed, 1 = open
  });
  
  private blinkThreshold = 0.25;

  async init(videoElement?: HTMLVideoElement) {
    if (this.isReady) {
      if (!this.rafId) this.startLoop();
      return;
    }

    if (videoElement) {
      this.video = videoElement;
    } else {
      // Setup hidden video

      this.video = document.createElement("video");

      // display: none causes issues with some detectors/browsers. Use opacity 0.

      this.video.style.opacity = "0";

      this.video.style.pointerEvents = "none";

      this.video.style.position = "fixed";

      this.video.style.top = "0";

      this.video.style.left = "0";

      this.video.style.zIndex = "99999";

      // Explicit dimensions are helpful for TFJS

      this.video.width = 640;

      this.video.height = 480;

      this.video.style.width = "640px";

      this.video.style.height = "480px";

      this.video.autoplay = true;

      this.video.playsInline = true;

      document.body.appendChild(this.video);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
        });

        this.video.srcObject = stream;

        // Log real settings

        const track = stream.getVideoTracks()[0];

        if (track) {
          console.log("Camera Settings:", track.getSettings());
        }

        // Wait for video to load

        await new Promise((resolve) => {
          if (this.video) {
            this.video.onloadeddata = resolve;
          } else {
            resolve(true);
          }
        });
      } catch (e) {
        console.error("Camera Access Error:", e);

        return;
      }
    }

    // Load Model

    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;

    const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig =
      {
        runtime: "tfjs",

        refineLandmarks: false, // Iris not needed for Head Pose

        maxFaces: 1,
      };

    this.detector = await faceLandmarksDetection.createDetector(
      model,
      detectorConfig
    );

    this.isReady = true;

    console.log("FaceMesh Model Loaded (Head Pose Mode)");

    // Ensure video is playing

    if (this.video.paused) {
      try {
        await this.video.play();

        console.log("Video started playing");
      } catch (e) {
        console.error("Video play failed:", e);
      }
    }

    this.startLoop();
  }

  private startLoop() {
    let frameCount = 0;

    const loop = async () => {
      frameCount++;

      if (this.detector && this.video) {
        if (this.video.readyState === 4) {
          if (this.video.videoWidth === 0) {
            if (frameCount % 60 === 0)
              console.warn("Video has 0 width, cannot detect");
          } else {
            try {
              const faces = await this.detector.estimateFaces(this.video);

              if (faces.length > 0) {
                this.processFace(faces[0]);

                if (frameCount % 60 === 0)
                  console.log(
                    `Face detected (Yaw: ${this.debugData.headYaw.toFixed(3)})`
                  );
              } else {
                if (frameCount % 60 === 0) console.log("No faces detected");
              }
            } catch (e) {
              console.error("Detection Error:", e);
            }
          }
        } else {
          if (frameCount % 60 === 0)
            console.log("Video not ready, state:", this.video.readyState);
        }
      }

      this.rafId = requestAnimationFrame(loop);
    };

    loop();
  }

  private processFace(face: faceLandmarksDetection.Face) {
    const keypoints = face.keypoints;

    // Landmarks for Head Pose / Orientation

    // 1: Nose Tip

    // 168: Mid-Eye (Glabella) / or average of eyes

    // 33: Left Eye Outer

    // 263: Right Eye Outer

    const nose = keypoints[1];

    const midEye = keypoints[168];

    const leftOuter = keypoints[33];

    const rightOuter = keypoints[263];

    if (!nose || !midEye || !leftOuter || !rightOuter) return;

    // Inter-Ocular Distance (IOD) for Scale Normalization

    const iod = Math.hypot(
      rightOuter.x - leftOuter.x,
      rightOuter.y - leftOuter.y
    );

    if (iod === 0) return;

    // Calculate Relative Nose Position (Head Gaze Metrics)

    // Yaw: Horizontal offset of nose from center, normalized by face width

    // Inverted (-1) to match screen direction (Looking Left -> Cursor Left)

    const headYaw = (-1 * (nose.x - midEye.x)) / iod;

    // Pitch: Vertical offset of nose from center

    // Looking Up -> Nose moves Up (negative Y usually, depending on coord system)

    // Looking Down -> Nose moves Down (positive Y)

    const headPitch = (nose.y - midEye.y) / iod;

    this.debugData.headYaw = headYaw;

    this.debugData.headPitch = headPitch;

    // Map to Screen using Calibration

    const screenX = this.mapToScreen(
      headYaw,
      this.calibration.minX,
      this.calibration.maxX,
      window.innerWidth
    );

    const screenY = this.mapToScreen(
      headPitch,
      this.calibration.minY,
      this.calibration.maxY,
      window.innerHeight
    );

    this.debugData.gazeX = screenX;

    this.debugData.gazeY = screenY;

    this.updateBlinkStatus(keypoints);
  }

  private updateBlinkStatus(keypoints: faceLandmarksDetection.Keypoint[]) {
    // Left Eye
    const leftV = this.getDistance(keypoints[159], keypoints[145]);
    const leftH = this.getDistance(keypoints[33], keypoints[133]);
    const leftEAR = leftV / leftH;

    // Right Eye
    const rightV = this.getDistance(keypoints[386], keypoints[374]);
    const rightH = this.getDistance(keypoints[263], keypoints[362]);
    const rightEAR = rightV / rightH;

        const avgEAR = (leftEAR + rightEAR) / 2;

        

        this.debugData.eyeOpenness = avgEAR;

        // Threshold usually around 0.2 - 0.3 for a blink

        this.debugData.blinkDetected = avgEAR < this.blinkThreshold; 

      }

    

        public setBlinkThreshold(value: number) {

    

            console.log(`Updating Blink Threshold: ${this.blinkThreshold} -> ${value}`);

    

            this.blinkThreshold = value;

    

        }

    

      

    

        public getCalibration() {

    

            return {

    

                blinkThreshold: this.blinkThreshold,

    

                gazeMinX: this.calibration.minX,

    

                gazeMaxX: this.calibration.maxX,

    

                gazeMinY: this.calibration.minY,

    

                gazeMaxY: this.calibration.maxY

    

            };

    

        }

    

      

    

        public loadCalibration(data: any) {

    

            if (data.blinkThreshold) this.blinkThreshold = data.blinkThreshold;

    

            if (data.gazeMinX) this.calibration.minX = data.gazeMinX;

    

            if (data.gazeMaxX) this.calibration.maxX = data.gazeMaxX;

    

            if (data.gazeMinY) this.calibration.minY = data.gazeMinY;

    

            if (data.gazeMaxY) this.calibration.maxY = data.gazeMaxY;

    

            

    

            console.log("Loaded Calibration:", data);

    

        }

    

      

    

        private getDistance(p1: faceLandmarksDetection.Keypoint, p2: faceLandmarksDetection.Keypoint) {

    

      
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }

  private mapToScreen(
    val: number,
    min: number,
    max: number,
    range: number
  ): number {
    // Normalize to 0-1 based on calibration range

    const norm = (val - min) / (max - min);

    // Clamp to screen bounds

    return Math.max(0, Math.min(range, norm * range));
  }

  private trainingPoints: Array<{
    rawX: number;
    rawY: number;
    screenX: number;
    screenY: number;
  }> = [];

  public train(screenX: number, screenY: number) {
    // Guard against training on uninitialized data

    if (this.debugData.headYaw === 0 && this.debugData.headPitch === 0) {
      console.warn("Skipping training: Head pose data is 0 (uninitialized)");

      return;
    }

    console.log("Training sample:", this.debugData.headYaw, screenX);

    // Store current raw data with target

    this.trainingPoints.push({
      rawX: this.debugData.headYaw,

      rawY: this.debugData.headPitch,

      screenX,

      screenY,
    });

    this.recalibrate();
  }

  public clearCalibration() {
    this.trainingPoints = [];

    // Reset to safe defaults for Head Pose

    // Yaw: -0.5 (Left) to 0.5 (Right) roughly

    // Pitch: -0.2 (Up) to 0.4 (Down) roughly (Shifted)

    this.calibration.minX = -0.5;
    this.calibration.maxX = 0.5;

    this.calibration.minY = -0.2;
    this.calibration.maxY = 0.4;
  }

  private recalibrate() {
    if (this.trainingPoints.length < 2) return;

    // Simple Min/Max based on Screen X/Y

    const leftSamples = this.trainingPoints.filter(
      (p) => p.screenX < window.innerWidth / 3
    );

    const rightSamples = this.trainingPoints.filter(
      (p) => p.screenX > (window.innerWidth * 2) / 3
    );

    console.log(
      `Recalibrating: ${leftSamples.length} Left Samples, ${rightSamples.length} Right Samples`
    );

    if (leftSamples.length > 0 && rightSamples.length > 0) {
      let avgLeftX =
        leftSamples.reduce((sum, p) => sum + p.rawX, 0) / leftSamples.length;

      let avgRightX =
        rightSamples.reduce((sum, p) => sum + p.rawX, 0) / rightSamples.length;

      // Safety: Ensure minimum delta to prevent sensitivity explosion

      const minDelta = 0.1; // Minimum expected yaw difference

      if (avgRightX - avgLeftX < minDelta) {
        console.warn("Calibration range too small, widening...");

        const center = (avgRightX + avgLeftX) / 2;

        avgLeftX = center - minDelta / 2;

        avgRightX = center + minDelta / 2;
      }

      this.calibration.minX = avgLeftX;

      this.calibration.maxX = avgRightX;
    }

    // Pitch Calibration: Explicit Top/Bottom Logic
    const topSamples = this.trainingPoints.filter(
      (p) => p.screenY < window.innerHeight / 3
    );
    const bottomSamples = this.trainingPoints.filter(
      (p) => p.screenY > (window.innerHeight * 2) / 3
    );

    if (topSamples.length > 0 && bottomSamples.length > 0) {
      let avgTopY =
        topSamples.reduce((sum, p) => sum + p.rawY, 0) / topSamples.length;
      let avgBottomY =
        bottomSamples.reduce((sum, p) => sum + p.rawY, 0) /
        bottomSamples.length;

      const minDeltaY = 0.05; // Pitch range is smaller than Yaw usually
      if (avgBottomY - avgTopY < minDeltaY) {
        console.warn("Pitch calibration range too small, widening...");
        const center = (avgBottomY + avgTopY) / 2;
        avgTopY = center - minDeltaY / 2;
        avgBottomY = center + minDeltaY / 2;
      }

      this.calibration.minY = avgTopY;
      this.calibration.maxY = avgBottomY;
    } else {
      // Fallback: Use variance or default centering if strict top/bottom samples missing
      const rawYs = this.trainingPoints.map((p) => p.rawY);
      if (rawYs.length > 0) {
        const minRawY = Math.min(...rawYs);
        const maxRawY = Math.max(...rawYs);

        if (maxRawY - minRawY > 0.05) {
          this.calibration.minY = minRawY;
          this.calibration.maxY = maxRawY;
        } else {
          const avgY = rawYs.reduce((a, b) => a + b, 0) / rawYs.length;
          this.calibration.minY = avgY - 0.15;
          this.calibration.maxY = avgY + 0.15;
        }
      }
    }

    console.log("Recalibrated Head Pose:", this.calibration);
  }
  public getCurrentGaze(): Point | null {
    // Return null if not ready or no face

    if (
      !this.detector ||
      (this.debugData.headYaw === 0 && this.debugData.headPitch === 0)
    )
      return null;

    return { x: this.debugData.gazeX, y: this.debugData.gazeY };
  }

  public stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

export const faceMeshService = new FaceMeshService();
