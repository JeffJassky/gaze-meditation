import { reactive } from 'vue';
// @ts-ignore
import webgazer from 'webgazer';

export interface Point {
  x: number;
  y: number;
}

class WebGazerService {
  private initialized = false;
  private isListening = false;
  
  // Calibration Data
  public calibrationData = reactive({
    leftPoints: [] as Point[],
    rightPoints: [] as Point[],
    leftCentroid: null as Point | null,
    rightCentroid: null as Point | null
  });

  async init() {
    if (this.initialized) return;

    // Use imported webgazer
    if (!webgazer) {
        console.error("WebGazer module not loaded");
        return;
    }
    
    // Explicitly attach to window for internal webgazer logic if needed, 
    // though the module usually does this itself.
    if (!window.webgazer) {
        window.webgazer = webgazer;
    }

    try {
        await webgazer.setRegression('ridge')
            .setTracker('TFFacemesh')
            .begin();
    } catch (e) {
        console.error("WebGazer Init Error:", e);
        // Fallback?
    }

    console.log("WebGazer initialized");

    // Hide video by default for cleaner UI, or make it smaller/corner
    webgazer.showVideo(true);
    webgazer.showFaceOverlay(true);
    webgazer.showFaceFeedbackBox(true);

    this.initialized = true;
    this.isListening = true;
  }

  pause() {
    if (this.initialized && this.isListening) {
        window.webgazer.pause();
        this.isListening = false;
    }
  }

  resume() {
    if (this.initialized && !this.isListening) {
        window.webgazer.resume();
        this.isListening = true;
    }
  }

  async getCurrentPrediction(): Promise<Point | null> {
    if (!this.initialized) return null;
    const pred = await window.webgazer.getCurrentPrediction();
    if (!pred) {
        // console.warn("Raw WebGazer prediction is null/undefined");
    }
    return pred;
  }

  train(x: number, y: number) {
      if (this.initialized) {
          console.log(`Training WebGazer at (${x}, ${y})`);
          // Record a burst of points to ensure the model catches it
          // WebGazer likes multiple data points
          window.webgazer.recordScreenPosition(x, y, 'calibration');
          window.webgazer.recordScreenPosition(x, y, 'calibration');
          window.webgazer.recordScreenPosition(x, y, 'calibration');
      }
  }

  // Calibration Helpers
  addCalibrationPoint(side: 'left' | 'right', point: Point) {
    if (side === 'left') {
        this.calibrationData.leftPoints.push(point);
    } else {
        this.calibrationData.rightPoints.push(point);
    }
    this.recalculateCentroids();
  }

  private recalculateCentroids() {
    this.calibrationData.leftCentroid = this.getCentroid(this.calibrationData.leftPoints);
    this.calibrationData.rightCentroid = this.getCentroid(this.calibrationData.rightPoints);
  }

  private getCentroid(points: Point[]): Point | null {
    if (points.length === 0) return null;
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return {
        x: sum.x / points.length,
        y: sum.y / points.length
    };
  }

  public clearCalibration() {
    // Clear internal WebGazer data
    if (this.initialized && window.webgazer.clearData) {
        window.webgazer.clearData(); 
    }
    
    this.calibrationData.leftPoints = [];
    this.calibrationData.rightPoints = [];
    this.calibrationData.leftCentroid = null;
    this.calibrationData.rightCentroid = null;
  }
}

export const webGazerService = new WebGazerService();
