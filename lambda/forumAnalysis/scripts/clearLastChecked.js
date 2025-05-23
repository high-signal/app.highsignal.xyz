async function clearLastChecked(supabase, displayName, user_id, project_id, signal_strength_id) {
    // Delete any last_checked values for this user and project
    const { error: deleteError } = await supabase
        .from("user_signal_strengths")
        .delete()
        .eq("request_id", `last_checked_${user_id}_${project_id}_${signal_strength_id}`)

    if (deleteError) {
        console.error(`Error deleting last_checked values for ${displayName}:`, deleteError.message)
    }
}

module.exports = {
    clearLastChecked,
}
