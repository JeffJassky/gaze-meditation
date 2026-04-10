/**
 * Shared Tailwind class fragments for the Studio (content management) UI.
 * Centralized here so visual tweaks propagate across every studio screen.
 */
export const su = {
	page: 'min-h-screen w-full bg-surface text-content',
	container: 'max-w-6xl mx-auto px-6 py-8',
	header: 'flex items-center justify-between mb-6 gap-4',
	h1: 'text-2xl font-semibold',
	h2: 'text-lg font-semibold',
	h3: 'text-sm font-semibold uppercase tracking-wider text-content-secondary',
	card: 'bg-surface-secondary/80 border border-edge rounded-2xl p-6 mb-6',
	subCard: 'bg-surface-secondary/50 border border-edge rounded-xl p-4',
	label: 'block text-xs uppercase tracking-wider text-content-secondary mb-1.5',
	input:
		'w-full bg-surface border border-edge rounded-lg px-3 py-2 text-content placeholder-content-tertiary focus:outline-none focus:border-edge-secondary transition',
	textarea:
		'w-full bg-surface border border-edge rounded-lg px-3 py-2 text-content placeholder-content-tertiary focus:outline-none focus:border-edge-secondary transition font-mono text-sm',
	select:
		'w-full bg-surface border border-edge rounded-lg px-3 py-2 text-content focus:outline-none focus:border-edge-secondary transition',
	btn: 'inline-flex items-center gap-2 bg-accent text-surface font-medium rounded-lg px-4 py-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition',
	btnSecondary:
		'inline-flex items-center gap-2 bg-surface-tertiary text-content font-medium rounded-lg px-4 py-2 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition',
	btnGhost:
		'inline-flex items-center gap-2 text-content-secondary hover:text-content rounded-lg px-3 py-1.5 text-sm transition',
	btnDanger:
		'inline-flex items-center gap-2 bg-danger/90 hover:bg-danger text-white font-medium rounded-lg px-3 py-1.5 text-sm transition',
	badge:
		'inline-flex items-center gap-1 rounded-full border border-edge-secondary px-2 py-0.5 text-xs text-content-secondary',
	badgePublished:
		'inline-flex items-center gap-1 rounded-full bg-success/10 border border-success/30 text-success px-2 py-0.5 text-xs',
	badgeDraft:
		'inline-flex items-center gap-1 rounded-full bg-warning/10 border border-warning/30 text-warning px-2 py-0.5 text-xs',
	badgePublic:
		'inline-flex items-center gap-1 rounded-full bg-info/10 border border-info/30 text-info px-2 py-0.5 text-xs',
	badgePrivate:
		'inline-flex items-center gap-1 rounded-full bg-surface-tertiary/40 border border-edge-secondary text-content-secondary px-2 py-0.5 text-xs',
	error: 'text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2',
	success:
		'text-sm text-success bg-success/10 border border-success/30 rounded-lg px-3 py-2',
	divider: 'border-t border-edge my-4',
}
