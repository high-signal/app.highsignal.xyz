const { createClient } = require("@supabase/supabase-js")

async function addAndMaybeRunJob(payload, priority = 100) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    const MAX_CONCURRENCY = 20
    const LOCK_TIMEOUT_SECONDS = 120
    const now = new Date().toISOString()
    const lockedUntil = new Date(Date.now() + LOCK_TIMEOUT_SECONDS * 1000).toISOString()

    // 1️⃣ Add job to queue
    const { data: job, error: insertError } = await supabase
        .from("openai_request_queue")
        .insert({
            status: "pending",
            payload,
            priority,
            created_at: now,
        })
        .select()
        .single()

    if (insertError) {
        console.error("Error adding job to queue:", insertError.message)
        throw insertError
    }

    console.log(`✅ Job added to queue with ID: ${job.id}`)

    // 2️⃣ Check current running jobs count
    const { count: runningCount, error: countError } = await supabase
        .from("openai_request_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "running")
        .gte("locked_until", now)

    if (countError) {
        console.error("Error counting running jobs:", countError.message)
        throw countError
    }

    console.log(`⏳ Running jobs count: ${runningCount}`)

    const availableSlots = MAX_CONCURRENCY - (runningCount || 0)

    if (availableSlots <= 0) {
        console.log("❌ No slots available, job will stay queued for governor.")
        return {
            runJob: false,
            job,
        }
    }

    // 3️⃣ Try to claim this job atomically (if still pending)
    const { data: claimedJob, error: claimError } = await supabase
        .from("openai_request_queue")
        .update({
            status: "running",
            locked_by: "self-run",
            locked_until: lockedUntil,
            started_at: now,
        })
        .eq("id", job.id)
        .eq("status", "pending") // 🔐 ensures atomic locking
        .select()
        .single()

    if (claimError) {
        console.error("Error claiming job:", claimError.message)
        throw claimError
    }

    if (claimedJob) {
        console.log(`✅ Successfully claimed job ${job.id} — running now.`)
        return {
            runJob: true,
            job: claimedJob,
        }
    } else {
        console.log(`❌ Failed to claim job ${job.id} — likely claimed by someone else or governor.`)
        return {
            runJob: false,
            job,
        }
    }
}

module.exports = { addAndMaybeRunJob }
