// ======================
// GLOBAL AI LIMITS
// ======================
// 200,000 tokens per minute

// ==========
// Constants
// ==========
const MAX_TOKENS_PER_MINUTE = 200000
const MAX_QUEUE_LENGTH = 20
const TIMEOUT_SECONDS = 52 // Lambda timeout is 50 seconds
const MAX_ATTEMPTS = 1 // Gives it 2 attempts

module.exports = {
    MAX_TOKENS_PER_MINUTE,
    MAX_QUEUE_LENGTH,
    TIMEOUT_SECONDS,
    MAX_ATTEMPTS,
}
