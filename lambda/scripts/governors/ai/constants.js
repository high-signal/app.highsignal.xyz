// ======================
// GLOBAL AI LIMITS
// ======================
// Usage tier 2
// 2,000,000 tokens per minute
// 5,000 requests per minute

// Max tokens per ai queue item is ~2,000 (total of input and output tokens)

// ==========
// Constants
// ==========
const MAX_TOKENS_PER_MINUTE = 200000
const MAX_QUEUE_LENGTH = 200
const TIMEOUT_SECONDS = 52 // Lambda timeout is 50 seconds
const MAX_ATTEMPTS = 1 // Gives it 2 attempts

module.exports = {
    MAX_TOKENS_PER_MINUTE,
    MAX_QUEUE_LENGTH,
    TIMEOUT_SECONDS,
    MAX_ATTEMPTS,
}
