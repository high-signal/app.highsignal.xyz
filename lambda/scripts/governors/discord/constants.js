// ======================
// GLOBAL DISCORD LIMITS
// ======================
// 50 requests per second per bot token globally
// ~5 requests per second per bot per channel
// 100 messages max returned per request

// ==========
// Constants
// ==========
const MAX_REQUESTS_PER_SECOND_PER_CHANNEL = 2
const MAX_QUEUE_LENGTH = 20
const TIMEOUT_SECONDS = 32 // Lambda timeout is 30 seconds
const MAX_ATTEMPTS = 2 // Gives it 3 attempts
const MAX_MESSAGES_TO_PROCESS = 100
const MAX_PAGINATION_LOOPS = 10
const HEAD_GAP_MINUTES = 60
const MIN_MESSAGE_CHAR_LENGTH = 10

module.exports = {
    MAX_REQUESTS_PER_SECOND_PER_CHANNEL,
    MAX_QUEUE_LENGTH,
    TIMEOUT_SECONDS,
    MAX_ATTEMPTS,
    MAX_MESSAGES_TO_PROCESS,
    MAX_PAGINATION_LOOPS,
    HEAD_GAP_MINUTES,
    MIN_MESSAGE_CHAR_LENGTH,
}
