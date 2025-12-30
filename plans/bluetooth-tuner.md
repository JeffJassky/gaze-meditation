# Project Spec: GAZE Motion Real-Time Tuning System (v2)

**Goal:** Create a bidirectional tuning ecosystem. The frontend must be able to read the device's exact configuration upon connection ("Sync"), and the user must be able to adjust all relevant physics/detection parameters in real-time ("Tune").

**Context:**

- **Hardware:** Arduino/Seeed XIAO nRF52840 Sense (BLE + LSM6DS3 IMU).
- **Firmware:** `/Users/jeffjassky/Projects/ncrs/hardware/GAZE_Motion_Gold.ino`
- **Driver:** `/Users/jeffjassky/Projects/ncrs/src-new/services/devices/accelerometer/accelerometer.ts`
- **Frontend:** `/Users/jeffjassky/Projects/ncrs/src/components/DeviceDebug.vue` & `GAZEMotionTuner.vue`

---

### 1. The Protocol (Extended Contract)

The communication is string-based.

**Incoming Commands (Frontend -> Device):**

- **`?`** -> **REQUEST SYNC.** Device must respond with full config string.
- **`T:[hex]`** -> Tap Threshold (Hardware). e.g., `T:06`
- **`W:[hex]`** -> Wake Threshold (Hardware). e.g., `W:02`
- **`S:[float]`** -> Smoothing Alpha (Software). e.g., `S:0.1`
- **`G:[float]`** -> Freq Gate/Min Swing (Software). e.g., `G:0.15`
- **`H:[float]`** -> Freq Hysteresis (Software). e.g., `H:0.05`
- **`N:[float]`** -> Noise Gate (Software). e.g., `N:0.02` (The "Floor" for movement).
- **`B:[int]`** -> Blind Frames (Software). e.g., `B:20` (Duration to ignore ringing after knock).
- **`V:[float]`** -> Knock Spike Value (Software). e.g., `V:40.0` (Visual height of the pop).

**Outgoing Responses (Device -> Frontend):**

- **`UPDATED:[variable]=[value]`** -> Confirmation echo.
- **`CONF:T=[hex],W=[hex],S=[float],G=[float],H=[float],N=[float],B=[int],V=[float]`**
    - *Example:* `CONF:T=06,W=02,S=0.10,G=0.15,H=0.05,N=0.02,B=20,V=40.0`
    - Sent automatically upon receiving `?`.

---

### 2. Implementation Tasks

### A. Firmware Updates (`GAZE_Motion_Gold.ino`)

- **Global Variables:** Convert these `#define` constants to mutable globals:
    - `TAP_THRESHOLD_CODE` -> `var_tapThreshold` (uint8_t)
    - `WAKEUP_THRESHOLD` -> `var_wakeThreshold` (uint8_t)
    - `MAG_SMOOTHING` -> `var_smoothing` (float)
    - `FREQ_MIN_SWING` -> `var_freqGate` (float)
    - `FREQ_HYSTERESIS` -> `var_freqHyst` (float)
    - `MAG_NOISE_GATE` -> `var_noiseGate` (float)
    - `KNOCK_BLIND_FRAMES` -> `var_blindFrames` (int)
    - `KNOCK_SPIKE_VALUE` -> `var_spikeValue` (float)
- **Command Logic:**
    - Add handlers for `N`, `B`, and `V`.
    - **Implement `?` Handler:** Construct a single CSV-style string with all current values and print it to BLE.
- **Hardware Apply:** Ensure `T` and `W` commands immediately trigger `myIMU.writeRegister(...)` so the physics change instantly.

### B. TypeScript Interface Updates (`accelerometer.ts`)

- **Parsing Logic:** Update `parseLine(line: string)` to handle the new packet types:
    - `CONF:...` -> Parse this string into a configuration object and emit a `config-loaded` event.
- **Sync Method:** Add `requestConfig()` which sends `?`.
- **Auto-Sync:** Call `requestConfig()` automatically inside the `start()` method immediately after the connection is established.

### C. New Vue Component (`GAZEMotionTuner.vue`)

- **State Management:** The component needs local state for all 8 variables.
- **Lifecycle:**
    - On mount (or on device connection), listen for the `config-loaded` event to populate the sliders with the *device's* actual values (preventing "slider jump").
- **UI Controls:**
    - **Hardware Section:**
        - Tap Threshold (Slider 1-31)
        - Wake Threshold (Slider 1-31)
    - **Motion Physics Section:**
        - Smoothing (Slider 0.0-1.0)
        - Noise Gate (Slider 0.0-0.2)
        - Freq Gate (Slider 0.0-1.0)
        - Freq Hysteresis (Slider 0.0-0.2)
    - **Impact Tuning Section:**
        - Blind Frames (Slider 0-50)
        - Visual Spike Height (Slider 10-100)

---

### Definition of Done

1. **Sync Works:** When I reload the web page and connect, the sliders automatically jump to the positions matching the code on the Arduino.
2. **Tuning Works:** I can adjust "Blind Frames" and see the "step down" tail disappear or reappear on the graph in real-time.
3. **Persistency (Optional for now):** Ideally, the values reset on reboot (that's fine), but the frontend allows us to easily see what the "winning" values are so we can copy-paste them back into the `.ino` file for the final build.