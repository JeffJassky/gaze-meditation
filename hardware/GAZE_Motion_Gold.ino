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
uint8_t var_tapThreshold = 0x03;   // T: Max Sensitivity
float   var_spikeValue   = 100.0;  // V: Visual Spike Height
int     var_blindFrames  = 0;      // B: 200ms blindness after hit

// ==========================================
// 3. VISUALIZATION SETTINGS
// ==========================================
#define WINDOW_SIZE_MAX      100    // Max Analysis window

int     var_sampleDelay  = 10;      // D: Polling rate (10ms = 100Hz)
int     var_reportInterval = 10;    // I: Send report every 10 samples
int     var_windowSize   = 100;     // Z: Analysis window (<= WINDOW_SIZE_MAX)

float   var_freqGate     = 0.52;    // G: Min G-force swing required to calculate frequency
float   var_freqHyst     = 0.50;    // H: Noise buffer around mean for zero-crossing detection
float   var_smoothing    = 0.01;    // S: Smoothing factor (lower = smoother, more lag)
float   var_noiseGate    = 0.03;    // N: Raw G-force threshold (0.1G * 10 = 1.0 magnified)
uint8_t var_wakeThreshold = 0x03;   // W: Wake Up Threshold

#define MAG_SCALE_FACTOR     10.0   // Magnification factor for BLE reporting (0-2G -> 0-20.0)
float   var_deadband     = 0.01;    // X: Min change in magnified magnitude to trigger update

// ==========================================
// GLOBALS
// ==========================================
LSM6DS3 myIMU(I2C_MODE, 0x6A); 
BLEUart bleuart;
String commandBuffer = "";

float histX[WINDOW_SIZE_MAX];
float histY[WINDOW_SIZE_MAX];
float histZ[WINDOW_SIZE_MAX];
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
void processCommand(String cmd);

void setup() {
  Serial.begin(9600);
  
  // DISABLE LED to save power (prevent brownout)
  pinMode(LED_RED, OUTPUT);
  digitalWrite(LED_RED, LOW); // ON = Awake 

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

  for(int i=0; i<WINDOW_SIZE_MAX; i++) {
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
  myIMU.writeRegister(LSM6DS3_TAP_THS_6D, var_tapThreshold);
  // 3. Duration
  myIMU.writeRegister(LSM6DS3_INT_DUR2, 0x03);
  // 4. Wake Up Threshold
  myIMU.writeRegister(LSM6DS3_WAKE_UP_THS, var_wakeThreshold); 
  // 5. Routing (Tap + WakeUp to INT1)
  myIMU.writeRegister(LSM6DS3_MD1_CFG, 0x60);
  // 6. High Speed Mode
  myIMU.writeRegister(0x10, 0x60); 
}

void loop() {
  // ==========================================
  // 0. READ COMMANDS
  // ==========================================
  while (Bluefruit.connected() && bleuart.available()) {
    char ch = (char) bleuart.read();
    if (ch == '\n' || ch == '\r') {
      if (commandBuffer.length() > 0) processCommand(commandBuffer);
      commandBuffer = "";
    } else {
      commandBuffer += ch;
    }
  }

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
    digitalWrite(LED_RED, HIGH); // OFF = Sleep
    // CPU halts here until Pin 11 goes HIGH
    waitForEvent(); 
    
    // ... WOKE UP ...
    digitalWrite(LED_RED, LOW);  // ON = Awake
    isSleeping = false;
    lastMotionTime = millis();
    broadcastLine("STATUS: Awake!");
  }

  // ==========================================
  // 3. ACTIVE MODE (Polling)
  // ==========================================
  static unsigned long lastSampleTime = 0;
  if (millis() - lastSampleTime >= var_sampleDelay) {
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
      broadcastLine("K:" + String(var_spikeValue, 1)); 
      pendingKnockSend = true;     
      knockBlindness = var_blindFrames; 
      smoothMag = 0.0; 
      lastMotionTime = millis(); 
    } 

    // Wake Keep-Alive
    // If Tap (bit 5) is true, stay awake. We ignore WakeUp (bit 3) here 
    // because it might be too sensitive. We rely on smoothMag > 0 to stay awake.
    if (tapSource & 0x20) {
       lastMotionTime = millis();
    }

    // C. READ MOTION
    float ax = myIMU.readFloatAccelX();
    float ay = myIMU.readFloatAccelY();
    float az = myIMU.readFloatAccelZ();

    float delta = fabs(ax - lastAx) + fabs(ay - lastAy) + fabs(az - lastAz);
    lastAx = ax; lastAy = ay; lastAz = az;

    // D. SMOOTHING
    if (knockBlindness > 0) {
      smoothMag = 0.0; 
      knockBlindness--; 
    } 
    else {
      smoothMag = (var_smoothing * delta) + ((1.0 - var_smoothing) * smoothMag);
    }
    if (smoothMag < var_noiseGate) smoothMag = 0.0;

    // STAY AWAKE if we have significant motion
    if (smoothMag > 0) lastMotionTime = millis();

    // History
    histX[headIndex] = ax; histY[headIndex] = ay; histZ[headIndex] = az;
    headIndex = (headIndex + 1) % var_windowSize;
    sampleCounter++;

    // E. SEND
    if (sampleCounter >= var_reportInterval) {
      sampleCounter = 0;
      analyzeAndSend();
    }
  }
}

void processCommand(String cmd) {
  cmd.trim();
  if (cmd.length() == 0) return;

  if (cmd == "?") {
     String conf = "CONF:";
     conf += "T=" + String(var_tapThreshold, HEX) + ",";
     conf += "W=" + String(var_wakeThreshold, HEX) + ",";
     conf += "S=" + String(var_smoothing, 2) + ",";
     conf += "G=" + String(var_freqGate, 2) + ",";
     conf += "H=" + String(var_freqHyst, 2) + ",";
     conf += "N=" + String(var_noiseGate, 2) + ",";
     conf += "B=" + String(var_blindFrames) + ",";
     conf += "V=" + String(var_spikeValue, 1) + ",";
     conf += "D=" + String(var_sampleDelay) + ",";
     conf += "I=" + String(var_reportInterval) + ",";
     conf += "X=" + String(var_deadband, 2) + ",";
     conf += "Z=" + String(var_windowSize);
     broadcastLine(conf);
     return;
  }

  // Expect "X:Value"
  int colonIndex = cmd.indexOf(':');
  if (colonIndex == -1) return;

  char key = cmd.charAt(0);
  String valStr = cmd.substring(colonIndex + 1);

  if (key == 'T') {
    // Hex parse
    var_tapThreshold = (uint8_t) strtol(valStr.c_str(), NULL, 16);
    myIMU.writeRegister(LSM6DS3_TAP_THS_6D, var_tapThreshold);
    broadcastLine("UPDATED:T=" + String(var_tapThreshold, HEX));
  }
  else if (key == 'W') {
    var_wakeThreshold = (uint8_t) strtol(valStr.c_str(), NULL, 16);
    myIMU.writeRegister(LSM6DS3_WAKE_UP_THS, var_wakeThreshold);
    broadcastLine("UPDATED:W=" + String(var_wakeThreshold, HEX));
  }
  else if (key == 'S') {
    var_smoothing = valStr.toFloat();
    broadcastLine("UPDATED:S=" + String(var_smoothing, 2));
  }
  else if (key == 'G') {
    var_freqGate = valStr.toFloat();
    broadcastLine("UPDATED:G=" + String(var_freqGate, 2));
  }
  else if (key == 'H') {
    var_freqHyst = valStr.toFloat();
    broadcastLine("UPDATED:H=" + String(var_freqHyst, 2));
  }
  else if (key == 'N') {
    var_noiseGate = valStr.toFloat();
    broadcastLine("UPDATED:N=" + String(var_noiseGate, 2));
  }
  else if (key == 'B') {
    var_blindFrames = valStr.toInt();
    broadcastLine("UPDATED:B=" + String(var_blindFrames));
  }
  else if (key == 'V') {
    var_spikeValue = valStr.toFloat();
    broadcastLine("UPDATED:V=" + String(var_spikeValue, 1));
  }
  else if (key == 'D') {
    var_sampleDelay = valStr.toInt();
    if (var_sampleDelay < 1) var_sampleDelay = 1;
    broadcastLine("UPDATED:D=" + String(var_sampleDelay));
  }
  else if (key == 'I') {
    var_reportInterval = valStr.toInt();
    if (var_reportInterval < 1) var_reportInterval = 1;
    broadcastLine("UPDATED:I=" + String(var_reportInterval));
  }
  else if (key == 'X') {
    var_deadband = valStr.toFloat();
    broadcastLine("UPDATED:X=" + String(var_deadband, 2));
  }
  else if (key == 'Z') {
    var_windowSize = valStr.toInt();
    if (var_windowSize > WINDOW_SIZE_MAX) var_windowSize = WINDOW_SIZE_MAX;
    if (var_windowSize < 2) var_windowSize = 2;
    // Reset head to safe range
    headIndex = 0;
    broadcastLine("UPDATED:Z=" + String(var_windowSize));
  }
}

void analyzeAndSend() {
  float minX=100, maxX=-100, minY=100, maxY=-100, minZ=100, maxZ=-100;
  // Use var_windowSize instead of fixed size
  for (int i=0; i<var_windowSize; i++) {
    float x = histX[i]; if (x<minX) minX=x; if (x>maxX) maxX=x;
    float y = histY[i]; if (y<minY) minY=y; if (y>maxY) maxY=y;
    float z = histZ[i]; if (z<minZ) minZ=z; if (z>maxZ) maxZ=z;
  }
  float rangeX = maxX - minX; float rangeY = maxY - minY; float rangeZ = maxZ - minZ;
  float maxSwing = max(rangeX, max(rangeY, rangeZ));
  float currentFreq = 0.0;

  if (maxSwing > var_freqGate) {
    float* activeBuffer = (rangeX>=rangeY && rangeX>=rangeZ) ? histX : (rangeY>=rangeX) ? histY : histZ;
    float sum=0; for(int i=0; i<var_windowSize; i++) sum+=activeBuffer[i];
    float mean = sum/var_windowSize;
    int crossings = 0;
    bool isAbove = activeBuffer[0] > mean;
    for (int i=1; i<var_windowSize; i++) {
      if (isAbove && activeBuffer[i] < (mean - var_freqHyst)) { isAbove=false; crossings++; }
      else if (!isAbove && activeBuffer[i] > (mean + var_freqHyst)) { isAbove=true; crossings++; }
    }
    currentFreq = crossings / 2.0;
  }

  float valueToSend = pendingKnockSend ? var_spikeValue : smoothMag * MAG_SCALE_FACTOR;
  if (pendingKnockSend) pendingKnockSend = false;

  if (valueToSend == var_spikeValue || 
      abs(valueToSend - (lastSentMag * MAG_SCALE_FACTOR)) > var_deadband || 
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