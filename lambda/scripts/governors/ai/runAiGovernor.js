// How to run this locally:
// node -e "require('./runAiGovernor.js').runAiGovernor().catch(console.error)"

require("dotenv").config({ path: "../../../../.env" })
const { createClient } = require("@supabase/supabase-js")
const { handleTriggerAiQueueItem } = require("./handleTriggerAiQueueItem")

// ==========
// Constants
// ==========
const { MAX_TOKENS_PER_MINUTE, MAX_QUEUE_LENGTH, TIMEOUT_SECONDS, MAX_ATTEMPTS } = require("./constants")

// =================
// Run the governor
// =================
async function runAiGovernor() {
    console.log("💡 Running AI governor")

    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

        // Invoked counter to optimistically track
        // the number of items that have been invoked.
        let invokedCounter = 0

        // ============================
        // Check queue for stale items
        // ============================
        // Check the queue for any items that have passed their timeout.
        // If so, increment their attempts, set their state to "error".

        // Get all items in the queue that are running.
        const { data: runningQueueItems, error: runningQueueItemsError } = await supabase
            .from("ai_request_queue")
            .select("*")
            .eq("status", "running")

        if (runningQueueItemsError) {
            const errorMessage = `Error fetching running queue items: ${runningQueueItemsError.message}`
            console.error(errorMessage)
            throw errorMessage
        }

        // Check if any of these running queue items have passed their timeout or have reached the attempt limit.
        if (runningQueueItems?.length > 0) {
            for (const runningQueueItem of runningQueueItems) {
                // Convert started_at string to timestamp for comparison.
                const startedAtTimestamp = new Date(runningQueueItem.started_at).getTime()

                if (runningQueueItem.attempts >= MAX_ATTEMPTS) {
                    // If attempts are greater than or equal to MAX_ATTEMPTS, set the status to "error".
                    console.error(
                        `‼️ ERROR LIMIT REACHED for queue item ${runningQueueItem.id}. Setting to status "error".`,
                    )
                    const { error: updatedQueueItemError } = await supabase
                        .from("ai_request_queue")
                        .update({ status: "error" })
                        .eq("id", runningQueueItem.id)

                    if (updatedQueueItemError) {
                        const errorMessage = `Error updating queue item to "error" for runningQueueItem.id: ${runningQueueItem.id}. Error: ${updatedQueueItemError.message}`
                        console.error(errorMessage)
                        throw errorMessage
                    }
                } else if (startedAtTimestamp < Date.now() - 1000 * TIMEOUT_SECONDS) {
                    // If a queue item has been running for more than 60 seconds,
                    // increment the attempts and set the status back to "pending".
                    console.log(
                        `⚠️ Queue item ${runningQueueItem.id} has been running for more than ${TIMEOUT_SECONDS} seconds. Incrementing attempts and setting status back to "pending".`,
                    )
                    const { error: updatedQueueItemError } = await supabase
                        .from("ai_request_queue")
                        .update({ attempts: runningQueueItem.attempts + 1, status: "pending" })
                        .eq("id", runningQueueItem.id)

                    if (updatedQueueItemError) {
                        const errorMessage = `Error updating queue item to "pending" for runningQueueItem.id: ${runningQueueItem.id}. Error: ${updatedQueueItemError.message}`
                        console.error(errorMessage)
                        throw errorMessage
                    }
                }
            }
        }

        // ===================================
        // Check available space in the queue
        // ===================================
        // Look at the DB again to get the new total
        // number of running items and available space.
        const { data: updatedRunningQueueItems, error: updatedRunningQueueItemsError } = await supabase
            .from("ai_request_queue")
            .select("*")
            .eq("status", "running")

        if (updatedRunningQueueItemsError) {
            const errorMessage = `Error fetching updated running queue items: ${updatedRunningQueueItemsError.message}`
            console.error(errorMessage)
            throw errorMessage
        }

        // Calculate the available space in the queue.
        const availableSpace = MAX_QUEUE_LENGTH - (updatedRunningQueueItems?.length || 0)

        if (availableSpace <= 0) {
            console.log("🚧 No available space in the queue. Exiting.")
            return
        } else {
            console.log(`📋 Available space in queue: ${availableSpace}`)
        }

        // ========================
        // Get pending queue items
        // ========================
        // If there are spaces in the queue, get the next x that are pending
        // and attempt to trigger them.

        // Get next x items that are pending ordered by type, then by newest id.
        const { data: pendingQueueItems, error: pendingQueueItemsError } = await supabase
            .from("ai_request_queue")
            .select("*")
            .eq("status", "pending")
            .order("type", { ascending: false }) // TODO: This works with only two types, sorting alphabetically.
            .order("id", { ascending: true })
            .limit(availableSpace)

        if (pendingQueueItemsError) {
            const errorMessage = `Error fetching pending queue items: ${pendingQueueItemsError.message}`
            console.error(errorMessage)
            throw errorMessage
        }

        // Attempt to trigger the next x items that are pending.
        for (const pendingQueueItem of pendingQueueItems) {
            console.log(`🏁 Triggering AI queue item: ${pendingQueueItem.id}`)
            await handleTriggerAiQueueItem({ queueItemId: pendingQueueItem.id })
            invokedCounter++
        }

        console.log("--------------------------------")
        console.log("")
        console.log(`☑️ Invoked ${invokedCounter} AI queue items.`)
        console.log("🎉 Finished triggering AI queue items. AI governor complete.")
    } catch (error) {
        console.error("Error in runAiGovernor:", error)
        throw error
    }
}

module.exports = { runAiGovernor }
