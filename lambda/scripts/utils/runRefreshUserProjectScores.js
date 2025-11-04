require("dotenv").config({ path: "../../../../.env" })
const { createClient } = require("@supabase/supabase-js")
const { Pool } = require("pg")

async function runRefreshUserProjectScores() {
    console.log("🔄 Refreshing user project scores")

    const runningInLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME && !!process.env.AWS_REGION

    if (runningInLambda) {
        const pool = new Pool({
            connectionString: process.env.SUPABASE_DB_URL_DIRECT_ACCESS, // direct Postgres URL
        })

        try {
            await pool.query("REFRESH MATERIALIZED VIEW CONCURRENTLY user_project_scores;")
            console.log("✅ Refreshed user_project_scores successfully")
        } catch (error) {
            console.error("❌ Failed to refresh user_project_scores:", error)
            throw new Error(`Failed to refresh materialized view: ${error.message}`)
        } finally {
            await pool.end()
        }
    } else {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

        const { error: refreshUserProjectScoresError } = await supabase.rpc("refresh_user_project_scores")

        if (refreshUserProjectScoresError) {
            const errorMessage = `❌ Failed to refresh user project scores: ${refreshUserProjectScoresError.message}`
            console.error(errorMessage)
            throw new Error(errorMessage)
        }
    }
}

module.exports = { runRefreshUserProjectScores }
