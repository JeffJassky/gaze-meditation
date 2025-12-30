#include <LSM6DS3.h>
#include <Wire.h>
#include <bluefruit.h>

#define DEVICE_NAME "GAZE Motion"

// ==========================================
// 1. SLEEP TUNING
// ==========================================
#define SLEEP_TIMEOUT_MS     5000   

#ifndef PIN_LSM6DS3TR_C_INT1
  #define PIN_LSM6DS3TR_C_INT1 11 
#endif

// ==========================================
// 2. KNOCK TUNING
// ==========================================
#define TAP_THRESHOLD_CODE   0x06   
#define WAKEUP_THRESHOLD     0x02   

// 40.0 ensures the spike towers over normal waving data.
#define KNOCK_SPIKE_VALUE    40.0   

// How long to stay blind (in 10ms frames).
// 20 frames = 200ms. We force silence during this time.
#define KNOCK_BLIND_FRAMES   20     

// ==========================================
// 3. VISUALIZATION SETTINGS
// ==========================================
#define SAMPLE_DELAY_MS      10     
#define REPORT_INTERVAL      10     
#define WINDOW_SIZE          100    

// Frequency
#define FREQ_MIN_SWING       0.15   
#define FREQ_HYSTERESIS      0.05   

// Magnitude
#define MAG_SMOOTHING        0.1    
#define MAG_SCALE_FACTOR     10.0   
#define MAG_NOISE_GATE       0.02   
#define SEND_DEADBAND        0.1    

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
volatile bool hardwareInterruptTriggered = false;

// Registers
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
  Bluefruit.setName(DEVICE_NAME);
  bleuart.begin();
  
  Bluefruit.Advertising.addFlags(BLE_GAP_ADV_FLAGS_LE_ONLY_GENERAL_DISC_MODE);
  Bluefruit.Advertising.addTxPower();
  Bluefruit.Advertising.addService(bleuart);
  Bluefruit.Advertising.restartOnDisconnect(true);
  Bluefruit.Advertising.setInterval(32, 244); 
  Bluefruit.Advertising.start(0); 

  if (myIMU.begin() != 0) while(1);

  configureInterrupts();

  pinMode(PIN_LSM6DS3TR_C_INT1, INPUT_PULLDOWN);
  attachInterrupt(digitalPinToInterrupt(PIN_LSM6DS3TR_C_INT1), isrSignal, RISING);

  for(int i=0; i<WINDOW_SIZE; i++) {
    histX[i] = 0; histY[i] = 0; histZ[i] = 0;
  }
  
  lastMotionTime = millis();
}

void isrSignal() {
  hardwareInterruptTriggered = true;
}

void configureInterrupts() {
  myIMU.writeRegister(LSM6DS3_TAP_CFG, 0x9E); // Slope Filter
  myIMU.writeRegister(LSM6DS3_TAP_THS_6D, TAP_THRESHOLD_CODE);
  myIMU.writeRegister(LSM6DS3_INT_DUR2, 0x06);
  myIMU.writeRegister(LSM6DS3_WAKE_UP_THS, 0x80);
  myIMU.writeRegister(LSM6DS3_MD1_CFG, 0x60);
  myIMU.writeRegister(0x10, 0x60); 
}

void loop() {
  unsigned long currentMillis = millis();

  // --- SLEEP WAKEUP ---
  if (hardwareInterruptTriggered) {
    hardwareInterruptTriggered = false;
    isSleeping = false;
    lastMotionTime = currentMillis; 
    checkHardwareSource();
  }

  // --- GO TO SLEEP ---
  if (!isSleeping && (currentMillis - lastMotionTime > SLEEP_TIMEOUT_MS)) {
    isSleeping = true;
    if (Bluefruit.connected()) bleuart.println("STATUS: Sleeping...");
  }

  if (isSleeping) {
    delay(100); 
    return; 
  }

  // --- ACTIVE LOGIC (100Hz) ---
  static unsigned long lastSampleTime = 0;
  if (currentMillis - lastSampleTime >= SAMPLE_DELAY_MS) {
    lastSampleTime = currentMillis;

    float ax = myIMU.readFloatAccelX();
    float ay = myIMU.readFloatAccelY();
    float az = myIMU.readFloatAccelZ();

    // Reset Sleep Timer if moving
    float delta = fabs(ax - lastAx) + fabs(ay - lastAy) + fabs(az - lastAz);
    if (delta > 0.15) lastMotionTime = currentMillis;

    // --- AGGRESSIVE BLINDNESS LOGIC ---
    if (knockBlindness > 0) {
      // 1. BLIND MODE:
      // FORCE the smooth magnitude to ZERO. 
      // Do not allow it to hold onto any previous values.
      smoothMag = 0.0; 
      
      // Also reset the "Previous" acceleration values to current.
      // This prevents a huge "delta" spike when blindness ends.
      lastAx = ax; lastAy = ay; lastAz = az;
      
      knockBlindness--; 
    } 
    else {
      // 2. NORMAL MODE:
      // Update smoothing with real physics
      smoothMag = (MAG_SMOOTHING * delta) + ((1.0 - MAG_SMOOTHING) * smoothMag);
      lastAx = ax; lastAy = ay; lastAz = az;
    }
    
    if (smoothMag < MAG_NOISE_GATE) smoothMag = 0.0;

    // History
    histX[headIndex] = ax;
    histY[headIndex] = ay;
    histZ[headIndex] = az;
    headIndex = (headIndex + 1) % WINDOW_SIZE;
    sampleCounter++;

    if (sampleCounter >= REPORT_INTERVAL) {
      sampleCounter = 0;
      analyzeAndSend();
    }
  }
}

void checkHardwareSource() {
  uint8_t tapSource = 0;
  myIMU.readRegister(&tapSource, LSM6DS3_TAP_SRC);

  if (tapSource & 0x20) {
    if (Bluefruit.connected()) {
      bleuart.println("K:10.0"); // Trigger message
      
      // FLAGS FOR CLEAN VISUALS:
      pendingKnockSend = true;     
      
      // START THE BLACKOUT
      knockBlindness = KNOCK_BLIND_FRAMES; 
      
      // *** ASSASSINATE THE VARIABLE ***
      // We kill smoothMag instantly so there is nothing to "step down" from.
      smoothMag = 0.0; 
    }
    lastMotionTime = millis();
  }
}

void analyzeAndSend() {
  // --- FREQUENCY CALC ---
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

  // --- SEND LOGIC ---
  if (Bluefruit.connected()) {
    
    float valueToSend = 0.0;

    if (pendingKnockSend) {
      // 1. SPIKE FRAME
      valueToSend = KNOCK_SPIKE_VALUE; 
      pendingKnockSend = false;        
    } 
    else {
      // 2. NORMAL FRAME
      // If we are blind, smoothMag is 0.0, so this sends 0.0.
      valueToSend = smoothMag * MAG_SCALE_FACTOR;
    }

    // Deadband check
    // We ALWAYS send if it's a spike (KNOCK_SPIKE_VALUE)
    // Or if the values have changed significantly
    if (valueToSend == KNOCK_SPIKE_VALUE || 
        abs(valueToSend - (lastSentMag * MAG_SCALE_FACTOR)) > SEND_DEADBAND || 
        abs(currentFreq - lastSentFreq) > 0.2) {
      
      bleuart.print("F:"); bleuart.print(currentFreq, 2);
      bleuart.print(",M:"); bleuart.println(valueToSend, 1); 
      
      lastSentMag = smoothMag; // Store the raw 0.0-1.0 value
      lastSentFreq = currentFreq;
    }
  }
}