import { DEFAULT_THEME } from '../theme';
import type { ThemeConfig, Program } from '../types';
import type { Instruction } from '../core/Instruction';

export function resolveTheme(
  programTheme: ThemeConfig | undefined,
  instructionTheme: ThemeConfig | undefined,
): ThemeConfig {
  return {
    ...DEFAULT_THEME,
    ...programTheme,
    ...instructionTheme,
  };
}

// Overload for when a Program and an Instruction object are passed directly
export function getInstructionEffectiveTheme(
  program: Program,
  instruction: Instruction<any>, // Use any for options as it's not relevant for theme resolution here
): ThemeConfig {
  return resolveTheme(program.theme, instruction.options.theme);
}
