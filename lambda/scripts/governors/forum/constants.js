// ==========
// Constants
// ==========
const MAX_QUEUE_LENGTH = 10
const TIMEOUT_SECONDS = 32 // Lambda timeout is 30 seconds
const MAX_ATTEMPTS = 1 // Gives it 2 attempts
const MAX_ACTIVITY_CHAR_LIMIT = 5000

module.exports = {
    MAX_QUEUE_LENGTH,
    TIMEOUT_SECONDS,
    MAX_ATTEMPTS,
    MAX_ACTIVITY_CHAR_LIMIT,
}
