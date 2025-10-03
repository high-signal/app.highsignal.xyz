const { createClient } = require("@supabase/supabase-js")
const als = require("./asyncContext")

const storeStatsInDb = async ({ source, functionType, actionCount, errorType }) => {
    const store = als.getStore()
    const requestId = store?.requestId

    if (!requestId) {
        console.error("❌ Request ID not found")
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    const { error } = await supabase.from("lambda_stats").upsert(
        {
            request_id: requestId,
            ...(source && { source }),
            ...(functionType && { function_type: functionType }),
            ...(actionCount && { action_count: actionCount }),
            ...(errorType && { error_type: errorType }),
        },
        { onConflict: "request_id" },
    )

    if (error) {
        console.error("❌ Error storing stats in DB for requestId", requestId, error)
    }
}

module.exports = { storeStatsInDb }
