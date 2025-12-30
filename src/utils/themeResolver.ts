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