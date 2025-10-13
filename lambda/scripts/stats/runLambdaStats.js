require("dotenv").config({ path: "../../../../.env" })
const { createClient } = require("@supabase/supabase-js")
const { CloudWatchLogsClient, FilterLogEventsCommand } = require("@aws-sdk/client-cloudwatch-logs")
const { storeStatsInDb } = require("./storeStatsInDb")

const als = require("../utils/asyncContext")

async function runLambdaStats() {
    console.log("📊 Running lambda stats")
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    const store = als.getStore()
    const currentLambdaRequestId = store?.requestId

    // TODO: Maybe add pagination here to get even more rows at once

    // Get rows needing billed_duration
    const { data: rows, error } = await supabase
        .from("lambda_stats")
        .select("request_id, created_at")
        .is("billed_duration", null)
        .neq("request_id", currentLambdaRequestId)
        .order("created_at", { ascending: false })

    if (error) throw error
    if (!rows || rows.length === 0) {
        console.log("No rows to process")
        return
    }

    console.log(`📋 Found ${rows.length} rows to process`)

    // Build lookup set of request_ids
    const idsToFind = new Set(rows.map((r) => r.request_id))
    const results = {}

    // Calculate min/max window across this batch
    const times = rows.map((r) => new Date(r.created_at).getTime())
    const startTime = Math.min(...times) - 60 * 1000
    const endTime = Math.max(...times) + 5 * 60 * 1000

    const client = new CloudWatchLogsClient({ region: process.env.AWS_REGION })
    let nextToken
    let loopCount = 0

    do {
        const command = new FilterLogEventsCommand({
            logGroupName: `/aws/lambda/${process.env.AWS_LAMBDA_FUNCTION_NAME}`,
            filterPattern: `"REPORT"`,
            startTime,
            endTime,
            nextToken,
            limit: 1000,
        })

        const response = await client.send(command)
        loopCount++

        let pageMatches = 0

        if (response.events) {
            for (const ev of response.events) {
                if (ev.message.startsWith("REPORT RequestId:")) {
                    const reqMatch = ev.message.match(/RequestId:\s+([a-f0-9-]+)/)
                    const durMatch = ev.message.match(/Billed Duration: (\d+) ms/)
                    if (reqMatch && durMatch) {
                        const reqId = reqMatch[1]
                        if (idsToFind.has(reqId)) {
                            results[reqId] = parseInt(durMatch[1], 10)
                            idsToFind.delete(reqId)
                            pageMatches++
                        }
                    }
                }
            }
        }

        if (pageMatches > 0) {
            console.log(`🔎 Logs page ${loopCount}: ${pageMatches} matches found (${idsToFind.size} remaining)`)
        }

        // Stop early if all request_ids have been found
        if (idsToFind.size === 0) {
            console.log("✅ All request_ids found. Stopping pagination")
            break
        }

        nextToken = response.nextToken
    } while (nextToken)

    // Update Supabase for all matches
    let updatedCount = 0
    for (const row of rows) {
        const billedDuration = results[row.request_id]
        if (billedDuration != null) {
            const { error: updateError } = await supabase
                .from("lambda_stats")
                .update({ billed_duration: billedDuration })
                .eq("request_id", row.request_id)

            if (updateError) {
                console.error(`❌ Failed to update ${row.request_id}`, updateError)
            } else {
                updatedCount++
            }
        } else {
            // console.log(`⚠️ No REPORT found for ${row.request_id}`)
        }
    }

    if (updatedCount > 0) {
        console.log(`☑️ Updated ${updatedCount} rows`)
    } else {
        console.log(`⚠️ No reports found for any rows`)
    }

    // ==============================
    // Update action count in the DB
    // ==============================
    // Set the action count equal to the number of
    // rows that were updated
    await storeStatsInDb({
        actionCount: updatedCount,
    })

    console.log(`✅ Lambda Row Updates Complete: Processed ${updatedCount} rows`)
}

module.exports = { runLambdaStats }
