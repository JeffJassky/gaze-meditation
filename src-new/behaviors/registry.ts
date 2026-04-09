import type { Behavior, BehaviorOptions } from './Behavior'

/**
 * Central behavior registry.
 *
 * Each behavior module calls `registerBehavior()` at import time so that
 * Scene.ts never needs to know about individual classes — it just looks
 * them up by type string. Adding a new behavior means creating the class,
 * registering it here via `registerBehavior`, and re-exporting from index.ts.
 */

// Using `any` for the constructor type because Behavior subclasses have
// varying option shapes. The runtime validates via BehaviorSuggestion.
type BehaviorConstructor = new (options: any) => Behavior<BehaviorOptions>

const registry = new Map<string, BehaviorConstructor>()

/**
 * Register a behavior class under one or more type strings.
 * Typically called at module scope in each behavior file.
 */
export function registerBehavior(type: string | string[], ctor: BehaviorConstructor) {
	const types = Array.isArray(type) ? type : [type]
	for (const t of types) {
		registry.set(t, ctor)
	}
}

/**
 * Look up a behavior class by its type string.
 * Returns `undefined` if the type is not registered.
 */
export function getBehaviorClass(type: string): BehaviorConstructor | undefined {
	return registry.get(type)
}

/**
 * Returns all registered type strings. Useful for editor dropdowns
 * and validation.
 */
export function getRegisteredTypes(): string[] {
	return Array.from(registry.keys())
}
