#include <LSM6DS3.h>
#include <Wire.h>
#include <bluefruit.h>

#define DEVICE_NAME "GAZE Motion"

// ==========================================
// 0. DEBUGGING
// ==========================================
#define DEBUG_MONITOR true // Set to true to mirror output to Serial Monitor

// ==========================================
// 1. SLEEP TUNING (Critical for 40mAh)
// ==========================================
#define SLEEP_TIMEOUT_MS     5000   // Go to sleep after 5s of silence

// ==========================================
// 2. KNOCK TUNING
// ==========================================
#define TAP_THRESHOLD_CODE   0x01   // Max Sensitivity
#define KNOCK_SPIKE_VALUE    40.0   // Visual Spike Height
#define KNOCK_BLIND_FRAMES   20     // 200ms blindness after hit

// ==========================================
// 3. VISUALIZATION SETTINGS
// ==========================================
#define SAMPLE_DELAY_MS      10     // Polling rate (10ms = 100Hz)
#define REPORT_INTERVAL      10     // Send report every 10 samples (100ms interval)
#define WINDOW_SIZE          100    // Analysis window (100 samples = 1 second of history)
#define FREQ_MIN_SWING       0.15   // Min G-force swing required to calculate frequency
#define FREQ_HYSTERESIS      0.05   // Noise buffer around mean for zero-crossing detection
#define MAG_SMOOTHING        0.1    // Smoothing factor (lower = smoother, more lag)
#define MAG_NOISE_GATE       0.1    // Raw G-force threshold (0.1G * 10 = 1.0 magnified)
#define MAG_SCALE_FACTOR     10.0   // Magnification factor for BLE reporting (0-2G -> 0-20.0)
#define SEND_DEADBAND        0.1    // Min change in magnified magnitude to trigger update

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

// KNOCK STATE
bool  pendingKnockSend = false; 
int   knockBlindness = 0;       

// SLEEP STATE
bool isSleeping = false;
unsigned long lastMotionTime = 0;

// Registers
#define LSM6DS3_TAP_CFG      0x58
#define LSM6DS3_TAP_THS_6D   0x59
#define LSM6DS3_INT_DUR2     0x5A
#define LSM6DS3_WAKE_UP_THS  0x5B
#define LSM6DS3_WAKE_UP_SRC  0x1B
#define LSM6DS3_MD1_CFG      0x5E 
#define LSM6DS3_TAP_SRC      0x1C

// Forward declarations
void broadcastLine(String msg);

void setup() {
  Serial.begin(9600);
  
  // DISABLE LED to save power (prevent brownout)
  pinMode(LED_RED, OUTPUT);
  digitalWrite(LED_RED, HIGH); 

  // BLE Setup
  Bluefruit.begin();
  // LOWER POWER: +4dBm is too strong for a 40mAh battery on a spike.
  // 0dBm is standard. If it still crashes, change this to -4.
  Bluefruit.setTxPower(-4); 
  Bluefruit.autoConnLed(false);
  Bluefruit.setName(DEVICE_NAME);
  bleuart.begin();
  
  Bluefruit.Advertising.addFlags(BLE_GAP_ADV_FLAGS_LE_ONLY_GENERAL_DISC_MODE);
  Bluefruit.Advertising.addTxPower();
  Bluefruit.Advertising.addService(bleuart);
  Bluefruit.Advertising.restartOnDisconnect(true);
  
  // Advertise fast for 30s, then slow down to save battery
  Bluefruit.Advertising.setFastTimeout(30); 
  Bluefruit.Advertising.setInterval(32, 244); 
  Bluefruit.Advertising.start(0); 

  if (myIMU.begin() != 0) while(1);

  configureInterrupts();
  
  // Attach Interrupt to Board's default INT1 pin
  pinMode(PIN_LSM6DS3TR_C_INT1, INPUT_PULLDOWN);
  attachInterrupt(digitalPinToInterrupt(PIN_LSM6DS3TR_C_INT1), isrWakeup, RISING);

  for(int i=0; i<WINDOW_SIZE; i++) {
    histX[i] = 0; histY[i] = 0; histZ[i] = 0;
  }
  
  lastMotionTime = millis();
}

void isrWakeup() {
  // Empty ISR just to wake the CPU from 'waitForEvent()'
}

void configureInterrupts() {
  // 1. Enable Tap + Latch
  myIMU.writeRegister(LSM6DS3_TAP_CFG, 0x9F); 
  // 2. Tap Threshold
  myIMU.writeRegister(LSM6DS3_TAP_THS_6D, TAP_THRESHOLD_CODE);
  // 3. Duration
  myIMU.writeRegister(LSM6DS3_INT_DUR2, 0x03);
  // 4. Wake Up Threshold (CRITICAL: 0x84)
  myIMU.writeRegister(LSM6DS3_WAKE_UP_THS, 0x84); 
  // 5. Routing (Tap + WakeUp to INT1)
  myIMU.writeRegister(LSM6DS3_MD1_CFG, 0x60);
  // 6. High Speed Mode
  myIMU.writeRegister(0x10, 0x60); 
}

void loop() {
  unsigned long currentMillis = millis();

  // ==========================================
  // 1. CHECK FOR SLEEP
  // ==========================================
  if (!isSleeping && (currentMillis - lastMotionTime > SLEEP_TIMEOUT_MS)) {
    isSleeping = true;
    broadcastLine("STATUS: Sleeping...");
  }

  // ==========================================
  // 2. SLEEP MODE (Low Power)
  // ==========================================
  if (isSleeping) {
    // CPU halts here until Pin 11 goes HIGH
    waitForEvent(); 
    
    // ... WOKE UP ...
    isSleeping = false;
    lastMotionTime = millis();
    broadcastLine("STATUS: Awake!");
  }

  // ==========================================
  // 3. ACTIVE MODE (Polling)
  // ==========================================
  static unsigned long lastSampleTime = 0;
  if (millis() - lastSampleTime >= SAMPLE_DELAY_MS) {
    lastSampleTime = millis();

    // A. POLL HARDWARE TAP
    uint8_t tapSource = 0;
    myIMU.readRegister(&tapSource, LSM6DS3_TAP_SRC);
    
    // B. POLL WAKEUP SOURCE (Crucial "Flag Cleaner")
    // We must read this register to clear the "Wiggle" flag.
    // If we don't, the pin stays HIGH and we can never sleep/wake again.
    uint8_t wakeSource = 0;
    myIMU.readRegister(&wakeSource, LSM6DS3_WAKE_UP_SRC);

    // Check for Knock
    if ((tapSource & 0x20) && knockBlindness == 0) {
      broadcastLine("K:10.0"); 
      pendingKnockSend = true;     
      knockBlindness = KNOCK_BLIND_FRAMES; 
      smoothMag = 0.0; 
      lastMotionTime = millis(); 
    } 

    // Wake Keep-Alive
    // If either Tap OR WakeUp (bit 3 of wakeSource) is true, stay awake
    if ((tapSource & 0x20) || (wakeSource & 0x08)) {
       lastMotionTime = millis();
    }

    // C. READ MOTION
    float ax = myIMU.readFloatAccelX();
    float ay = myIMU.readFloatAccelY();
    float az = myIMU.readFloatAccelZ();

    float delta = fabs(ax - lastAx) + fabs(ay - lastAy) + fabs(az - lastAz);
    lastAx = ax; lastAy = ay; lastAz = az;

    // Redundant software wake-keep (just in case)
    if (delta > 0.1) lastMotionTime = millis();

    // D. SMOOTHING
    if (knockBlindness > 0) {
      smoothMag = 0.0; 
      knockBlindness--; 
    } 
    else {
      smoothMag = (MAG_SMOOTHING * delta) + ((1.0 - MAG_SMOOTHING) * smoothMag);
    }
    if (smoothMag < MAG_NOISE_GATE) smoothMag = 0.0;

    // History
    histX[headIndex] = ax; histY[headIndex] = ay; histZ[headIndex] = az;
    headIndex = (headIndex + 1) % WINDOW_SIZE;
    sampleCounter++;

    // E. SEND
    if (sampleCounter >= REPORT_INTERVAL) {
      sampleCounter = 0;
      analyzeAndSend();
    }
  }
}

void analyzeAndSend() {
  float minX=100, maxX=-100, minY=100, maxY=-100, minZ=100, maxZ=-100;
  for (int i=0; i<WINDOW_SIZE; i++) {
    float x = histX[i]; if (x<minX) minX=x; if (x>maxX) maxX=x;
    float y = histY[i]; if (y<minY) minY=y; if (y>maxY) maxY=y;
    float z = histZ[i]; if (z<minZ) minZ=z; if (z>maxZ) maxZ=z;
  }
  float rangeX = maxX - minX; float rangeY = maxY - minY; float rangeZ = maxZ - minZ;
  float maxSwing = max(rangeX, max(rangeY, rangeZ));
  float currentFreq = 0.0;

  if (maxSwing > FREQ_MIN_SWING) {
    float* activeBuffer = (rangeX>=rangeY && rangeX>=rangeZ) ? histX : (rangeY>=rangeX) ? histY : histZ;
    float sum=0; for(int i=0; i<WINDOW_SIZE; i++) sum+=activeBuffer[i];
    float mean = sum/WINDOW_SIZE;
    int crossings = 0;
    bool isAbove = activeBuffer[0] > mean;
    for (int i=1; i<WINDOW_SIZE; i++) {
      if (isAbove && activeBuffer[i] < (mean - FREQ_HYSTERESIS)) { isAbove=false; crossings++; }
      else if (!isAbove && activeBuffer[i] > (mean + FREQ_HYSTERESIS)) { isAbove=true; crossings++; }
    }
    currentFreq = crossings / 2.0;
  }

  float valueToSend = pendingKnockSend ? KNOCK_SPIKE_VALUE : smoothMag * MAG_SCALE_FACTOR;
  if (pendingKnockSend) pendingKnockSend = false;

  if (valueToSend == KNOCK_SPIKE_VALUE || 
      abs(valueToSend - (lastSentMag * MAG_SCALE_FACTOR)) > SEND_DEADBAND || 
      abs(currentFreq - lastSentFreq) > 0.2) {
    
    // Format the string for unified sending
    String output = "F:" + String(currentFreq, 2) + ",M:" + String(valueToSend, 1);
    broadcastLine(output);

    lastSentMag = smoothMag; lastSentFreq = currentFreq;
  }
}

// ==========================================
// UNIFIED MESSAGING
// ==========================================
void broadcastLine(String msg) {
  // 1. Send to Serial Monitor if enabled
  if (DEBUG_MONITOR) {
    Serial.println(msg);
  }
  
  // 2. Send to BLE if connected
  if (Bluefruit.connected()) {
    bleuart.println(msg);
  }
}