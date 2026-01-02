import { DEFAULT_THEME } from '../theme'
import type { ThemeConfig, Session } from '../types'

export function resolveTheme(
	programTheme: ThemeConfig | undefined,
	itemTheme: ThemeConfig | undefined
): ThemeConfig {
	return {
		...DEFAULT_THEME,
		...programTheme,
		...itemTheme
	}
}

// Overload for when a Session and an Instruction/Scene object are passed directly
export function getSceneEffectiveTheme(
	program: Session,
	item: { options?: { theme?: ThemeConfig }, config?: { theme?: ThemeConfig } }
): ThemeConfig {
	const itemTheme = item.config?.theme || item.options?.theme
	return resolveTheme(program.theme, itemTheme)
}

export function hexToRgba(hex: string, alpha: number): string {
	const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
	hex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b)

	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
	if (!result) return `rgba(255, 255, 255, ${alpha})`

	const r = parseInt(result[1]!, 16)
	const g = parseInt(result[2]!, 16)
	const b = parseInt(result[3]!, 16)

	return `rgba(${r}, ${g}, ${b}, ${alpha})`
}