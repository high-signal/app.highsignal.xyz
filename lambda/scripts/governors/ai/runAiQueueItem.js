require("dotenv").config({ path: "../../../../.env" })
const { createClient } = require("@supabase/supabase-js")
const { runEngine } = require("../../engine/runEngine")

// ==========
// Constants
// ==========
const { MAX_TOKENS_PER_MINUTE, MAX_QUEUE_LENGTH, TIMEOUT_SECONDS, MAX_ATTEMPTS } = require("./constants")

async function runAiQueueItem({ queueItemId }) {
    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

        // Get the running queue items to see if there is space to attempt to claim.
        const { data: queueItems, error: queueError } = await supabase
            .from("ai_request_queue")
            .select("*")
            .eq("status", "running")

        if (queueError) {
            console.error("Error fetching queue items:", queueError)
            throw queueError
        }

        // Check if there is space to attempt to claim.
        const runningQueueItems = queueItems?.length || 0
        if (runningQueueItems >= MAX_QUEUE_LENGTH) {
            console.log("🚧 Queue is full. Exiting.")
            return
        }

        // If there is space, try to claim the queue item.
        const { data: claimedQueueItem, error: claimedQueueItemError } = await supabase
            .from("ai_request_queue")
            .update({ status: "running", started_at: new Date().toISOString() })
            .eq("id", queueItemId)
            .eq("status", "pending")
            .select()

        if (claimedQueueItemError) {
            console.error("Error claiming queue item:", claimedQueueItemError)
            throw claimedQueueItemError
        }

        if (claimedQueueItem && claimedQueueItem.length > 0) {
            console.log(`✅ Claimed queue item: ${queueItemId}`)

            // Run the AI engine.
            await runEngine({
                signalStrengthId: claimedQueueItem[0].signal_strength_id,
                userId: claimedQueueItem[0].user_id,
                projectId: claimedQueueItem[0].project_id,
                signalStrengthUsername: claimedQueueItem[0].signal_strength_username,
                dayDate: claimedQueueItem[0].day,
                type: claimedQueueItem[0].type,
                ...(claimedQueueItem[0].testing_data && { testingData: claimedQueueItem[0].testing_data }),
            })

            // Once the engine is complete, update the queue item to "completed"
            const { error: updatedQueueItemError } = await supabase
                .from("ai_request_queue")
                .update({
                    status: "completed",
                    finished_at: new Date().toISOString(),
                })
                .eq("id", queueItemId)
                .select()

            if (updatedQueueItemError) {
                console.error("Error updating queue item:", updatedQueueItemError)
                throw updatedQueueItemError
            } else {
                console.log(`💾 Updated queue item: ${queueItemId}`)
            }
            return
        } else {
            console.log(`❌ Failed to claim queue item: ${queueItemId}`)
            return
        }
    } catch (error) {
        console.error("Error in runAiQueueItem:", error)
        throw error
    }
}

module.exports = { runAiQueueItem }
