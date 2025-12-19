**Gaze** is an open-source, interactive meditation theatre running entirely in the browser. It combines biometric feedback (via webcam), eye-tracking, and hypnotic scripting to create a deeply immersive somatic experience.

Unlike passive video, **Gaze** waits for you. It knows when you are looking away, it knows when your jaw is tense, and it asks for your consent before proceeding.

### [👁️ Launch the Experience](https://www.google.com/search?q=https://jeffjassky.github.io/gaze-meditation)

---

## 🌑 The Concept

Modern meditation apps are passive audio players. **Gaze** is an active participant in your relaxation. By using client-side computer vision, the application creates a "Bio-Feedback Loop":

1. **Instruction:** The app guides you into a state (e.g., "Look at the center," "Relax your jaw").
2. **Verification:** The app uses the webcam to verify compliance using gaze detection and facial landmark tracking.
3. **Progression:** The script advances only when the physical state is achieved, deepening the immersion.

## ⚡ Features

- **Somatic Triggers:** Detects specific physical states including:
    - **Jaw Relaxation:** Measures mouth openness and muscle slack.
    - **Stillness:** Monitors head movement tolerance.
    - **Nod/Shake Detection:** Allows for non-verbal "Yes/No" interaction.
    - **Blink Detection:** Used for eye-fatigue inductions.
- **Compelled Speech:** Suggest and confirm verbal affirmations.
- **Compelled Interaction:** Keyboard typing prompts and form inputs for compliance.
- **Dynamic Pacing:** Text duration is algorithmically calculated based on sentence structure, ensuring a natural reading rhythm.
- **Privacy First:** **All computer vision processing is done 100% locally in your browser.** No video data is ever sent to a server.

## 📚 Included Programs

The application comes pre-loaded with several "flows" or programs:

- **The Somatic Dissolve (20 min):** A full-body deep relaxation session focusing on jaw release and shoulder tension.

## 🛠️ For Developers

Gaze is built with **TypeScript** and designed to be extensible. You can write your own hypnotic scripts using the JSON-like `Program` structure.

### Installation

Bash

`# Clone the repository
git clone https://github.com/jeffjassky/gaze-meditation.git

# Install dependencies
npm install

# Run local development server
npm run dev`

### Creating Custom Programs

You can add new scripts in the `programs` directory. The engine supports a variety of Instruction types:

TypeScript

`// Example: A simple interaction block
new RelaxJawInstruction({
    prompt: 'Let your mouth hang open...',
    duration: 30000 
}),
new NodInstruction({
    prompt: 'Do you feel the tension leaving?',
    nodsRequired: 1,
    type: 'YES'
})`

## 🔒 Privacy & Permissions

To function, **Gaze** requires access to your:

1. **Camera:** To track eye movement and facial expressions.
2. **Microphone:** (Optional) For speech recognition segments.

**Note:** A green light will appear next to your camera when active. This feed is processed instantly by JavaScript on your device and is never recorded, stored, or transmitted.

## 🤝 Contributing

Contributions are welcome! Whether you are a developer improving the face-tracking algorithms or a writer submitting new Hypnosis Scripts (`Programs`), please feel free to open a Pull Request.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.