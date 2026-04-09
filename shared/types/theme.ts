export interface ThemeConfig {
	uiTextColor?: string
	positiveColor?: string
	negativeColor?: string
	backgroundColor?: string
	promptTextColor?: string
	accentColor?: string
	debugColor?: string
	tint?: {
		color: string // hex color
		opacity: number // 0-1
	}
}
