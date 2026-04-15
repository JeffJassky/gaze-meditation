declare module 'buttplug-wasm/dist/buttplug-wasm.mjs' {
	import type { IButtplugClientConnector } from 'buttplug'

	export class ButtplugWasmClientConnector implements IButtplugClientConnector {
		constructor()
		get Connected(): boolean
		static activateLogging(logLevel?: string): Promise<void>
		initialize(): Promise<void>
		connect(): Promise<void>
		disconnect(): Promise<void>
		send(msg: any): void
	}
}
