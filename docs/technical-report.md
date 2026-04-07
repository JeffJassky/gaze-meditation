# GAZE Application: Technical Report

## 1. Overview

**GAZE** is a web-based, interactive hypnosis and meditation application designed to create a deeply personal and responsive experience for the user. Its core premise is the use of **biofeedback** to guide a user's state of mind.

By leveraging a user's webcam, microphone, and an optional external accelerometer, the application tracks a variety of physiological and behavioral markers in real-time. These "somatic cues"—such as breath rate, eye openness, head position, and physical stillness—are used to dynamically adapt the pacing and content of a guided session. The application responds to the user's physical state, creating a feedback loop that aims to guide them deeper into relaxation and focus.

A key design principle is **privacy**. All biometric data is processed entirely within the user's browser using JavaScript. No data is ever recorded, stored remotely, or transmitted to a server.

## 2. Core Architecture

The application is a single-page application (SPA) built on modern web technologies.

-   **Frontend Framework:** **Vue.js** (v3, using the Composition API) is used for building the user interface. This is evident from the `.vue` file structures, `<script setup>` syntax, and use of reactive primitives like `ref` and `onMounted`.
-   **Core Technologies:**
    -   **WebRTC (`getUserMedia`):** Provides access to the camera feed for video processing.
    -   **Web Speech API (`SpeechRecognition`):** Used for real-time speech-to-text to capture user affirmations or commands.
    -   **Web Bluetooth API:** Enables connection to external hardware, specifically a "Smart Sensor" accelerometer.
    -   **TensorFlow.js / MediaPipe (Inferred):** The use of facial "keypoints" and "landmarks" in `DeviceDebug.vue` strongly suggests a library like MediaPipe FaceMesh is being used for robust face and landmark detection from the camera feed.
-   **Directory Structure:** The project is organized into a `src` directory containing the main application logic and a `src-new` directory which appears to be a newer, refactored architecture for device handling and behavior detection.
    -   `src/components`: Contains all Vue components, including UI pages (`Home.vue`) and complex debug tools (`DeviceDebug.vue`).
    -   `src/services`: Likely holds business logic and services that are not directly tied to a UI component.
    -   `src-new/services/devices`: This is the heart of the data acquisition system. It abstracts away the different hardware inputs (Camera, Mic, etc.) into consistent class-based APIs.
    -   `src-new/behaviors`: Likely contains the logic for defining and detecting specific user behaviors based on the data from the devices.
    -   `src/types.ts`: Provides the TypeScript interfaces for all major data structures in the application, such as `Session`, `SceneConfig`, and `BehaviorSuggestion`.

## 3. Device & Data Acquisition Layer

The application's intelligence is built upon a sophisticated device abstraction layer found in `src-new/services/devices`.

### 3.1. Camera (`Camera` class)

The `Camera` class is the central hub for all vision-based analysis.

-   **Initialization:** It accesses the user's webcam via `navigator.mediaDevices.getUserMedia`.
-   **Face Detection:** It runs a continuous loop to detect a face in the video stream, likely using a library like MediaPipe FaceMesh. The presence of `latestFace.keypoints` confirms this approach.
-   **Region-Based Processing:** The Camera itself does not interpret the facial data. Instead, it implements a **Region of Interest (ROI)** pattern. Other specialized classes, called "Regions," register with the `Camera` instance. On each frame where a face is detected, the `Camera` passes the facial landmark data to each registered region for processing. This is a clean, decoupled architecture.

The primary regions identified in `DeviceDebug.vue` are:

-   **`EyesRegion`:** Focuses on landmarks around the eyes to calculate `eyeOpenness`, and detect `blink` events (including duration). It emits `update` and `blink` events.
-   **`HeadRegion`:** Analyzes the overall position and orientation of the head. It calculates `headPitch`, `headYaw`, and `headRoll`. It is also responsible for higher-level gesture detection like `nod`, `tilt`, and `turn`. Furthermore, it calculates head `stillness` by tracking the velocity of movement and `drift` from a center point.
-   **`MouthRegion`:** Tracks landmarks around the mouth to determine `mouthOpenness` and jaw relaxation. It also contains experimental logic to detect when the `tongue` is out by calculating the ratio of chin-to-lip vs. chin-to-tongue-tip distances.
-   **`BreathRegion`:** Infers a respiration signal (`breathSignal`) and rate (`breathRate`) by fusing multiple facial metrics, likely subtle movements of the nose, chest (if visible), and head bobbing that correlate with breathing.

### 3.2. Microphone (`Microphone` class)

-   **Function:** The `Microphone` class is a wrapper around the browser's native `SpeechRecognition` API.
-   **Operation:** It listens for user speech and provides real-time transcripts. It distinguishes between `interim` results (the live, fluctuating transcript) and `final` results (the stable, completed phrase). This allows the application to ask for and recognize verbal cues or affirmations.

### 3.3. Accelerometer (`Accelerometer` class)

-   **Connection:** This class uses the **Web Bluetooth API** to connect to a specific piece of hardware, referred to as the "Smart Sensor" or "GAZE Motion" device.
-   **Data Stream:** Once connected, the device streams accelerometer data. The `Accelerometer` class processes this raw data to produce:
    -   **`accelFreq`:** The dominant frequency of movement (in Hz).
    -   **`accelMag`:** The overall magnitude of the movement (in G-forces).
-   **State Machine:** It contains a sophisticated state machine to interpret the data into high-level states: `isMoving`, `isWorn` (detecting subtle, persistent motion of being on a body), `isSleeping` (prolonged stillness), and `justImpacted` (detecting a sharp, sudden jolt).

## 4. Somatic Cue & Behavior Detection

The raw data from the device layer is translated into the core "behavior suggestions" that drive the application logic. This is defined by the `BehaviorSuggestion` interface in `src/types.ts`.

A `Scene` in a session can ask the user to perform an action, such as `{ type: 'head:still', duration: 5000 }`. The application's main loop then validates this by checking the corresponding state from the device layer.

Here is how key behaviors are detected, based on `DeviceDebug.vue`:

| Behavior (`type` string) | How It's Detected                                                                                               | Source Device/Region |
| :----------------------- | :-------------------------------------------------------------------------------------------------------------- | :------------------- |
| `head:still`             | `headState.isStable` is `true`. This is derived from the velocity of head landmarks being below a threshold.      | `HeadRegion`         |
| `head:nod`               | A `nod` event is fired from `HeadRegion` after detecting a specific pattern of up-and-down `headPitch` changes.     | `HeadRegion`         |
| `head:left` / `head:right` | A `turn` event is fired from `HeadRegion` when `headYaw` crosses a certain threshold in either direction.         | `HeadRegion`         |
| `head:down` / `head:up`    | A `tilt` event is fired from `HeadRegion` when `headPitch` crosses a certain threshold.                         | `HeadRegion`         |
| `eyes:close`             | `eyeState.isOpen` is `false`. This is determined when the `eyeOpenness` metric drops below a low threshold.      | `EyesRegion`         |
| `eyes:blink`             | A `blink` event is fired when the `EyesRegion` detects a rapid close-and-open sequence.                           | `EyesRegion`         |
| `mouth:relax`            | `mouthState.isRelaxed` is `true`, determined when `mouthOpenness` is above a small threshold, indicating a slack jaw. | `MouthRegion`        |
| `tongue:out`             | A `tongue` event is fired when the `MouthRegion` detects the tongue is extended.                                  | `MouthRegion`        |
| `motion:impact`          | `accelState.justImpacted` is `true` after the sensor fires an `impact` event.                                   | `Accelerometer`      |
| `speech:speak`           | The `Microphone` class receives a `final` transcript from the Speech Recognition API.                             | `Microphone`         |

## 5. Session & Scene Management

The application's content is structured into `Sessions` and `Scenes`, defined in `src/types.ts`.

-   **`Session`:** Represents a complete hypnosis or meditation program. It contains metadata (title, description) and an array of `scenes`.
-   **`SceneConfig`:** A single, atomic step within a `Session`. A scene is highly configurable and can contain:
    -   `voice` or `text` prompts for the user.
    -   `duration`: A forced time limit.
    -   `audio`: Background music, binaural beats, or sound effects.
    -   `behavior`: An array of `BehaviorSuggestion` objects that the user must fulfill to complete the scene.
    -   `onCompleteCallback`: A function that can be used to dynamically decide the next scene, allowing for branching logic based on success or failure.

The application likely operates on a state machine for each scene (e.g., `INSTRUCTING` -> `VALIDATING` -> `REINFORCING_POS`/`REINFORCING_NEG` -> `FINISHED`). This allows it to present an instruction, wait for the user to perform the required biometric action, provide feedback, and then move to the next scene.

## 6. Visualization & UI

The `DeviceDebug.vue` component provides a clear example of how the application visualizes its complex internal state.

-   **Time-Series Graphs:** For continuous metrics (e.g., `eyeOpenness`, `breathSignal`), the UI maintains a rolling history of the last ~300 data points and uses SVG `<path>` elements to draw line graphs. This gives an immediate visual representation of the user's physiological state over the last few seconds.
-   **State Indicators:** Discrete states (e.g., `isNodding`, `isStable`, `isTongueOut`) are shown as binary "pills" or badges that change color to indicate when a specific event has been detected.
-   **Live Webcam Feed:** A `<canvas>` element is used to render the live video from the webcam. Crucially, it also draws the facial landmarks (eyes, head, mouth) on top of the video, color-coded by region. This is an invaluable tool for debugging the accuracy of the underlying face detection model.
-   **Reactivity:** The entire debug interface is powered by Vue's reactivity system. The core `loop()` function updates the `currentMetrics` ref on every `requestAnimationFrame`, and the UI components automatically re-render to reflect these changes without any manual DOM manipulation.
