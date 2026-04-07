# GAZE Tech Deep Dive: The Technology Behind the Biofeedback

This document breaks down the specific technology and algorithms used to implement the "Somatic Triggers & Features" highlighted on the GAZE home page. It's intended to provide the technical detail needed for a blog post or developer-focused content.

## The Foundation: MediaPipe Face Mesh

The magic behind most of the camera-based tracking comes from a powerful underlying technology, which we can infer is **Google's MediaPipe Face Mesh**. This model provides 478 3D facial "landmarks" in real-time from a simple webcam feed.

![Image of MediaPipe's facial landmarks](https://i.imgur.com/v2pL6A1.png)

These landmarks are the raw ingredients. Our application's intelligence comes from how it interprets the geometry and movement of these points to create meaningful signals. The application organizes this logic into "Regions" (e.g., `EyesRegion`, `HeadRegion`) that subscribe to this stream of landmark data.

---

### 1. Stillness Tracking & Head Heaviness

**How it works:**

-   **3D Pose Estimation:** The Face Mesh model doesn't just give us 2D (x, y) coordinates; it provides 3D (x, y, z) coordinates for the head in a virtual space. From this, it's possible to calculate the head's rotation as **Pitch** (nodding up/down), **Yaw** (turning left/right), and **Roll** (tilting side-to-side).
-   **Stillness Score (`stability`):**
    1.  The `HeadRegion` tracks the position of a stable landmark (like the tip of the nose, #1) from one frame to the next.
    2.  It calculates the frame-to-frame velocity of this point: `velocity = distance_moved / time_elapsed`.
    3.  This velocity is then smoothed and inverted to create a "stillness score". A high velocity means low stillness, and near-zero velocity means high stillness. The `isStable` flag is set when this score stays above a certain threshold for a set duration.
-   **Head Heaviness (Head Drop):** This is detected by monitoring the `headPitch` value. A "heavy" head is characterized by a sustained downward pitch angle. The application can set a trigger for when `headPitch` drops below a certain angle (e.g., -15 degrees) and stays there.

### 2. Nod & Turn Detection

**How it works:**

-   This is an extension of the 3D pose estimation. The `HeadRegion` monitors the stream of `headPitch` and `headYaw` values for specific patterns:
    -   **Nod ("Yes"):** A "nod" is not just a downward head position; it's a *gesture*. The application detects a specific sequence:
        1.  A rapid decrease in `headPitch` (head goes down).
        2.  Followed immediately by a rapid increase back to the original position (head comes up).
        3.  All occurring within a short time window (e.g., ~500ms).
        When this pattern is recognized, a `nod` event is dispatched.
    -   **Turn ("No"):** Similarly, a "turn" is detected by looking for a peak-and-return pattern in the `headYaw` values.

### 3. Blink & Eyelid Heaviness

**How it works:**

-   **Eye Aspect Ratio (EAR):** The `EyesRegion` uses the landmarks around the eyes to calculate a value representing how "open" the eye is. The core concept is the Eye Aspect Ratio. While the library provides a normalized `openness` value, the principle is the same: it's a ratio of the height of the eye to its width.
    -   `EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)`
    -   Where p1-p6 are the landmarks around the eye.
-   **Blink Detection:** A blink is a very distinct pattern in the EAR signal: a sharp drop towards zero, followed by a quick return to the baseline. The `EyesRegion` is tuned to detect this specific pattern and fire a `blink` event, even capturing the `duration` of the blink in milliseconds.
-   **Eyelid Heaviness / Droop:** This is a more subtle and powerful indicator of trance or fatigue. The code in `DeviceDebug.vue` reveals the precise logic:
    `isDrooping = isOpen && open < 0.6 && !isBlink`.
    This translates to: "The eye is considered 'drooping' if it is technically open, but its openness value is less than 60% of normal, and this is a sustained state, not a brief blink."

### 4. Jaw Relaxation

**How it works:**

-   This is one of the simpler but more effective metrics.
-   The `MouthRegion` tracks the landmarks on the upper lip (e.g., #13) and the lower lip (#14).
-   It calculates the vertical distance between these two points on every frame.
-   The `isRelaxed` state is triggered when this distance exceeds a certain threshold. A tense or closed mouth will have a small distance, while a slack, relaxed jaw will cause the mouth to hang open slightly, increasing the distance and triggering the detection.

### 5. Tongue Out (Experimental)

**How it works:**

-   This is a fantastic example of creative feature engineering from the available landmark data.
-   The `MouthRegion` uses three key points:
    1.  A stable point on the chin (landmark #152).
    2.  The center of the bottom lip (#14).
    3.  The tip of the tongue (if visible).
-   It calculates a **ratio** of distances: `tongueMetric = distance(chin, tongue_tip) / distance(chin, bottom_lip)`.
-   When the tongue is inside the mouth, the `tongue_tip` landmark is not visible or is located close to the lip, so this ratio is less than or equal to 1.0.
-   When the tongue is stuck out, its tip is further away from the chin than the lip is, causing the ratio to become greater than 1.0. This is a robust way to detect this specific gesture.

### 6. Verbal Affirmations (Speech Recognition)

**How it works:**

-   This feature moves beyond the camera to the microphone.
-   It uses the browser's built-in **Web Speech API (`SpeechRecognition`)**. This is a powerful and privacy-preserving API that performs voice-to-text conversion directly on the user's device.
-   The `Microphone` class listens for speech and captures the final, confirmed text of what was said.
-   A `Scene` in a session can then be configured to wait for a `speech:speak` behavior. The application logic would then compare the recognized text to an expected affirmation. For example:
    -   **Prompt:** "Say, 'I am feeling calm.'"
    -   **Validation:** The app checks if the final transcript from the microphone `includes('i am feeling calm')`.
    -   **Result:** If it matches, the session successfully proceeds.

### 7. Breath Monitoring

**How it works:**

-   This is arguably the most complex and subtle signal to extract from video. It is labeled in the debug view as a "fused" signal, meaning it combines multiple weak signals to create one stronger, more reliable one.
-   The `BreathRegion` is likely tracking:
    -   **Head Motion:** The subtle up-and-down "bobbing" of the head (`headPitch`) that often syncs with breathing.
    -   **Chest/Shoulder Motion:** If the upper chest is visible in the frame, it tracks the rise and fall of landmarks on the shoulders.
    -   **Nostril Flare/Facial Movement:** Minute movements in the nose and cheek area can also correlate with the inhale/exhale cycle.
-   By **fusing** these different signals—likely through a weighted average or a more complex filtering algorithm (like a Kalman filter)—the system can cancel out noise and amplify the core rhythm of the breath, producing a `breathSignal` that approximates the user's respiration cycle.
