// ======================
// GLOBAL AI LIMITS
// ======================
// 200,000 tokens per minute

// ==========
// Constants
// ==========
const MAX_TOKENS_PER_MINUTE = 200000
const MAX_QUEUE_LENGTH = 20
const TIMEOUT_SECONDS = 60
const MAX_ATTEMPTS = 3

module.exports = {
    MAX_TOKENS_PER_MINUTE,
    MAX_QUEUE_LENGTH,
    TIMEOUT_SECONDS,
    MAX_ATTEMPTS,
}
