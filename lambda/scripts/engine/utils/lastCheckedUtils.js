async function setLastChecked({ supabase, userId, projectId, signalStrengthId }) {
    // Set the last_checked value so that the user profile page shows the loading animation
    // even when this update is triggered automatically each day

    if (supabase && userId && projectId && signalStrengthId) {
        const { error: lastCheckError } = await supabase.from("user_signal_strengths").upsert(
            {
                user_id: userId,
                project_id: projectId,
                signal_strength_id: signalStrengthId,
                last_checked: Math.floor(Date.now() / 1000),
                request_id: `last_checked_${userId}_${projectId}_${signalStrengthId}`,
                created: 99999999999999,
            },
            {
                onConflict: "request_id",
            },
        )

        if (lastCheckError) {
            console.error(`Error updating last_checked for userId ${userId}:`, lastCheckError.message)
        } else {
            console.log(`Successfully updated last_checked for userId ${userId}`)
        }
    } else {
        console.error("Error setting last_checked: missing parameters")
    }
}

async function clearLastChecked({ supabase, userId, projectId, signalStrengthId }) {
    // Delete any last_checked values for this user and project
    if (supabase && userId && projectId && signalStrengthId) {
        const { error: deleteError } = await supabase
            .from("user_signal_strengths")
            .delete()
            .eq("request_id", `last_checked_${userId}_${projectId}_${signalStrengthId}`)

        if (deleteError) {
            console.error(
                `Error deleting last_checked values for ${userId}_${projectId}_${signalStrengthId}:`,
                deleteError.message,
            )
        }
    } else {
        console.error("Error clearing last_checked: missing parameters")
    }
}

module.exports = {
    setLastChecked,
    clearLastChecked,
}
