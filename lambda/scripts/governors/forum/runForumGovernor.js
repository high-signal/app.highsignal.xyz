// How to run this locally:
// node -e "require('./runForumGovernor.js').runForumGovernor().catch(console.error)"

require("dotenv").config({ path: "../../../../.env" })
const { createClient } = require("@supabase/supabase-js")
const { fetchUserActivity } = require("./fetchUserActivity")
const { checkQueueForStaleItems } = require("../utils/checkQueueForStaleItems")
const { storeStatsInDb } = require("../../utils/storeStatsInDb")

// ==========
// Constants
// ==========
const { MAX_QUEUE_LENGTH, MAX_ATTEMPTS, TIMEOUT_SECONDS } = require("./constants")

// =================
// Run the governor
// =================
async function runForumGovernor() {
    console.log("💡 Running forum governor")

    let completedCounter = 0

    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

        await checkQueueForStaleItems({ supabase, queueDbTable: "forum_request_queue", MAX_ATTEMPTS, TIMEOUT_SECONDS })

        // Get the first X items in the queue that are pending
        const { data: pendingQueueItems, error: pendingQueueItemsError } = await supabase
            .from("forum_request_queue")
            .select("*")
            .eq("status", "pending")
            .order("id", { ascending: true })
            .limit(MAX_QUEUE_LENGTH)

        if (pendingQueueItemsError) {
            const errorMessage = `Error fetching pending queue items: ${pendingQueueItemsError.message}`
            console.error(errorMessage)
            throw errorMessage
        }

        // If there are no pending queue items, return
        if (pendingQueueItems?.length === 0) {
            console.log("🔍 No pending queue items found. Stopping forum governor.")
            return
        }

        // Look up signal strength Id from name "discourse_forum"
        const { data: signalStrength, error: signalStrengthError } = await supabase
            .from("signal_strengths")
            .select("*")
            .eq("name", "discourse_forum")
            .single()

        if (signalStrengthError) {
            const errorMessage = `Error fetching signal strength: ${signalStrengthError.message}`
            console.error(errorMessage)
            throw errorMessage
        }

        // Process the first X items in the queue
        // If any single queue item fails, continue to the next item
        // Only queue items that complete successfully will be marked as "completed"
        // otherwise, then will be marked as "error"
        for (const pendingQueueItem of pendingQueueItems) {
            console.log(`🔍 Processing item ${pendingQueueItem.id}`)

            // Attempt to claim the queue item
            const { error: claimQueueItemError } = await supabase
                .from("forum_request_queue")
                .update({ status: "running", started_at: new Date().toISOString() })
                .eq("id", pendingQueueItem.id)
                .eq("status", "pending")

            if (claimQueueItemError) {
                console.error(`⚠️ Error claiming queue item: ${claimQueueItemError.message}`)
                continue
            } else {
                console.log(`🔍 Claimed queue item ${pendingQueueItem.id}`)
            }

            // Lookup forum URL from project
            const { data: projectSignalStrengthConfig, error: projectSignalStrengthConfigError } = await supabase
                .from("project_signal_strengths")
                .select("*")
                .eq("project_id", pendingQueueItem.project_id)
                .eq("signal_strength_id", signalStrength.id)
                .single()

            if (projectSignalStrengthConfigError) {
                const errorMessage = `Error fetching project signal strength config: ${projectSignalStrengthConfigError.message}`
                console.error(errorMessage)
                throw errorMessage
            }

            // Add a 0.5 second delay between processing each queue item.
            // This is a simple way to avoid rate limiting and API errors.
            await new Promise((resolve) => setTimeout(resolve, 500))

            // Do not throw errors in this loop, just continue if any user fails.
            const { forumActivity, errorFetchingUserActivity } = await fetchUserActivity({
                pendingQueueItem,
                projectSignalStrengthConfig,
            })

            if (errorFetchingUserActivity) {
                continue
            } else {
                console.log(
                    `🔍 Fetched ${forumActivity.length} forum activity items for user ${pendingQueueItem.forum_username}`,
                )

                if (forumActivity.length > 0) {
                    // Store the forum activity in the DB in bulk
                    const rowsToInsert = forumActivity.map((activity) => ({
                        project_id: pendingQueueItem.project_id,
                        user_id: pendingQueueItem.user_id,
                        post_id: activity.id,
                        cooked: activity.cooked,
                        created_at: activity.created_at,
                    }))

                    const { error: insertForumMessagesError } = await supabase
                        .from("forum_messages")
                        .upsert(rowsToInsert, {
                            onConflict: ["project_id", "user_id", "post_id"],
                        })
                        .select()

                    if (insertForumMessagesError) {
                        const errorMessage = `Error inserting forum messages: ${insertForumMessagesError.message}`
                        console.error(errorMessage)
                        continue
                    } else {
                        console.log(
                            `💾 Stored ${rowsToInsert.length} forum messages for user ${pendingQueueItem.forum_username}`,
                        )
                    }
                } else {
                    console.log(`📭 No forum activity found for user ${pendingQueueItem.forum_username}. Skipping.`)
                }

                // Update the queue item status to "completed"
                const { error: updateQueueItemStatusError } = await supabase
                    .from("forum_request_queue")
                    .update({ status: "completed", finished_at: new Date().toISOString() })
                    .eq("id", pendingQueueItem.id)

                if (updateQueueItemStatusError) {
                    const errorMessage = `Error updating queue item status: ${updateQueueItemStatusError.message}`
                    console.error(errorMessage)
                    continue
                } else {
                    completedCounter++
                    console.log(`🏁 Marked queue item ${pendingQueueItem.id} as "completed"`)
                }
            }
        }
        console.log("🎉 Finished processing all forum queue items. Forum governor complete.")
    } catch (error) {
        console.error("Error in runForumGovernor:", error)
        throw error
    } finally {
        // ==============================
        // Update action count in the DB
        // ==============================
        // Set the action count equal to the number of
        // forum queue items that were completed
        await storeStatsInDb({
            actionCount: completedCounter,
        })
    }
}

module.exports = { runForumGovernor }
