// Customizable duration constants (in milliseconds)
// You can tune these to change the "rhythm" of the reading time.
const SENTENCE_DURATION = 500 // Pause at the end of a sentence
const SEGMENT_DURATION = 200 // Pause for commas/clauses
const WORD_DURATION = 100 // Base time per word
const LETTER_DURATION = 10 // Slight addition for longer complex words

export function calculateDuration(text: string): number {
	if (!text || text.trim().length === 0) return 0

	// 1. Normalize text
	// We replace specific ellipsis characters (…) or 3+ dots with a temporary token
	// to ensure they aren't split incorrectly by the standard period splitter.
	const cleanText = text.trim()
	const ellipsisPlaceholder = '__ELLIPSIS__'
	const protectedText = cleanText.replace(/\.{3,}|\u2026/g, ellipsisPlaceholder)

	// 2. Split into Sentences
	// Split on standard sentence terminators (. ! ?) or the ellipsis placeholder
	// We filter(Boolean) to remove empty strings caused by trailing punctuation
	const sentenceDelimiters = new RegExp(`[?!.]+|${ellipsisPlaceholder}`)
	const sentences = protectedText
		.split(sentenceDelimiters)
		.map(s => s.trim())
		.filter(s => s.length > 0)

	const sentenceCount = sentences.length

	// Initialize counters
	let segmentCount = 0
	let wordCount = 0
	let letterCount = 0

	// Process each sentence to find segments, words, and letters
	sentences.forEach(sentence => {
		// 3. Split into Segments (Clauses)
		// Split on commas, semicolons, colons
		const segments = sentence
			.split(/[,;:]+/)
			.map(s => s.trim())
			.filter(s => s.length > 0)

		segmentCount += segments.length

		segments.forEach(segment => {
			// 4. Split into Words
			// Split on any whitespace
			const words = segment.split(/\s+/).filter(w => w.length > 0)

			wordCount += words.length

			words.forEach(word => {
				// 5. Count Letters
				// Remove any remaining punctuation inside the word (like quotes or apostrophes)
				// if you only want to count alphanumeric "heaviness",
				// otherwise just counting length is usually fine.
				// Here we count the raw length of the word string.
				letterCount += word.length
			})
		})
	})

	// 6. Calculate Total Duration
	const totalDuration =
		sentenceCount * SENTENCE_DURATION +
		segmentCount * SEGMENT_DURATION +
		wordCount * WORD_DURATION +
		letterCount * LETTER_DURATION

	// Debugging log (Optional: remove in production)
	// console.log({ sentenceCount, segmentCount, wordCount, letterCount, totalDuration });

	return totalDuration
}
