import { ref, watch, readonly } from 'vue'

export type ThemePreference = 'system' | 'light' | 'dark' | 'little' | 'bambi' | 'barbi'

const STORAGE_KEY = 'ncrs-theme'

const preference = ref<ThemePreference>(
  (localStorage.getItem(STORAGE_KEY) as ThemePreference) || 'little',
)

type EffectiveTheme = 'light' | 'dark' | 'little' | 'bambi' | 'barbi'
const THEME_CLASSES: EffectiveTheme[] = ['dark', 'little', 'bambi', 'barbi']

function resolveEffective(pref: ThemePreference): EffectiveTheme {
  if (pref === 'little' || pref === 'bambi' || pref === 'barbi') return pref
  if (pref !== 'system') return pref
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const effective = ref<EffectiveTheme>(resolveEffective(preference.value))

function apply(theme: EffectiveTheme) {
  effective.value = theme
  document.documentElement.classList.remove(...THEME_CLASSES)
  if (theme !== 'light') document.documentElement.classList.add(theme)
}

// React to preference changes
watch(preference, (pref) => {
  localStorage.setItem(STORAGE_KEY, pref)
  apply(resolveEffective(pref))
})

// Listen for OS-level theme changes when using "system"
const mq = window.matchMedia('(prefers-color-scheme: dark)')
mq.addEventListener('change', () => {
  if (preference.value === 'system') {
    apply(resolveEffective('system'))
  }
})

// Apply immediately on import
apply(resolveEffective(preference.value))

export function useTheme() {
  return {
    /** The user's stored preference: 'system' | 'light' | 'dark' */
    preference,
    /** The resolved theme currently in effect: 'light' | 'dark' */
    effective: readonly(effective),
    /** Set the preference */
    setTheme(pref: ThemePreference) {
      preference.value = pref
    },
  }
}
