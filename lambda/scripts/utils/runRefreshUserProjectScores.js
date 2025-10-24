require("dotenv").config({ path: "../../../../.env" })
const { createClient } = require("@supabase/supabase-js")

async function runRefreshUserProjectScores() {
    console.log("🔄 Refreshing user project scores")
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    const { error: refreshUserProjectScoresError } = await supabase.rpc("refresh_user_project_scores")

    if (refreshUserProjectScoresError) {
        const errorMessage = `❌ Failed to refresh user project scores: ${refreshUserProjectScoresError.message}`
        console.error(errorMessage)
        throw new Error(errorMessage)
    }
}

module.exports = { runRefreshUserProjectScores }
