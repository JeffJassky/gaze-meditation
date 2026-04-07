/**
 * Shared Tailwind class fragments for the Studio (content management) UI.
 * Centralized here so visual tweaks propagate across every studio screen.
 */
export const su = {
	page: 'min-h-screen w-full bg-zinc-950 text-zinc-100',
	container: 'max-w-6xl mx-auto px-6 py-8',
	header: 'flex items-center justify-between mb-6 gap-4',
	h1: 'text-2xl font-semibold',
	h2: 'text-lg font-semibold',
	h3: 'text-sm font-semibold uppercase tracking-wider text-zinc-400',
	card: 'bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 mb-6',
	subCard: 'bg-zinc-900/50 border border-zinc-800 rounded-xl p-4',
	label: 'block text-xs uppercase tracking-wider text-zinc-400 mb-1.5',
	input:
		'w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition',
	textarea:
		'w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition font-mono text-sm',
	select:
		'w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-500 transition',
	btn: 'inline-flex items-center gap-2 bg-zinc-100 text-zinc-900 font-medium rounded-lg px-4 py-2 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition',
	btnSecondary:
		'inline-flex items-center gap-2 bg-zinc-800 text-zinc-100 font-medium rounded-lg px-4 py-2 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition',
	btnGhost:
		'inline-flex items-center gap-2 text-zinc-300 hover:text-white rounded-lg px-3 py-1.5 text-sm transition',
	btnDanger:
		'inline-flex items-center gap-2 bg-red-600/90 hover:bg-red-600 text-white font-medium rounded-lg px-3 py-1.5 text-sm transition',
	badge:
		'inline-flex items-center gap-1 rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300',
	badgePublished:
		'inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 text-xs',
	badgeDraft:
		'inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2 py-0.5 text-xs',
	badgePublic:
		'inline-flex items-center gap-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 px-2 py-0.5 text-xs',
	badgePrivate:
		'inline-flex items-center gap-1 rounded-full bg-zinc-700/40 border border-zinc-600 text-zinc-300 px-2 py-0.5 text-xs',
	error: 'text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2',
	success:
		'text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2',
	divider: 'border-t border-zinc-800 my-4',
}
