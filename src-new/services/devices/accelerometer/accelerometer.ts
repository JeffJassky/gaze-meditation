import { Device } from '../device'

// Nordic UART Service UUIDs
const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
const TX_CHARACTERISTIC_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e' // Notify

export class Accelerometer extends Device {
	private device: BluetoothDevice | null = null
	private server: BluetoothRemoteGATTServer | null = null
	private characteristic: BluetoothRemoteGATTCharacteristic | null = null

	constructor() {
		super('accelerometer', 'XIAO nRF52840 Sense')
	}

	async isAvailable(): Promise<boolean> {
		return typeof navigator.bluetooth !== 'undefined'
	}

	async isAccessGranted(): Promise<boolean> {
		// Web Bluetooth requires a user gesture every time for the initial connection usually,
		// or persistent permissions which are browser specific.
		// We'll treat "access granted" as "we have a device object".
		return this.device !== null && this.device.gatt?.connected === true
	}

	async requestAccess(): Promise<boolean> {
		console.log('Requesting Bluetooth Access (Filter by Service UUID)...')
		try {
			// Filter by the Nordic UART Service UUID - this should hide all the "Unknowns" that aren't our device
			this.device = await navigator.bluetooth.requestDevice({
				filters: [{ name: 'GAZE Motion' }, { services: [SERVICE_UUID] }],
				optionalServices: [SERVICE_UUID]
			})

			console.log('Device selected:', this.device.name)
			this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this))
			return true
		} catch (error) {
			console.error('User cancelled or failed requestAccess:', error)
			return false
		}
	}

	async start(): Promise<void> {
		if (!this.device) {
			const success = await this.requestAccess()
			if (!success) throw new Error('Device not selected')
		}

		if (this.device && !this.device.gatt?.connected) {
			this.server = await this.device.gatt!.connect()
			const service = await this.server.getPrimaryService(SERVICE_UUID)
			this.characteristic = await service.getCharacteristic(TX_CHARACTERISTIC_UUID)

			await this.characteristic.startNotifications()
			this.characteristic.addEventListener(
				'characteristicvaluechanged',
				this.handleNotifications.bind(this)
			)

			this.dispatchEvent(new Event('start'))
		}
	}

	async stop(): Promise<void> {
		if (this.device && this.device.gatt?.connected) {
			this.device.gatt.disconnect()
		}
	}

	private onDisconnected() {
		this.dispatchEvent(new Event('stop'))
		// Attempt reconnect? Usually better to let UI handle re-request/re-connect
	}

	private handleNotifications(event: Event) {
		const value = (event.target as BluetoothRemoteGATTCharacteristic).value
		if (!value) return

		const decoder = new TextDecoder('utf-8')
		const text = decoder.decode(value)
		this.processBuffer(text)
	}

	private buffer = ''

	private processBuffer(chunk: string) {
		this.buffer += chunk
		const lines = this.buffer.split('\n')

		// The last element is either empty (if text ended with \n) or an incomplete line
		this.buffer = lines.pop() || ''

		for (const line of lines) {
			this.parseLine(line.trim())
		}
	}

	private parseLine(line: string) {
		if (line.startsWith('K:')) {
			console.log('Impact received:', line)
			this.dispatchEvent(new Event('impact'))
			return
		}

		if (line.startsWith('F:')) {
			const parts: string[] = line.split(',')
			if (parts.length === 2) {
				const freqPart = parts[0]?.split(':')
				const magPart = parts[1]?.split(':')

				if (freqPart && magPart && freqPart.length === 2 && magPart.length === 2) {
					const freqStr = freqPart[1]
					const magStr = magPart[1]
					
					if (freqStr !== undefined && magStr !== undefined) {
						const freq = parseFloat(freqStr)
						const mag = parseFloat(magStr)

						if (!isNaN(freq) && !isNaN(mag)) {
							this.dispatchEvent(
								new CustomEvent('data', {
									detail: { freq, mag, timestamp: Date.now() }
								})
							)

							if (mag > 0) {
								this.dispatchEvent(new Event('move'))
							} else {
								this.dispatchEvent(new Event('still'))
							}
						}
					}
				}
			}
		}
	}
}
