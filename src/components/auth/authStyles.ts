// Shared Tailwind class strings for the auth UI — kept in one place so visual
// tweaks propagate to every auth screen at once.
export const ui = {
	page: 'min-h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-100 p-6',
	card: 'w-full max-w-md bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 shadow-xl backdrop-blur',
	title: 'text-2xl font-semibold mb-1',
	subtitle: 'text-sm text-zinc-400 mb-6',
	label: 'block text-xs uppercase tracking-wider text-zinc-400 mb-1.5',
	input:
		'w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition',
	button:
		'w-full bg-zinc-100 text-zinc-900 font-medium rounded-lg px-4 py-2.5 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition',
	buttonSecondary:
		'w-full bg-zinc-800 text-zinc-100 font-medium rounded-lg px-4 py-2.5 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition',
	link: 'text-zinc-300 hover:text-white underline underline-offset-4',
	error: 'text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2',
	success:
		'text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2',
	field: 'mb-4',
	row: 'flex items-center justify-between gap-4',
}
