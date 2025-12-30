#include <LSM6DS3.h>
#include <Wire.h>
#include <bluefruit.h>

// ==========================================
// 1. HARDWARE TAP TUNING (The "Smack" Detector)
// ==========================================
// Value: 0x01 (Sensitive) to 0x1F (Hard hit).
// 0x08 is roughly 2G-3G threshold (Medium Tap).
// 0x0C is roughly 4G (Hard Tap).
// If it triggers too easily, INCREASE this hex number.
#define TAP_THRESHOLD_CODE   0x09   

// ==========================================
// 2. WAVE / MOTION TUNING (The "Feel")
// ==========================================
#define SAMPLE_DELAY_MS      10     // 100Hz Polling for the Wave visualization
#define REPORT_INTERVAL      10     
#define WINDOW_SIZE          100    

#define MAG_SMOOTHING_ALPHA  0.1    
#define MAG_SCALE_FACTOR     10.0   
#define MAG_NOISE_GATE       0.01   

#define FREQ_MIN_SWING       0.02   
#define FREQ_HYSTERESIS      0.01   

#define SEND_MAG_DEADBAND    0.05
#define SEND_FREQ_DEADBAND   0.2

// ==========================================
// GLOBALS
// ==========================================
LSM6DS3 myIMU(I2C_MODE, 0x6A); 
BLEUart bleuart;

float histX[WINDOW_SIZE];
float histY[WINDOW_SIZE];
float histZ[WINDOW_SIZE];
int headIndex = 0;
int sampleCounter = 0;

float smoothMag = 0;
float lastSentMag = -99.0;
float lastSentFreq = -99.0;
float lastAx=0, lastAy=0, lastAz=0;

// Register Addresses for LSM6DS3
#define LSM6DS3_TAP_CFG      0x58
#define LSM6DS3_TAP_THS_6D   0x59
#define LSM6DS3_INT_DUR2     0x5A
#define LSM6DS3_WAKE_UP_THS  0x5B
#define LSM6DS3_MD1_CFG      0x5E
#define LSM6DS3_TAP_SRC      0x1C

void setup() {
  Serial.begin(9600);
  
  Bluefruit.begin();
  Bluefruit.setTxPower(4); 
  Bluefruit.setName("XIAO_Pro_Sensor");
  bleuart.begin();
  
  Bluefruit.Advertising.addFlags(BLE_GAP_ADV_FLAGS_LE_ONLY_GENERAL_DISC_MODE);
  Bluefruit.Advertising.addTxPower();
  Bluefruit.Advertising.addService(bleuart);
  Bluefruit.Advertising.restartOnDisconnect(true);
  Bluefruit.Advertising.setInterval(32, 244); 
  Bluefruit.Advertising.start(0); 

  // Initialize Standard IMU
  if (myIMU.begin() != 0) while(1);

  // --- ACTIVATE HARDWARE TAP ENGINE ---
  setupHardwareTap();

  // Zero buffers
  for(int i=0; i<WINDOW_SIZE; i++) {
    histX[i] = 0; histY[i] = 0; histZ[i] = 0;
  }
}

void setupHardwareTap() {
  // 1. Enable Tap Detection on X, Y, Z axes
  // 0x8E = 1000 1110 (Interrupts enabled, Slope filter, X/Y/Z enabled)
  myIMU.writeRegister(LSM6DS3_TAP_CFG, 0x8E);

  // 2. Set Threshold (Sensitivity)
  // Bits [4:0] are the threshold. 
  myIMU.writeRegister(LSM6DS3_TAP_THS_6D, TAP_THRESHOLD_CODE);

  // 3. Set Duration / Quiet Time / Shock
  // 0x7F = Max shock duration, max quiet time.
  // This prevents "double bounces".
  myIMU.writeRegister(LSM6DS3_INT_DUR2, 0x7F);

  // 4. Enable Single Tap
  // 0x80 = Single tap enabled.
  myIMU.writeRegister(LSM6DS3_WAKE_UP_THS, 0x80);
  
  // 5. Force ODR (Output Data Rate) to 416Hz
  // The Tap engine needs high speed to work.
  // 0x60 = 416Hz (High Performance)
  // Note: This might override the default 104Hz, which is good for us.
  myIMU.writeRegister(0x10, 0x60); 

  Serial.println("Hardware Tap Engine Configured.");
}

void loop() {
  static unsigned long lastSampleTime = 0;
  unsigned long currentMillis = millis();

  // ==========================================
  // 1. CHECK HARDWARE TAP FLAG (Fastest Priority)
  // ==========================================
  // We check this every loop. The register latches, so we won't miss it.
  
  uint8_t tapSource = 0;
  myIMU.readRegister(&tapSource, LSM6DS3_TAP_SRC);

  // Check Bit 5 (Single Tap Detected)
  if (tapSource & 0x20) {
    if (Bluefruit.connected()) {
      // Send Knock!
      // Since hardware detected it, we assume it was a solid hit.
      // We don't have the "magnitude" of the hit (the register just says YES/NO),
      // so we send a standard strong value (e.g., 5.0) or a "K:TAP" marker.
      bleuart.println("K:5.0"); 
      
      // Small delay to prevent spamming if the register is sticky
      delay(150); 
    }
  }

  // ==========================================
  // 2. NORMAL WAVE LOGIC (100Hz)
  // ==========================================
  if (currentMillis - lastSampleTime >= SAMPLE_DELAY_MS) {
    lastSampleTime = currentMillis;

    // A. Read Sensor
    float ax = myIMU.readFloatAccelX();
    float ay = myIMU.readFloatAccelY();
    float az = myIMU.readFloatAccelZ();

    // B. Calculate Energy (Same as before)
    float delta = fabs(ax - lastAx) + fabs(ay - lastAy) + fabs(az - lastAz);
    lastAx = ax; lastAy = ay; lastAz = az;

    smoothMag = (MAG_SMOOTHING_ALPHA * delta) + ((1.0 - MAG_SMOOTHING_ALPHA) * smoothMag);
    if (smoothMag < MAG_NOISE_GATE) smoothMag = 0.0;

    // C. Store History
    histX[headIndex] = ax;
    histY[headIndex] = ay;
    histZ[headIndex] = az;
    headIndex = (headIndex + 1) % WINDOW_SIZE;
    sampleCounter++;

    // D. Report Wave Data
    if (sampleCounter >= REPORT_INTERVAL) {
      sampleCounter = 0;
      analyzeAndSend();
    }
  }
}

void analyzeAndSend() {
  // --- FREQUENCY LOGIC ---
  float minX=100, maxX=-100, minY=100, maxY=-100, minZ=100, maxZ=-100;
  float sumX=0, sumY=0, sumZ=0;

  for (int i=0; i<WINDOW_SIZE; i++) {
    float x = histX[i]; float y = histY[i]; float z = histZ[i];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    sumX += x; sumY += y; sumZ += z;
  }

  float rangeX = maxX - minX;
  float rangeY = maxY - minY;
  float rangeZ = maxZ - minZ;

  float* activeBuffer; 
  float activeMean;
  
  if (rangeX >= rangeY && rangeX >= rangeZ) {
    activeBuffer = histX; activeMean = sumX / WINDOW_SIZE;
  } else if (rangeY >= rangeX && rangeY >= rangeZ) {
    activeBuffer = histY; activeMean = sumY / WINDOW_SIZE;
  } else {
    activeBuffer = histZ; activeMean = sumZ / WINDOW_SIZE;
  }

  float currentFreq = 0.0;
  float maxSwing = max(rangeX, max(rangeY, rangeZ));

  if (maxSwing > FREQ_MIN_SWING) {
    int crossings = 0;
    bool isAbove = activeBuffer[0] > activeMean;
    for (int i=1; i<WINDOW_SIZE; i++) {
      float val = activeBuffer[i];
      if (isAbove) {
        if (val < (activeMean - FREQ_HYSTERESIS)) { isAbove = false; crossings++; }
      } else {
        if (val > (activeMean + FREQ_HYSTERESIS)) { isAbove = true; crossings++; }
      }
    }
    currentFreq = crossings / 2.0;
  }

  if (Bluefruit.connected()) {
    if (abs(smoothMag - lastSentMag) > SEND_MAG_DEADBAND || 
        abs(currentFreq - lastSentFreq) > SEND_FREQ_DEADBAND) {
      
      bleuart.print("F:");
      bleuart.print(currentFreq, 2);
      bleuart.print(",M:");
      bleuart.println(smoothMag * MAG_SCALE_FACTOR, 1); 
      
      lastSentMag = smoothMag;
      lastSentFreq = currentFreq;
    }
  }
}