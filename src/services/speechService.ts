import { ref, reactive } from 'vue'

// Define types for SpeechRecognition since they might not be in all TS envs
// or we can rely on dom.d.ts if it's new enough.
// To be safe, we can just use the window expansion or 'any' cast if needed,
// but let's try to assume they exist or use basic interface.

class SpeechService {
  private recognition: SpeechRecognition | null = null
  public isListening = ref(false)
  public transcript = ref('')
  public lastResult = ref('') // The most recent result segment
  public error = ref<string | null>(null)
  
  private _isStopping = false

  async init() {
     this._isStopping = false
     if (this.recognition) return

     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
     if (!SpeechRecognition) {
        console.error('Speech API not supported')
        this.error.value = 'Speech API not supported'
        return
     }

     this.recognition = new SpeechRecognition()
     this.recognition.continuous = true
     this.recognition.interimResults = true
     this.recognition.lang = 'en-US'

     this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = ''
        let finalTranscript = ''

        // We can choose to append to a global transcript or just expose the latest
        // For our use cases (matching words), a running transcript of the current session is good.
        // But if it runs forever, it gets huge.
        // Let's just update a "window" of transcript or let the user reset it.
        
        // Actually, for `continuous=true`, the results array grows.
        // We probably want to just reconstruct the current buffer.
        
        let full = ''
        for (let i = 0; i < event.results.length; ++i) {
           full += event.results[i][0].transcript
        }
        this.transcript.value = full
        
        // Also update lastResult for event-driven logic (like "did he just say X?")
        const lastIdx = event.results.length - 1
        if (lastIdx >= 0) {
            this.lastResult.value = event.results[lastIdx][0].transcript
        }
     }

     this.recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') return
        console.warn('Speech Recognition Error', event.error)
        this.error.value = event.error
     }

     this.recognition.onend = () => {
        this.isListening.value = false
        // Auto-restart if not explicitly stopped
        if (!this._isStopping && this.recognition) {
           try {
              this.recognition.start()
              this.isListening.value = true
           } catch (e) {
              console.warn('Speech auto-restart failed', e)
           }
        }
     }
  }

  start() {
     this._isStopping = false
     if (!this.recognition) {
        this.init()
     }
     
     if (this.recognition && !this.isListening.value) {
        try {
           this.recognition.start()
           this.isListening.value = true
           console.log('Speech Service Started')
        } catch (e) {
           // Already started?
           console.warn('Speech start error', e)
        }
     }
  }

  stop() {
     this._isStopping = true
     if (this.recognition) {
        this.recognition.stop()
        this.recognition = null
     }
     this.isListening.value = false
     console.log('Speech Service Stopped')
  }

  resetTranscript() {
     this.transcript.value = ''
     this.lastResult.value = ''
     // Note: resetting transcript variable doesn't clear internal recognition memory of previous results
     // if the session is continuous. To truly clear, we might need to restart.
     // But for string matching, clearing our ref is usually enough if we only care about new input.
     // However, SpeechInstruction logic iterates over the whole transcript string.
     // If we want a fresh start for an instruction, we should probably stop and start the recognition?
     // Or just track the index/offset.
     // Let's force a restart if we really want a clean slate, OR simpler:
     // Just accept that `transcript` might contain old history if we don't restart.
     // But to keep it efficient, restarting is better to clear memory.
     if (this.recognition) {
         this.stop()
         this.init() // Re-init creates new instance
         this.start()
     }
  }
}

export const speechService = new SpeechService()
