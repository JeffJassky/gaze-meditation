import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import "@tensorflow/tfjs-backend-webgl";
import * as ort from "onnxruntime-web";
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
  public isTongueDetectionEnabled = false;
  private isProcessingTongue = false;
  private tongueSession: { encoder: ort.InferenceSession; decoder: ort.InferenceSession } | null = null;
  private tongueCanvas: HTMLCanvasElement | null = null;
  private debugCanvas: HTMLCanvasElement | null = null;

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
    eyeOpennessNormalized: 1.0, // 0 = closed (0.15 EAR), 1 = open (0.35 EAR)
    mouthOpenness: 0,

    tongueDetected: false,
    tongueProtrusion: 0,
    tongueMaskBase64: '', // Base64 for visual debug
  });

  private eyeOpennessMax = 0.35; // Represents fully open for normalization
  private eyeOpennessMin = 0.15; // Represents fully closed for normalization
  private normalizedBlinkThreshold = 0.2; // Normalized threshold for blink detection (0-1 scale)
  private blinkDetectionStartTime: number | null = null;
  private blinkSmoothingDuration = 100; // ms, eye must be below threshold for this duration to count as a blink
  private _isStopping = false; // Flag to handle race conditions

  async init(videoElement?: HTMLVideoElement) {
    this._isStopping = false; // Reset stopping flag

    if (this.isReady) {
      if (!this.rafId) this.startLoop();
      return;
    }

    if (videoElement) {
      this.video = videoElement;
    } else {
      // Setup hidden video
      const v = document.createElement("video");
      this.video = v; // Assign immediately

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

        // Check if stopped while waiting
        if (this._isStopping) {
          console.warn("FaceMesh init aborted: Service was stopped during GUM.");
          stream.getTracks().forEach(t => t.stop());
          if (this.video && this.video.parentNode) this.video.parentNode.removeChild(this.video);
          this.video = null;
          return;
        }

        if (this.video) {
            this.video.srcObject = stream;
        } else {
            // Should not happen if _isStopping check passed, but safety first
            stream.getTracks().forEach(t => t.stop());
            return;
        }

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
        if (this.video && this.video.parentNode) {
            this.video.parentNode.removeChild(this.video);
        }
        this.video = null;
        return;
      }
    }

    // Check if stopped again
    if (this._isStopping) return;

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

    if (this._isStopping) {
         // Clean up if stopped during model load
         this.stop(); // Re-run stop to clean up
         return;
    }

    this.isReady = true;

    console.log("FaceMesh Model Loaded (Head Pose Mode)");

    // Ensure video is playing

    if (this.video && this.video.paused) {
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

    // Calculate Mouth Openness (Use Inner Landmarks for strict gating)
    const upperLipInner = keypoints[13];
    const lowerLipInner = keypoints[14];
    const mouthLeft = keypoints[61];
    const mouthRight = keypoints[291];

    if (upperLipInner && lowerLipInner && mouthLeft && mouthRight) {
      const mouthV = this.getDistance(upperLipInner, lowerLipInner);
      const mouthH = this.getDistance(mouthLeft, mouthRight);
      if (mouthH > 0) {
        this.debugData.mouthOpenness = mouthV / mouthH;
      }
    }

    // Gate: 0.05 (Inner lips must be separated)
    if (this.isTongueDetectionEnabled && this.debugData.mouthOpenness > 0.05 && !this.isProcessingTongue) {
      this.isProcessingTongue = true;
      this.processTongue(keypoints).finally(() => {
          this.isProcessingTongue = false;
      });
    } else if (!this.isTongueDetectionEnabled || this.debugData.mouthOpenness <= 0.05) {
        if (!this.isProcessingTongue) {
            this.debugData.tongueDetected = false;
            this.debugData.tongueProtrusion = 0;
            if (this.debugCanvas) {
                const dctx = this.debugCanvas.getContext('2d');
                if (dctx) dctx.clearRect(0, 0, 256, 256);
            }
        }
    }

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

    // Normalize eye openness to a 0-1 scale
    this.debugData.eyeOpennessNormalized = Math.max(
      0,
      Math.min(
        1,
        (avgEAR - this.eyeOpennessMin) / (this.eyeOpennessMax - this.eyeOpennessMin)
      )
    );

    // DEBUGGING LOGS
    if (Date.now() % 500 < 50) { // Log every ~0.5 seconds
        console.log(
            `EAR: ${avgEAR.toFixed(3)}, ` +
            `NormEAR: ${this.debugData.eyeOpennessNormalized.toFixed(3)}, ` +
            `BlinkDetected: ${this.debugData.blinkDetected}`
        );
    }
    // END DEBUGGING LOGS

    // Use normalized eye openness for blink detection
    if (this.debugData.eyeOpennessNormalized < this.normalizedBlinkThreshold) {
      if (this.blinkDetectionStartTime === null) {
        this.blinkDetectionStartTime = Date.now();
      } else if (Date.now() - this.blinkDetectionStartTime >= this.blinkSmoothingDuration) {
        this.debugData.blinkDetected = true;
      } else {
        this.debugData.blinkDetected = false; // Not yet smoothed
      }
    } else {
      this.blinkDetectionStartTime = null;
      this.debugData.blinkDetected = false;
    }
  }

  public setNormalizedBlinkThreshold(value: number) {
    console.log(`Updating Normalized Blink Threshold: ${this.normalizedBlinkThreshold} -> ${value}`);
    this.normalizedBlinkThreshold = value;
  }

  public setEyeOpennessMin(value: number) {
    console.log(`Updating Eye Openness Min: ${this.eyeOpennessMin} -> ${value}`);
    this.eyeOpennessMin = value;
  }

  public setEyeOpennessMax(value: number) {
    console.log(`Updating Eye Openness Max: ${this.eyeOpennessMax} -> ${value}`);
    this.eyeOpennessMax = value;
  }

  public getCalibration() {
    return {
      normalizedBlinkThreshold: this.normalizedBlinkThreshold,
      eyeOpennessMin: this.eyeOpennessMin,
      eyeOpennessMax: this.eyeOpennessMax,

      gazeMinX: this.calibration.minX,

      gazeMaxX: this.calibration.maxX,

      gazeMinY: this.calibration.minY,

      gazeMaxY: this.calibration.maxY,
    };
  }

  public loadCalibration(data: any) {
    if (data.normalizedBlinkThreshold) this.normalizedBlinkThreshold = data.normalizedBlinkThreshold;
    if (data.eyeOpennessMin) this.eyeOpennessMin = data.eyeOpennessMin;
    if (data.eyeOpennessMax) this.eyeOpennessMax = data.eyeOpennessMax;
    if (data.gazeMinX) this.calibration.minX = data.gazeMinX;
    if (data.gazeMaxX) this.calibration.maxX = data.gazeMaxX;
    if (data.gazeMinY) this.calibration.minY = data.gazeMinY;
    if (data.gazeMaxY) this.calibration.maxY = data.gazeMaxY;

    console.log("Loaded Calibration:", data);
  }

  private getDistance(
    p1: faceLandmarksDetection.Keypoint,
    p2: faceLandmarksDetection.Keypoint
  ) {
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

  public getDebugCanvas(): HTMLCanvasElement | null {
    return this.debugCanvas;
  }

  public async enableTongueDetection() {
    this.isTongueDetectionEnabled = true;
    if (!this.tongueSession) {
        await this.loadTongueModels();
    }
  }

  public disableTongueDetection() {
    this.isTongueDetectionEnabled = false;
    this.debugData.tongueDetected = false;
    this.debugData.tongueProtrusion = 0;
    // We keep the models loaded for performance if re-enabled
  }

  private async loadTongueModels() {
    try {
        ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/";
        ort.env.wasm.numThreads = Math.min(navigator.hardwareConcurrency || 4, 8);
        ort.env.logLevel = 'error'; 

        console.log("Loading SlimSAM models...");
        
        const sessionOptions: ort.InferenceSession.SessionOptions = { 
            executionProviders: ['webgpu', 'wasm'],
            graphOptimizationLevel: 'all'
        };

        const [encoder, decoder] = await Promise.all([
            ort.InferenceSession.create('/models/slimsam/vision_encoder_quantized.onnx', sessionOptions),
            ort.InferenceSession.create('/models/slimsam/prompt_encoder_mask_decoder_quantized.onnx', sessionOptions)
        ]);

        this.tongueSession = { encoder, decoder };
        console.log(`SlimSAM models loaded. Encoder Provider: ${encoder.handler?.constructor.name || 'unknown'}`);

        this.tongueCanvas = document.createElement('canvas');
        this.tongueCanvas.width = 1024;
        this.tongueCanvas.height = 1024;

        this.debugCanvas = document.createElement('canvas');
        this.debugCanvas.width = 256;
        this.debugCanvas.height = 256;

    } catch (e) {
        console.error("Failed to load SlimSAM models:", e);
        this.isTongueDetectionEnabled = false;
    }
  }

  private async processTongue(keypoints: faceLandmarksDetection.Keypoint[]) {
    if (!this.tongueSession || !this.video || !this.tongueCanvas) return;

    // 1. Extract Mouth ROI
    const rightOuter = keypoints[263];
    const leftOuter = keypoints[33];
    const iod = Math.hypot(rightOuter.x - leftOuter.x, rightOuter.y - leftOuter.y);
    if (iod <= 0) return;

    const upper = keypoints[13];
    const lower = keypoints[14];
    const left = keypoints[61];
    const right = keypoints[291];
    
    const centerX = (left.x + right.x) / 2;
    const centerY = (upper.y + lower.y) / 2; 

    const cropSize = iod * 1.8; // Wider context to see face vs mouth
    const cropX = centerX - cropSize / 2;
    const cropY = centerY - cropSize / 2;

    const ctx = this.tongueCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    ctx.clearRect(0, 0, 1024, 1024);
    ctx.drawImage(this.video, cropX, cropY, cropSize, cropSize, 0, 0, 1024, 1024);
    
    const imageData = ctx.getImageData(0, 0, 1024, 1024);
    const { data } = imageData;

    const size = 1024 * 1024;
    const floatData = new Float32Array(3 * size);
    const mean = [123.675, 116.28, 103.53];
    const invStd = [1/58.395, 1/57.12, 1/57.375];

    for (let i = 0; i < size; i++) {
        const i4 = i << 2; 
        floatData[i] = (data[i4] - mean[0]) * invStd[0];
        floatData[i + size] = (data[i4 + 1] - mean[1]) * invStd[1];
        floatData[i + size * 2] = (data[i4 + 2] - mean[2]) * invStd[2];
    }

    const inputTensor = new ort.Tensor('float32', floatData, [1, 3, 1024, 1024]);

    // 2. Run Encoder
    const encoderFeeds = { pixel_values: inputTensor }; 
    const encoderResults = await this.tongueSession.encoder.run(encoderFeeds);
    
    const imageEmbeddings = encoderResults.image_embeddings || encoderResults.last_hidden_state || Object.values(encoderResults)[0]; 
    const imagePositionalEmbeddings = encoderResults.image_positional_embeddings || Object.values(encoderResults)[1];

    // 3. Prepare Point Hints
    // Foreground: Landmark 14 (Inner Lower Lip)
    // Background: Upper lip + outer mouth corners + far corners of face
    const l14 = keypoints[14];
    const l13 = keypoints[13];
    const l61 = keypoints[61];
    const l291 = keypoints[291];

    const points = [
        (l14.x - cropX) / cropSize * 1024, (l14.y - cropY) / cropSize * 1024, // 1: Foreground
        (l13.x - cropX) / cropSize * 1024, (l13.y - cropY) / cropSize * 1024, // 0: Background
        (l61.x - cropX) / cropSize * 1024, (l61.y - cropY) / cropSize * 1024, // 0: Background
        (l291.x - cropX) / cropSize * 1024, (l291.y - cropY) / cropSize * 1024, // 0: Background
        100, 100,    // Far TL
        924, 100,    // Far TR
        100, 924,    // Far BL
        924, 924     // Far BR
    ];
    const labels = [1, 0, 0, 0, 0, 0, 0, 0]; // 1=Foreground, 0=Background

    const maskInput = new Float32Array(256 * 256);
    const maskInputTensor = new ort.Tensor('float32', maskInput, [1, 1, 256, 256]);
    const hasMaskInputTensor = new ort.Tensor('float32', new Float32Array([0]), [1]);
    const originalSizes = new BigInt64Array([BigInt(1024), BigInt(1024)]);
    const reshapedInputSizes = new BigInt64Array([BigInt(1024), BigInt(1024)]);

    // 4. Run Decoder
    const allPossibleFeeds: any = {
        image_embeddings: imageEmbeddings,
        image_positional_embeddings: imagePositionalEmbeddings,
        input_points: new ort.Tensor('float32', new Float32Array(points), [1, 1, 8, 2]),
        input_labels: new ort.Tensor('int64', new BigInt64Array(labels.map(l => BigInt(l))), [1, 1, 8]),
        input_masks: maskInputTensor,
        has_input_masks: hasMaskInputTensor,
        original_sizes: new ort.Tensor('int64', originalSizes, [2]),
        reshaped_input_sizes: new ort.Tensor('int64', reshapedInputSizes, [2])
    };

    const decoderFeeds: any = {};
    this.tongueSession.decoder.inputNames.forEach(name => {
        if (allPossibleFeeds[name]) decoderFeeds[name] = allPossibleFeeds[name];
    });

    try {
        const decoderResults = await this.tongueSession.decoder.run(decoderFeeds);
        const masks = decoderResults.pred_masks || decoderResults['masks'] || Object.values(decoderResults)[0];
        const iouScores = decoderResults.iou_scores || Object.values(decoderResults)[1];
        
        const maskData = masks.data as Float32Array;
        const dims = masks.dims; 
        const maskH = dims[dims.length - 2];
        const maskW = dims[dims.length - 1];
        const numMasks = dims[dims.length - 3] || 1;
        
        // Pick the mask with the highest IOU score among those provided
        let bestMaskIdx = 0;
        if (iouScores) {
            const scores = iouScores.data as Float32Array;
            let maxScore = -1;
            for (let i = 0; i < numMasks; i++) {
                if (scores[i] > maxScore) {
                    maxScore = scores[i];
                    bestMaskIdx = i;
                }
            }
        }

        const maskStride = maskH * maskW;
        const maskOffset = bestMaskIdx * maskStride;

        let minY = maskH;
        let maxY = 0;
        let pixelCount = 0;
        
        // Standard threshold (logits > 0.0)
        for (let y = 0; y < maskH; y++) { 
             const row = maskOffset + y * maskW;
             for (let x = 0; x < maskW; x++) {
                 if (maskData[row + x] > 0.0) { 
                     if (y < minY) minY = y;
                     if (y > maxY) maxY = y;
                     pixelCount++;
                 }
             }
        }
        
        // Update Debug Canvas Directly
        if (this.debugCanvas) { 
            const dctx = this.debugCanvas.getContext('2d');
            if (dctx) {
                dctx.drawImage(this.tongueCanvas, 0, 0, 1024, 1024, 0, 0, 256, 256);
                
                if (pixelCount > 0) {
                    const overlay = dctx.createImageData(256, 256);
                    overlay.data.fill(0); 

                    for (let y = 0; y < 256; y++) {
                        const maskY = Math.floor((y / 256) * maskH);
                        const mRow = maskOffset + maskY * maskW;
                        for (let x = 0; x < 256; x++) {
                            const maskX = Math.floor((x / 256) * maskW);
                            if (maskData[mRow + maskX] > 0.0) {
                                const idx = (y * 256 + x) * 4;
                                overlay.data[idx] = 255;   
                                overlay.data[idx+1] = 0;   
                                overlay.data[idx+2] = 255; 
                                overlay.data[idx+3] = 160; 
                            }
                        }
                    }
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = 256;
                    tempCanvas.height = 256;
                    tempCanvas.getContext('2d')?.putImageData(overlay, 0, 0);
                    dctx.drawImage(tempCanvas, 0, 0);
                }

                points.forEach((val, i) => {
                    if (i % 2 === 0 && i < 8) { // Draw all primary hints
                        const px = (points[i] / 1024) * 256;
                        const py = (points[i+1] / 1024) * 256;
                        dctx.fillStyle = labels[i/2] === 1 ? '#00ff00' : '#ff0000';
                        dctx.beginPath();
                        dctx.arc(px, py, 4, 0, Math.PI * 2);
                        dctx.fill();
                    }
                });
            }
        }
        
        // Threshold: adjust for mask resolution (256x256 has fewer pixels than 1024x1024)
        const detectionThreshold = (maskH * maskW) / 300; 
        
        if (pixelCount > detectionThreshold) { 
            if (!this.debugData.tongueDetected) console.log("👅 Tongue Detected!");
            this.debugData.tongueDetected = true;
            const tongueHeightRelative = (maxY - minY) / maskH;
            const realHeight = tongueHeightRelative * cropSize;
            this.debugData.tongueProtrusion = Math.min(1.0, realHeight / iod);
        } else {
             this.debugData.tongueDetected = false;
             this.debugData.tongueProtrusion = 0;
        }

    } catch (e) {
        console.error("Decoder Error:", e);
    }
  }

  public stop() {
    this._isStopping = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.video && this.video.srcObject) {
      const stream = this.video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      this.video.srcObject = null;
    }

    if (this.video && this.video.parentNode) {
      this.video.parentNode.removeChild(this.video);
    }

    this.video = null;
    this.detector = null; // Force reload of model next time to be safe/clean
    this.isReady = false;
    
    console.log("FaceMesh Service stopped and resources released.");
  }
}

export const faceMeshService = new FaceMeshService();
