<template>
	<div
		class="timeline-container"
		@mousemove="handleMouseMove"
		@mouseleave="handleMouseLeave"
	>
		<div class="timeline-controls">
			<div class="segment-picker">
				<button
					v-for="days in [1, 7, 30]"
					:key="days"
					class="segment-btn"
					:class="{ active: durationDays === days }"
					@click="engineStore.setDuration(days)"
				>
					{{ days }}D
				</button>
			</div>
		</div>

		<div
			ref="container"
			class="timeline-vis"
		/>

		<!-- Hover Playhead -->
		<div
			v-if="hoverMinute !== null"
			class="playhead-line hover-line"
			:style="{ left: `${getMinutePercent(hoverMinute)}%` }"
		>
			<div class="playhead-time-label hover-time-label">
				{{ minuteToLabel(hoverMinute as Minute) }}
			</div>
		</div>

		<!-- Active Playhead -->
		<div
			class="playhead-line active-line"
			:style="{ left: `${getMinutePercent(playheadMin)}%` }"
		>
			<div class="playhead-time-label">
				{{ minuteToLabel(playheadMin) }}
			</div>
			<Transition name="playhead-btn">
				<button
					v-show="hoverMinute !== null && (isUserMoving || isButtonHovered)"
					class="playhead-add-btn"
					:style="{ top: `${mouseY}px` }"
					@click="handlePlayheadAdd(playheadMin, hoverGroup ?? undefined)"
					@mouseenter="isButtonHovered = true"
					@mouseleave="isButtonHovered = false"
				>
					<span class="btn-icon">+</span>
					<span class="btn-label">{{ addButtonLabel }}</span>
				</button>
			</Transition>
		</div>
	</div>
</template>

<script setup lang="ts">
import {
	nextTick,
	onBeforeUnmount,
	onMounted,
	ref,
	watch,
	h,
	render,
	withDirectives,
	computed
} from 'vue'
import { DataSet } from 'vis-data'
import { Timeline as VisTimeline, type TimelineOptions } from 'vis-timeline/standalone'
import { VTooltip } from 'floating-vue'
import '@/assets/vis-timeline.css'
import type { Minute, TimelineItem, UUID } from '@/types'
import { minuteToLabel } from '@kyneticbio/core'
import { useLibraryStore } from '@/stores/library'
import { useEngineStore } from '@/stores/engine'
import { INTERVENTION_CATEGORIES } from '@/models/ui/categories'

const props = withDefaults(
	defineProps<{
		items: TimelineItem[]
		selectedIds?: UUID[]
		editable?: boolean
		zoomHours?: number
		playheadMin: Minute
		dateIso?: string // YYYY-MM-DD to anchor the visible window
		dayStartMin?: number // Minute of day where the view starts (e.g., 420 for 7 AM)
	}>(),
	{ editable: true, zoomHours: 6, dayStartMin: 0, selectedIds: () => [] }
)

const emit = defineEmits<{
	select: [UUID[]]
	remove: [UUID]
	update: [{ id: UUID; start: string; end: string; group?: string | number }]
	playhead: [Minute]
	triggerAdd: [Minute, (string | number | undefined)?]
	hover: [UUID | undefined]
}>()

const container = ref<HTMLDivElement | null>(null)
const hoverMinute = ref<number | null>(null)
const hoverGroup = ref<string | number | null>(null)
const mouseY = ref<number>(0)
const isUserMoving = ref(false)
const isButtonHovered = ref(false)
const timelineWindow = ref<{ start: Date; end: Date } | null>(null)
let hideTimeout: number | null = null
let timeline: VisTimeline | null = null
let dataset: DataSet<any> | null = null
let groupDataset: DataSet<any> | null = null
const library = useLibraryStore()
const engineStore = useEngineStore()

const durationDays = computed(() => engineStore.durationDays)
const MINUTES_IN_DAY = 24 * 60

const addButtonLabel = computed(() => {
	if (hoverGroup.value) {
		const cat = INTERVENTION_CATEGORIES.find(c => c.id === hoverGroup.value)
		const label = cat ? cat.label : hoverGroup.value.toString()
		return label
	}
	return 'Add Item'
})

const getMinutePercent = (minute: number) => {
	if (!timeline || !timelineWindow.value) return 0

	// Use the current visible window from the timeline (updates on zoom/pan)
	const { start: windowStart, end: windowEnd } = timelineWindow.value
	const totalMs = windowEnd.getTime() - windowStart.getTime()

	// Calculate the absolute time for this minute on day 1 of the view
	const baseDate = props.dateIso ? new Date(props.dateIso + 'T00:00:00') : new Date()
	const playheadTime = new Date(baseDate)
	playheadTime.setHours(0, 0, 0, 0)
	const startHours = Math.floor(props.dayStartMin / 60)
	const startMins = props.dayStartMin % 60
	playheadTime.setHours(startHours, startMins, 0, 0)

	// Add the minute offset
	playheadTime.setTime(playheadTime.getTime() + (minute - props.dayStartMin) * 60 * 1000)

	// Handle wrap around if minute is before dayStartMin
	if (minute < props.dayStartMin) {
		playheadTime.setTime(playheadTime.getTime() + 24 * 60 * 60 * 1000)
	}

	// Calculate offset from the current visible window start
	const offsetMs = playheadTime.getTime() - windowStart.getTime()
	const percent = (offsetMs / totalMs) * 100

	// Since we have a left panel (group labels), we need to factor that in
	const leftPanel = container.value?.querySelector('.vis-panel.vis-left') as HTMLElement
	const leftWidth = leftPanel?.offsetWidth || 0
	const centerPanel = container.value?.querySelector('.vis-panel.vis-center') as HTMLElement
	const centerWidth = centerPanel?.offsetWidth || 1
	const totalWidth = container.value?.offsetWidth || 1

	const leftPercent = (leftWidth / totalWidth) * 100
	const centerFactor = centerWidth / totalWidth

	return leftPercent + percent * centerFactor
}

const handleMouseMove = (event: MouseEvent) => {
	if (!timeline || !container.value) return

	isUserMoving.value = true
	if (hideTimeout) clearTimeout(hideTimeout)
	hideTimeout = window.setTimeout(() => {
		isUserMoving.value = false
	}, 3000)

	const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
	mouseY.value = event.clientY - rect.top

	const visProps = timeline.getEventProperties(event)
	hoverGroup.value = visProps.group ?? null
	const hoverItemId = visProps.item ? (visProps.item as string).split('_')[0] : undefined
	emit('hover', hoverItemId as UUID)

	if (visProps.time) {
		// This gives absolute time. We need to map back to minute-of-day (0-1440)
		// regardless of which day we hovered on, if we treat schedule as cyclic.
		// Or if we treat it as linear, we return absolute minute.
		let m = visProps.time.getHours() * 60 + visProps.time.getMinutes()
		m = Math.round(m / 5) * 5
		hoverMinute.value = m
	}
}

const handleMouseLeave = () => {
	hoverMinute.value = null
	hoverGroup.value = null
	emit('hover', undefined)
	isUserMoving.value = false
	if (hideTimeout) clearTimeout(hideTimeout)
}

const handlePlayheadAdd = (m: number, group?: string | number) => {
	emit('triggerAdd', m as Minute, group)
}

const getItemGroup = (item: TimelineItem) => {
	if (item.group) return item.group
	const def = library.defs.find(d => d.key === item.meta.key)
	return def?.categories?.[0] || 'general'
}

// Helper to get delivery type from intervention definition
const getDeliveryType = (
	def: any,
	params: any = {}
): 'bolus' | 'infusion' | 'continuous' | null => {
	if (!def?.pharmacology) return null

	// Handle dynamic pharmacology functions
	let pharms: any[] = []
	if (typeof def.pharmacology === 'function') {
		try {
			const result = def.pharmacology(params)
			pharms = Array.isArray(result) ? result : [result]
		} catch {
			return null
		}
	} else {
		pharms = [def.pharmacology]
	}

	// Get delivery type from first pharmacology def that has pk
	for (const pharm of pharms) {
		if (pharm.pk?.delivery) {
			return pharm.pk.delivery
		}
	}
	return null
}

// Helper to format duration string
const formatDuration = (startDate: Date, endDate: Date): string => {
	let diffMs = endDate.getTime() - startDate.getTime()
	if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000

	const hours = Math.floor(diffMs / (1000 * 60 * 60))
	const mins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60))

	if (hours > 0) {
		return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`
	}
	return `${mins}m`
}

const toVisItems = (items: TimelineItem[]) => {
	const visItems: any[] = []

	// If multi-day, we might want to repeat items across days?
	// Currently, the timeline store stores items for ONE generic day.
	// To visualize 7 days, we should replicate these items for each day in the view.

	const days = durationDays.value
	const baseDate = props.dateIso ? new Date(props.dateIso + 'T00:00:00') : new Date()

	for (let d = 0; d < days; d++) {
		items.forEach(item => {
			const def = library.defs.find(d => d.key === item.meta.key)
			const icon = def?.icon ? `${def.icon} ` : ''
			let label = item.content ?? item.meta.labelOverride ?? def?.label ?? item.meta.key
			let content = `${icon}${label}`
			let className = item.meta.locked ? 'timeline-item--locked' : ''
			if (item.meta.disabled) {
				className += ' timeline-item--disabled'
			}

			const deliveryType = getDeliveryType(def, item.meta.params)
			const start = new Date(item.start)
			const end = new Date(item.end)
			const durationStr = formatDuration(start, end)

			// Special handling for sleep - show wake label at end
			if (item.meta.key === 'sleep') {
				content = `
          <div class="timeline-item-sleep">
            <span class="sleep-label">${icon}Sleep <span class="item-duration">${durationStr}</span></span>
            <span class="wake-label">Wake ☀️</span>
          </div>
        `
			}
			// Continuous delivery - show duration (like sleep)
			else if (deliveryType === 'continuous') {
				content = `${icon}${label} <span class="item-duration">${durationStr}</span>`
				className += ' timeline-item--continuous'
			}
			// Infusion delivery - show duration
			else if (deliveryType === 'infusion') {
				content = `${icon}${label} <span class="item-duration">${durationStr}</span>`
				className += ' timeline-item--infusion'
			}
			// Bolus delivery - fixed width, point-like
			else if (deliveryType === 'bolus') {
				content = `${icon}${label}`
				className += ' timeline-item--bolus'
			}

			// We need to preserve the time-of-day but shift the date
			// The store items usually have a dummy date (e.g. 2022-01-01)
			// We should map them to the view's base date + d

			const mapTime = (iso: string) => {
				const t = new Date(iso)
				const mapped = new Date(baseDate)
				mapped.setDate(mapped.getDate() + d)
				mapped.setHours(t.getHours(), t.getMinutes(), t.getSeconds(), 0)
				return mapped
			}

			let startMapped = mapTime(item.start)
			let endMapped = mapTime(item.end)

			// Calculate the item's start time as minute-of-day
			const itemStartTime = new Date(item.start)
			const itemStartMin = itemStartTime.getHours() * 60 + itemStartTime.getMinutes()

			// Items in the "late night" zone (start time before dayStartMin)
			// should be shifted forward by 24h to appear at the end of the
			// logical day cycle. This fixes the bug where items dragged past
			// midnight disappear from view because they fall before the visible
			// window which starts at dayStartMin.
			if (itemStartMin < props.dayStartMin) {
				startMapped = new Date(startMapped.getTime() + 24 * 60 * 60 * 1000)
				endMapped = new Date(endMapped.getTime() + 24 * 60 * 60 * 1000)
			}

			// Handle wrap around end time if it was originally overnight
			if (endMapped < startMapped) {
				endMapped = new Date(endMapped.getTime() + 24 * 60 * 60 * 1000)
			}

			// Build tooltip content
			const startTimeStr = minuteToLabel(
				(start.getHours() * 60 + start.getMinutes()) as Minute
			)
			let paramsHtml = ''
			if (def?.params && item.meta.params) {
				const paramLines = def.params
					.map(p => {
						const value = item.meta.params[p.key]
						if (value === undefined || value === null) return null

						let displayValue = value
						if (p.type === 'select') {
							const option = p.options?.find(o => o.value === value)
							if (option) displayValue = option.label
						} else if (p.type === 'switch') {
							displayValue = value ? 'On' : 'Off'
						}

						const unitStr =
							p.unit && (p.unit as any) !== 'a.u.' && p.unit !== 'units' ? p.unit : ''
						const unitHtml = unitStr
							? `<span class="tooltip-param-unit">${unitStr}</span>`
							: ''
						return `<div class="tooltip-param">
              <span class="tooltip-param-label">${p.label}:</span>
              <span class="tooltip-param-value"><span class="tooltip-param-number">${displayValue}</span>${unitHtml}</span>
            </div>`
					})
					.filter(Boolean)

				if (paramLines.length > 0) {
					paramsHtml = `<div class="tooltip-params">${paramLines.join('')}</div>`
				}
			}

			let tooltipContent = `<span class="tooltip-time">${startTimeStr}</span><div class="tooltip-main">${content}${item.meta.disabled ? ' <span class="tooltip-disabled-badge">(Disabled)</span>' : ''}</div>${paramsHtml}`

			visItems.push({
				id: `${item.id}_${d}`, // Unique ID for each day's instance
				_originalId: item.id,
				content,
				start: startMapped,
				end: deliveryType === 'bolus' ? undefined : endMapped, // Bolus items are points
				type: deliveryType === 'bolus' ? 'box' : item.type,
				group: getItemGroup(item),
				title: tooltipContent, // Tooltip with time for continuous/infusion
				className: className.trim() || undefined,
				editable: d === 0 // Only allow editing on day 1 for now to avoid sync hell
			})
		})
	}

	return visItems
}

const syncItems = () => {
	if (!dataset || !groupDataset) return
	const selectedIds = props.selectedIds || []

	const activeGroups = new Set(props.items.map(getItemGroup))
	const existingGroups = groupDataset.getIds()

	activeGroups.forEach(gid => {
		if (!existingGroups.includes(gid)) {
			const cat = INTERVENTION_CATEGORIES.find(c => c.id === gid)
			groupDataset?.add({
				id: gid,
				content: cat
					? `${cat.label}`
					: gid.toString().charAt(0).toUpperCase() + gid.toString().slice(1)
			})
		}
	})

	dataset.clear()
	dataset.add(toVisItems(props.items))
	if (selectedIds.length > 0) {
		nextTick(() => setSelection(selectedIds))
	}
}

const toISO = (value: any) => new Date(value).toISOString()

const setSelection = (ids: UUID[]) => {
	if (!timeline) return
	// Select day 0 instances
	const instanceIds = ids.map(id => `${id}_0`)
	timeline.setSelection(instanceIds)
}

const getDayBounds = () => {
	const baseDate = props.dateIso ? new Date(props.dateIso + 'T00:00:00') : new Date()
	const start = new Date(baseDate)
	start.setHours(0, 0, 0, 0)
	const startHours = Math.floor(props.dayStartMin / 60)
	const startMins = props.dayStartMin % 60
	start.setHours(startHours, startMins, 0, 0)
	const end = new Date(start)
	end.setDate(end.getDate() + durationDays.value)
	return { start, end }
}

const options = (): TimelineOptions => {
	const { start, end } = getDayBounds()
	return {
		xss: { disabled: true },
		stack: true,
		selectable: true,

		multiselect: true,
		orientation: 'top',
		start,
		end,
		min: start,
		max: end,
		showCurrentTime: false,
		tooltip: {
			followMouse: false,
			overflowMethod: 'flip',
			delay: 500,
			template: (item: any) => {
				return item.title
			}
		},
		format: {
			minorLabels: {
				minute: 'h:mm A',
				hour: 'h A',
				weekday: 'D',
				day: 'D',
				month: 'D',
				year: ''
			},
			majorLabels: {
				minute: '',
				hour: '',
				weekday: '',
				day: '',
				month: '',
				year: ''
			}
		},
		zoomable: true,
		zoomKey: 'ctrlKey' as const,
		moveable: true,
		zoomMin: 3600000, // 1 hour
		zoomMax: durationDays.value * 86400000,
		groupEditable: true,
		editable: props.editable
			? {
					updateTime: true,
					updateGroup: true,
					overrideItems: false
				}
			: false,
		onMove: (item: any, callback) => {
			const baseDate = props.dateIso ? new Date(props.dateIso + 'T00:00:00') : new Date()

			// Find original item to preserve its duration if needed (especially for bolus/point items)
			const originalItem = props.items.find(i => i.id === item._originalId)

			const dStart = new Date(item.start)
			const newStart = new Date(baseDate)
			newStart.setHours(dStart.getHours(), dStart.getMinutes(), dStart.getSeconds(), 0)

			// If it was dragged to a different day in vis-timeline (e.g. across midnight)
			// we might want to preserve that relative day offset?
			// For now, we stick to the baseDate normalization but ensure duration is kept.

			let newEnd: Date
			if (item.end) {
				const dEnd = new Date(item.end)
				const durationMs = dEnd.getTime() - dStart.getTime()
				newEnd = new Date(newStart.getTime() + durationMs)
			} else if (originalItem) {
				const origStart = new Date(originalItem.start)
				const origEnd = new Date(originalItem.end)
				const durationMs = origEnd.getTime() - origStart.getTime()
				newEnd = new Date(newStart.getTime() + durationMs)
			} else {
				newEnd = newStart
			}

			// Handle overnight wrap
			if (newEnd < newStart) {
				newEnd.setDate(newEnd.getDate() + 1)
			}

			emit('update', {
				id: item._originalId as UUID,
				start: newStart.toISOString(),
				end: newEnd.toISOString(),
				group: item.group
			})
			callback(item)
		},
		onRemove: (item: any, callback) => {
			emit('remove', item._originalId as UUID)
			callback(item)
		},
		template: (item: any, element: any, data: any) => {
			const container = document.createElement('div')
			container.className = 'timeline-item-inner'

			const vnode = h('div', {
				innerHTML: item.content,
				style: {
					width: '100%',
					height: '100%',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					whiteSpace: 'nowrap'
				}
			})

			render(vnode, container)
			return container
		}
	}
}

const initTimeline = () => {
	if (!container.value) return

	groupDataset = new DataSet([])
	dataset = new DataSet(toVisItems(props.items))

	timeline = new VisTimeline(container.value, dataset, groupDataset, options())

	// Initialize the window ref with the current visible window
	const window = timeline.getWindow()
	timelineWindow.value = { start: window.start, end: window.end }

	// Update window ref on zoom/pan to keep playhead aligned
	timeline.on('rangechanged', (event: { start: Date; end: Date }) => {
		timelineWindow.value = { start: event.start, end: event.end }
	})

	// Initial sync to populate groups
	syncItems()

	timeline.on('select', event => {
		const ids = (event.items as string[]) || []
		const uuids = ids.map(id => id.split('_')[0]) as UUID[]
		emit('select', uuids)
	})

	const shouldHandlePlayheadClick = (event: any) => {
		return event.what === 'background' || event.what === 'axis'
	}

	timeline.on('click', (event: any) => {
		if (!event.time || !shouldHandlePlayheadClick(event)) return
		let minute = (event.time.getHours() * 60 + event.time.getMinutes()) as Minute
		minute = (Math.round(minute / 5) * 5) as Minute
		emit('playhead', minute)
	})
	setSelection(props.selectedIds || [])
}

const isEditableTarget = (target: EventTarget | null) => {
	if (!target) return false
	if (!(target instanceof HTMLElement)) return false
	if (target.isContentEditable) return true
	const editableTags = ['INPUT', 'TEXTAREA', 'SELECT']
	return editableTags.includes(target.tagName)
}

const handleKeyDown = (e: KeyboardEvent) => {
	if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
		if (isEditableTarget(e.target)) return
		e.preventDefault()
		emit(
			'select',
			props.items.map(i => i.id)
		)
	}
}

onMounted(() => {
	initTimeline()
	window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
	window.removeEventListener('keydown', handleKeyDown)
	if (hideTimeout) clearTimeout(hideTimeout)
	timeline?.destroy()
	timeline = null
	dataset = null
	groupDataset = null
})

watch(
	() => props.items,
	() => {
		syncItems()
	},
	{ deep: true }
)

watch(
	() => props.selectedIds,
	ids => setSelection(ids || []),
	{ immediate: true, deep: true }
)

watch(
	() => props.editable,
	() => {
		timeline?.setOptions(options())
	}
)

watch(
	() => props.dateIso,
	() => {
		timeline?.setOptions(options())
	}
)

watch(
	() => props.dayStartMin,
	() => {
		timeline?.setOptions(options())
	}
)

// Watch for duration changes
watch(durationDays, () => {
	timeline?.setOptions(options())
	syncItems()
})
</script>

<style scoped>
.timeline-container {
	position: relative;
}

.timeline-controls {
	position: absolute;
	top: 10px;
	left: 10px;
	z-index: 20;
}

.segment-picker {
	display: flex;
	background: var(--color-bg-subtle);
	border-radius: 8px;
	padding: 2px;
	gap: 2px;
	backdrop-filter: blur(4px);
	border: 1px solid var(--color-border-subtle);
}

.segment-btn {
	background: transparent;
	border: none;
	color: var(--color-text-muted);
	padding: 4px 8px;
	border-radius: 6px;
	font-size: 0.75rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
}

.segment-btn:hover {
	color: var(--color-text-primary);
	background: var(--color-bg-elevated);
}

.segment-btn.active {
	background: var(--color-bg-elevated);
	color: var(--color-text-primary);
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.timeline-vis {
	overflow: hidden;
}

.timeline-vis :deep(.vis-timeline) {
	border: none;
}

.timeline-vis :deep(.vis-panel.vis-left) {
	display: block;
	border-top: 1px solid var(--color-border-subtle) !important;
	width: 130px !important;
}

.timeline-vis :deep(.vis-panel.vis-right) {
	display: none;
}

.timeline-vis :deep(.vis-label) {
	color: var(--color-text-muted);
	font-weight: 600;
	font-size: 0.8rem;
	padding: 13px 8px;
	display: flex;
	align-items: flex-start;
}

.timeline-vis :deep(.vis-item) {
	border: none;
	background: none;
	box-shadow: none;
	padding: 0;
	min-width: 50px;
	overflow: visible;
	transition:
		left 0.2s ease,
		right 0.2s ease,
		width 0.2s ease,
		top 0.2s ease;
}

.timeline-vis :deep(.timeline-item-inner) {
	background: var(--color-bg-elevated);
	padding: 0.25em 0.5em;
	font-weight: 600;
	color: var(--color-text-secondary);
	box-shadow: var(--shadow-large);
	font-size: 0.8rem;
	border: 1px solid var(--color-border-default) !important;
	border-radius: 6px;
	transition:
		scale 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275),
		color 0.2s ease;
	transform-origin: center center;
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
}

.timeline-vis :deep(.vis-item .vis-item-content) {
	display: block;
	max-width: 100%;
	overflow: visible;
	padding: 0;
}

.timeline-vis :deep(.vis-item:hover) {
	z-index: 100 !important;
}

.timeline-vis :deep(.vis-item:hover .timeline-item-inner) {
	scale: 1.05;
	color: var(--color-text-primary);
}

.timeline-vis :deep(.vis-item.timeline-item--locked .timeline-item-inner) {
	opacity: 0.65;
	background: var(--color-bg-subtle);
}

.timeline-vis :deep(.vis-item.timeline-item--disabled .timeline-item-inner) {
	background-image: repeating-linear-gradient(
		45deg,
		var(--color-bg-disabled),
		var(--color-bg-disabled) 8px,
		var(--color-bg-base) 8px,
		var(--color-bg-base) 16px
	);
	border-color: var(--color-bg-disabled) !important;
}

.timeline-vis :deep(.vis-item.timeline-item--disabled .timeline-item-inner > div) {
	filter: grayscale(1);
	opacity: 0.3;
}

.timeline-vis :deep(.vis-item.vis-selected .timeline-item-inner) {
	color: var(--color-text-primary);
	box-shadow: 0 0 0 2px var(--color-active);
}

.timeline-vis :deep(.vis-time-axis .vis-grid),
.timeline-vis :deep(.vis-grid.vis-horizontal) {
	border-color: var(--color-border-subtle);
}

.timeline-vis :deep(.vis-time-axis .vis-text) {
	color: var(--color-text-muted);
	font-weight: 500;
}

.playhead-line {
	position: absolute;
	top: 0;
	bottom: 0;
	width: 2px;
	pointer-events: none;
	z-index: 10;
}

.active-line {
	background: var(--color-active);
	box-shadow: 0 0 12px var(--color-active);
}

.hover-line {
	background: var(--color-border-strong);
	width: 1px;
}

.playhead-time-label {
	position: absolute;
	bottom: calc(100% - 2em);
	left: 50%;
	transform: translateX(-50%);
	background: var(--color-active);
	color: white;
	padding: 2px 6px;
	border-radius: 4px;
	font-size: 0.7rem;
	font-weight: 700;
	font-family: var(--font-mono);
	white-space: nowrap;
	pointer-events: none;
	box-shadow: 0 2px 4px var(--color-text-inverted);
}

.hover-time-label {
	background: var(--color-bg-elevated);
	color: var(--color-text-secondary);
}

.playhead-add-btn {
	position: absolute;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 24px;
	height: 24px;
	border-radius: 20px;
	background: var(--color-bg-active);
	color: var(--color-text-active);
	border: 2px solid var(--color-border-strong);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
	font-weight: 800;
	cursor: pointer;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
	transition:
		width 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275),
		background 0.2s ease,
		box-shadow 0.2s ease;
	line-height: 1;
	padding: 0;
	pointer-events: auto;
	overflow: hidden;
	white-space: nowrap;
}

.playhead-btn-enter-active {
	transition:
		opacity 0.15s ease-out,
		width 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275),
		background 0.2s ease,
		box-shadow 0.2s ease;
}

.playhead-btn-leave-active {
	transition:
		opacity 0.5s ease-out,
		width 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275),
		background 0.2s ease,
		box-shadow 0.2s ease;
}

.playhead-btn-enter-from,
.playhead-btn-leave-to {
	opacity: 0;
}

.btn-icon {
	flex-shrink: 0;
}

.btn-label {
	display: inline-block;
	max-width: 0;
	opacity: 0;
	font-size: 0.75rem;
	font-weight: 700;
	transition:
		max-width 0.25s ease,
		opacity 0.2s ease,
		margin 0.2s ease;
	overflow: hidden;
}

.playhead-add-btn:hover {
	width: auto;
	min-width: 90px;
	padding: 0 12px;
	filter: brightness(1.1);
	color: white;
	background: var(--color-bg-subtle);
	border-color: var(--color-border-strong);
}

.playhead-add-btn:hover .btn-label {
	max-width: 200px;
	opacity: 1;
	margin-left: 4px;
}

.hover-add-btn {
	opacity: 0.6;
}

.hover-line:hover .hover-add-btn {
	opacity: 1;
}

/* Custom Sleep Item Styling */
:deep(.timeline-item-sleep) {
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
	height: 100%;
	font-size: 0.9rem;
}

:deep(.sleep-label) {
	display: flex;
	align-items: center;
	gap: 0.3rem;
}

/* Continuous & Infusion Item Styling - show duration inline */
:deep(.item-duration) {
	opacity: 0.6;
	font-weight: 400;
	font-size: 0.85em;
	margin-left: 6px;
}

/* Bolus Item Styling - fixed width, point-like */
.timeline-vis :deep(.vis-item.timeline-item--bolus) {
	min-width: auto !important;
	width: auto !important;
	border-radius: 8px;
}

.timeline-vis :deep(.vis-item.timeline-item--bolus .vis-item-content) {
	width: auto !important;
	max-width: none !important;
	overflow: visible;
	text-overflow: clip;
	white-space: nowrap;
	transform: translateX(50%);
}

/* Hide the vertical line and dot for box-type items */
.timeline-vis :deep(.vis-item.vis-line),
.timeline-vis :deep(.vis-item.vis-dot) {
	display: none !important;
}

/* Tooltip styling */
.timeline-vis :deep(.vis-tooltip) {
	background: var(--color-bg-base);
	color: var(--color-text-primary);
	border: 1px solid var(--color-border-subtle);
	font-family: inherit;
	font-weight: 600;
	border-radius: 8px;
	padding: 8px 12px;
	font-size: 0.85rem;
	box-shadow: var(--shadow-large);
	backdrop-filter: blur(8px);
	max-width: 280px;
	z-index: 100;
}

.timeline-vis :deep(.vis-tooltip .item-duration) {
	margin-left: 6px;
	font-weight: 500;
	color: var(--color-text-muted);
}

.timeline-vis :deep(.vis-tooltip .tooltip-time) {
	display: block;
	font-weight: 500;
	color: var(--color-text-muted);
	font-size: 0.75rem;
	margin-bottom: 4px;
}

.timeline-vis :deep(.vis-tooltip .tooltip-main) {
	font-weight: 700;
	color: var(--color-text-primary);
	margin-bottom: 4px;
}

.timeline-vis :deep(.vis-tooltip .tooltip-disabled-badge) {
	font-size: 0.7rem;
	color: var(--color-warning);
	text-transform: uppercase;
	margin-left: 4px;
}

.timeline-vis :deep(.vis-tooltip .tooltip-params) {
	margin-top: 8px;
	padding-top: 6px;
	border-top: 1px solid var(--color-border-subtle);
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.timeline-vis :deep(.vis-tooltip .tooltip-param) {
	font-size: 0.75rem;
	display: flex;
	justify-content: space-between;
	gap: 12px;
}

.timeline-vis :deep(.vis-tooltip .tooltip-param-label) {
	color: var(--color-text-secondary);
	font-weight: 500;
}

.timeline-vis :deep(.vis-tooltip .tooltip-param-value) {
	color: var(--color-text-secondary);
	font-weight: 700;
	font-family: var(--font-mono);
}

.timeline-vis :deep(.vis-tooltip .tooltip-param-number) {
	color: var(--color-metric-secondary);
}

.timeline-vis :deep(.vis-tooltip .tooltip-param-unit) {
	color: var(--color-text-muted);
	margin-left: 0.25em;
}
</style>
