const { createClient } = require("@supabase/supabase-js")
const als = require("../utils/asyncContext")

const storeStatsInDb = async ({ source, functionType, actionCount, errorType }) => {
    const runningInLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME && !!process.env.AWS_REGION
    if (!runningInLambda) {
        console.log("💻 Not running in Lambda. Skipping stats storage.")
        return
    }

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
            ...(actionCount !== undefined && { action_count: actionCount }), // Allow 0
            ...(errorType && { error_type: errorType }),
        },
        { onConflict: "request_id" },
    )

    if (error) {
        console.error("❌ Error storing stats in DB for requestId", requestId, error)
    }
}

module.exports = { storeStatsInDb }
