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
const TIMEOUT_SECONDS = 52 // Lambda timeout is 50 seconds
const MAX_ATTEMPTS = 20 // Gives it +1 attempts on this number (20 for max queue length of 20 and previous days of 360)
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
