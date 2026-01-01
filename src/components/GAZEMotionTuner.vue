<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { Accelerometer } from '../../src-new/services/devices/accelerometer/accelerometer'

const props = defineProps<{
  accelerometer: Accelerometer | null
}>()

// -- State --
// We store values as numbers for the sliders, but some need hex conversion for display/sending
const tapThreshold = ref(3)      // T (1-31)
const wakeThreshold = ref(3)     // W (1-31)
const smoothing = ref(0.01)      // S (0.0 - 1.0)
const freqGate = ref(0.52)       // G (0.0 - 2.0)
const freqHyst = ref(0.50)       // H (0.0 - 0.5)
const noiseGate = ref(0.03)      // N (0.0 - 0.5)
const blindFrames = ref(0)       // B (0 - 60)
const spikeValue = ref(100.0)    // V (10 - 100)

// Advanced
const sampleDelay = ref(10)      // D (1 - 100)
const reportInterval = ref(10)   // I (1 - 50)
const deadband = ref(0.01)       // X (0.0 - 0.5)
const windowSize = ref(100)      // Z (10 - 100)

const isSynced = ref(false)

// -- Handlers --

const onConfigLoaded = (e: CustomEvent) => {
  const conf = e.detail
  console.log('Tuner received config:', conf)
  
  if (conf.T) tapThreshold.value = parseInt(conf.T, 16)
  if (conf.W) wakeThreshold.value = parseInt(conf.W, 16)
  if (conf.S) smoothing.value = parseFloat(conf.S)
  if (conf.G) freqGate.value = parseFloat(conf.G)
  if (conf.H) freqHyst.value = parseFloat(conf.H)
  if (conf.N) noiseGate.value = parseFloat(conf.N)
  if (conf.B) blindFrames.value = parseInt(conf.B)
  if (conf.V) spikeValue.value = parseFloat(conf.V)
  
  if (conf.D) sampleDelay.value = parseInt(conf.D)
  if (conf.I) reportInterval.value = parseInt(conf.I)
  if (conf.X) deadband.value = parseFloat(conf.X)
  if (conf.Z) windowSize.value = parseInt(conf.Z)
  
  isSynced.value = true
}

// -- Watchers for Updates --

const sendUpdate = (key: string, val: string | number) => {
  if (!props.accelerometer) return
  const cmd = `${key}:${val}`
  console.log('Sending tune:', cmd)
  props.accelerometer.sendLine(cmd)
}

// We watch each model and send updates. 
// Note: We avoid @input spam if possible, but for "Real-time tuning" @input is actually desired.
// We just need to make sure we don't cause a loop if the device echoes back (the device echo is just a log currently).

// Helper to format Hex
const toHex = (v: number) => v.toString(16).toUpperCase().padStart(2, '0')

// -- Lifecycle --

watch(() => props.accelerometer, (newVal, oldVal) => {
  if (oldVal) {
    oldVal.removeEventListener('config-loaded', onConfigLoaded as EventListener)
  }
  if (newVal) {
    newVal.addEventListener('config-loaded', onConfigLoaded as EventListener)
    // If already connected, request sync
    // The device driver auto-requests on start(), but if we mount later:
    newVal.requestConfig() 
  }
}, { immediate: true })

onUnmounted(() => {
  if (props.accelerometer) {
    props.accelerometer.removeEventListener('config-loaded', onConfigLoaded as EventListener)
  }
})

</script>

<template>
  <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col gap-4 text-xs font-mono">
    <div class="flex justify-between items-center border-b border-zinc-800 pb-2">
      <h2 class="font-bold text-yellow-400 uppercase">Motion Tuner</h2>
      <button 
        v-if="accelerometer"
        @click="accelerometer.requestConfig()"
        class="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded transition-colors"
      >
        {{ isSynced ? 'SYNCED' : 'REQ SYNC' }}
      </button>
      <span v-else class="text-zinc-600">NO DEVICE</span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
      
      <!-- HARDWARE -->
      <div class="flex flex-col gap-3">
        <h3 class="text-zinc-500 font-bold">HARDWARE (Registers)</h3>
        
        <!-- Tap Threshold -->
        <div class="flex flex-col gap-1">
          <div class="flex justify-between">
            <span class="cursor-help border-b border-zinc-700 border-dashed" v-tooltip="'Hardware sensitivity for \'Knock\' detection.\nLower value = More sensitive (triggers on lighter taps).'">Tap Thresh (T)</span>
            <span class="text-yellow-500">0x{{ toHex(tapThreshold) }}</span>
          </div>
          <input 
            type="range" min="1" max="31" step="1" 
            v-model.number="tapThreshold"
            @input="sendUpdate('T', toHex(tapThreshold))"
            class="accent-yellow-500"
          />
        </div>

        <!-- Wake Threshold -->
        <div class="flex flex-col gap-1">
          <div class="flex justify-between">
            <span class="cursor-help border-b border-zinc-700 border-dashed" v-tooltip="'Hardware threshold to wake from sleep.\nLower value = Wakes on slighter movements.'">Wake Thresh (W)</span>
            <span class="text-yellow-500">0x{{ toHex(wakeThreshold) }}</span>
          </div>
          <input 
            type="range" min="1" max="31" step="1" 
            v-model.number="wakeThreshold"
            @input="sendUpdate('W', toHex(wakeThreshold))"
            class="accent-yellow-500"
          />
          <div class="text-[9px] text-zinc-600">Lower = More Sensitive Wake</div>
        </div>
      </div>

      <!-- SOFTWARE PHYSICS -->
      <div class="flex flex-col gap-3">
        <h3 class="text-zinc-500 font-bold">PHYSICS (Software)</h3>

        <!-- Smoothing -->
        <div class="flex flex-col gap-1">
          <div class="flex justify-between">
            <span class="cursor-help border-b border-zinc-700 border-dashed" v-tooltip="'Low-Pass Filter factor.\nLow (0.01) = Very smooth/slow.\nHigh (1.0) = Raw/jittery.'">Smoothing (S)</span>
            <span class="text-blue-400">{{ smoothing.toFixed(2) }}</span>
          </div>
          <input 
            type="range" min="0.01" max="1.0" step="0.01" 
            v-model.number="smoothing"
            @input="sendUpdate('S', smoothing.toFixed(2))"
            class="accent-blue-500"
          />
        </div>

        <!-- Freq Gate -->
        <div class="flex flex-col gap-1">
          <div class="flex justify-between">
            <span class="cursor-help border-b border-zinc-700 border-dashed" v-tooltip="'Minimum G-force swing required to calculate frequency.\nPrevents noise being read as speed.'">Freq Gate (G)</span>
            <span class="text-cyan-400">{{ freqGate.toFixed(2) }}G</span>
          </div>
          <input 
            type="range" min="0.05" max="1.0" step="0.01" 
            v-model.number="freqGate"
            @input="sendUpdate('G', freqGate.toFixed(2))"
            class="accent-cyan-500"
          />
        </div>

        <!-- Noise Gate -->
        <div class="flex flex-col gap-1">
          <div class="flex justify-between">
            <span class="cursor-help border-b border-zinc-700 border-dashed" v-tooltip="'Minimum signal threshold.\nMotions below this are clamped to zero to remove resting jitter.'">Noise Floor (N)</span>
            <span class="text-zinc-400">{{ noiseGate.toFixed(3) }}</span>
          </div>
          <input 
            type="range" min="0.0" max="0.5" step="0.005" 
            v-model.number="noiseGate"
            @input="sendUpdate('N', noiseGate.toFixed(3))"
            class="accent-zinc-500"
          />
        </div>
      </div>

      <!-- IMPACT / VISUALS -->
      <div class="flex flex-col gap-3">
        <h3 class="text-zinc-500 font-bold">IMPACT</h3>

        <!-- Blind Frames -->
        <div class="flex flex-col gap-1">
          <div class="flex justify-between">
            <span class="cursor-help border-b border-zinc-700 border-dashed" v-tooltip="'Duration (in 10ms frames) to ignore input after a Knock.\nHides the \'ringing\' vibration.'">Blind Frames (B)</span>
            <span class="text-red-400">{{ blindFrames }}</span>
          </div>
          <input 
            type="range" min="0" max="60" step="1" 
            v-model.number="blindFrames"
            @input="sendUpdate('B', blindFrames)"
            class="accent-red-500"
          />
        </div>

        <!-- Spike Value -->
        <div class="flex flex-col gap-1">
          <div class="flex justify-between">
            <span class="cursor-help border-b border-zinc-700 border-dashed" v-tooltip="'The artificial magnitude value sent when a Knock triggers.\nPurely for visual impact.'">Spike Height (V)</span>
            <span class="text-pink-400">{{ spikeValue.toFixed(1) }}</span>
          </div>
          <input 
            type="range" min="10" max="100" step="1" 
            v-model.number="spikeValue"
            @input="sendUpdate('V', spikeValue.toFixed(1))"
            class="accent-pink-500"
          />
        </div>
      </div>

      <!-- HYSTERESIS -->
      <div class="flex flex-col gap-3">
        <h3 class="text-zinc-500 font-bold">ADVANCED</h3>
         <!-- Freq Hysteresis -->
         <div class="flex flex-col gap-1">
          <div class="flex justify-between">
            <span class="cursor-help border-b border-zinc-700 border-dashed" v-tooltip="'Buffer around the zero-crossing detection.\nHigher = Requires cleaner periodic motion.'">Freq Hyst (H)</span>
            <span class="text-cyan-600">{{ freqHyst.toFixed(2) }}</span>
          </div>
          <input 
            type="range" min="0.01" max="0.5" step="0.01" 
            v-model.number="freqHyst"
            @input="sendUpdate('H', freqHyst.toFixed(2))"
            class="accent-cyan-700"
          />
        </div>

        <!-- Deadband -->
        <div class="flex flex-col gap-1">
          <div class="flex justify-between">
            <span class="cursor-help border-b border-zinc-700 border-dashed" v-tooltip="'Minimum change to trigger BLE update.\nLower = More updates/noise.'">Deadband (X)</span>
            <span class="text-zinc-400">{{ deadband.toFixed(3) }}</span>
          </div>
          <input 
            type="range" min="0.0" max="0.5" step="0.005" 
            v-model.number="deadband"
            @input="sendUpdate('X', deadband.toFixed(3))"
            class="accent-zinc-500"
          />
        </div>

        <!-- Sample Delay -->
        <div class="flex flex-col gap-1">
          <div class="flex justify-between">
            <span class="cursor-help border-b border-zinc-700 border-dashed" v-tooltip="'Polling delay in ms.\nLower = Higher Sample Rate (10ms = 100Hz).'">Sample Delay (D)</span>
            <span class="text-zinc-400">{{ sampleDelay }}ms</span>
          </div>
          <input 
            type="range" min="1" max="100" step="1" 
            v-model.number="sampleDelay"
            @input="sendUpdate('D', sampleDelay)"
            class="accent-zinc-500"
          />
        </div>

        <!-- Report Interval -->
        <div class="flex flex-col gap-1">
          <div class="flex justify-between">
            <span class="cursor-help border-b border-zinc-700 border-dashed" v-tooltip="'Samples per BLE packet.\n10 samples @ 10ms = 10Hz Update Rate.'">Report Interval (I)</span>
            <span class="text-zinc-400">{{ reportInterval }}</span>
          </div>
          <input 
            type="range" min="1" max="50" step="1" 
            v-model.number="reportInterval"
            @input="sendUpdate('I', reportInterval)"
            class="accent-zinc-500"
          />
        </div>

        <!-- Window Size -->
        <div class="flex flex-col gap-1">
          <div class="flex justify-between">
            <span class="cursor-help border-b border-zinc-700 border-dashed" v-tooltip="'Samples used for Frequency Analysis.\nLower = Faster response, less accuracy.'">Window Size (Z)</span>
            <span class="text-zinc-400">{{ windowSize }}</span>
          </div>
          <input 
            type="range" min="10" max="100" step="1" 
            v-model.number="windowSize"
            @input="sendUpdate('Z', windowSize)"
            class="accent-zinc-500"
          />
        </div>

      </div>

    </div>
  </div>
</template>
