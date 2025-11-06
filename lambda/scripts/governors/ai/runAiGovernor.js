// How to run this locally:
// node -e "require('./runAiGovernor.js').runAiGovernor().catch(console.error)"

require("dotenv").config({ path: "../../../../.env" })
const { createClient } = require("@supabase/supabase-js")
const { handleTriggerAiQueueItem } = require("./handleTriggerAiQueueItem")
const { checkQueueForStaleItems } = require("../utils/checkQueueForStaleItems")
const { getPriorityQueueItems } = require("./getPriorityQueueItems")
const { storeStatsInDb } = require("../../stats/storeStatsInDb")

// ==========
// Constants
// ==========
const { MAX_TOKENS_PER_MINUTE, MAX_QUEUE_LENGTH, TIMEOUT_SECONDS, MAX_ATTEMPTS } = require("./constants")

// =================
// Run the governor
// =================
async function runAiGovernor() {
    console.log("💡 Running AI governor")

    // Invoked counter to optimistically track
    // the number of items that have been invoked.
    let invokedCounter = 0

    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

        await checkQueueForStaleItems({ supabase, queueDbTable: "ai_request_queue", MAX_ATTEMPTS, TIMEOUT_SECONDS })

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
            // Local development logging
            if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
                console.log(`📋 Available space in queue: ${availableSpace}`)
            }
        }

        // ========================
        // Get pending queue items
        // ========================
        // If there are spaces in the queue, get the next x that are pending
        const pendingQueueItems = await getPriorityQueueItems(supabase, availableSpace)

        // Attempt to trigger the next x items that are pending.
        // Fire off all triggers in parallel; each trigger is a fast async invoke.
        if (pendingQueueItems.length > 0) {
            const results = await Promise.allSettled(
                pendingQueueItems.map(async (pendingQueueItem) => {
                    return handleTriggerAiQueueItem({ queueItemId: pendingQueueItem.id })
                }),
            )

            // Count successful invocations
            invokedCounter = results.filter((r) => r.status === "fulfilled").length

            // Log any failures without throwing to avoid blocking other items
            const failed = results.filter((r) => r.status === "rejected")
            if (failed.length > 0) {
                console.warn(`⚠️ ${failed.length} AI queue item(s) failed to trigger.`)
            }
        }

        console.log("--------------------------------")
        if (invokedCounter > 0) {
            console.log(`☑️ Triggered ${invokedCounter} AI queue items.`)
        } else {
            console.log("🚧 No AI queue items to trigger.")
        }

        console.log("🎉 Finished triggering AI queue items. AI governor complete.")
    } catch (error) {
        console.error("Error in runAiGovernor:", error)
        throw error
    } finally {
        // ==============================
        // Update action count in the DB
        // ==============================
        // Set the action count equal to the number of
        // AI queue items that were triggered
        await storeStatsInDb({
            actionCount: invokedCounter,
        })
    }
}

module.exports = { runAiGovernor }
