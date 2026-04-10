// Shared Tailwind class strings for the auth UI — kept in one place so visual
// tweaks propagate to every auth screen at once.
export const ui = {
	page: 'min-h-screen w-full flex items-center justify-center bg-surface text-content p-6',
	card: 'w-full max-w-md bg-surface-secondary border border-edge rounded-2xl p-8 shadow-theme-lg backdrop-blur',
	title: 'text-2xl font-semibold mb-1',
	subtitle: 'text-sm text-content-secondary mb-6',
	label: 'block text-xs uppercase tracking-wider text-content-secondary mb-1.5',
	input:
		'w-full bg-surface border border-edge rounded-lg px-3 py-2.5 text-content placeholder-content-tertiary focus:outline-none focus:border-edge-secondary transition',
	button:
		'w-full bg-accent text-surface font-medium rounded-lg px-4 py-2.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition',
	buttonSecondary:
		'w-full bg-surface-tertiary text-content font-medium rounded-lg px-4 py-2.5 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition',
	link: 'text-content-secondary hover:text-content underline underline-offset-4',
	error: 'text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2',
	success:
		'text-sm text-success bg-success/10 border border-success/30 rounded-lg px-3 py-2',
	field: 'mb-4',
	row: 'flex items-center justify-between gap-4',
}
