import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { triggerLambda } from "./lambda-utils/triggerLambda"

interface ForumUserManagementParams {
    type: "api_auth" | "manual_post"
    supabase: SupabaseClient
    targetUserId: string
    projectId: string
    forumUsername: string
    data: string
    signalStrengthName: string
    signalStrengthId: string
}

export async function forumUserManagement({
    type,
    supabase,
    targetUserId,
    projectId,
    forumUsername,
    data,
    signalStrengthName,
    signalStrengthId,
}: ForumUserManagementParams) {
    // Check if any existing forum_users entry exists for a DIFFERENT user_id and same project_id for the username
    const { data: existingEntries, error: existingEntriesError } = await supabase
        .from("forum_users")
        .select("user_id")
        .eq("project_id", projectId)
        .eq("forum_username", forumUsername)

    if (existingEntriesError) {
        console.error("Error fetching existing forum users:", existingEntriesError)
        throw new Error("Error fetching existing forum users")
    }

    // If they do exist, delete the entries for those other users
    // e.g. Someone lost their old High Signal account and created a new one.
    // We need to delete the old entry for the old account so it does not double count their contributions.
    if (existingEntries) {
        for (let i = existingEntries.length - 1; i >= 0; i--) {
            const entry = existingEntries[i]
            if (entry.user_id !== targetUserId) {
                console.log(`Deleting existing forum user for ${entry.user_id}`)
                await supabase.from("forum_users").delete().eq("user_id", entry.user_id)
                existingEntries.splice(i, 1) // Remove the deleted entry from the array
            }
        }
    }

    // Create/update an entry with the new username
    const { error: upsertError } = await supabase.from("forum_users").upsert({
        user_id: targetUserId,
        project_id: projectId,
        forum_username: forumUsername,
        auth_encrypted_payload: type === "api_auth" ? data : null,
        auth_post_id: type === "manual_post" ? data : null,
        ...(type === "api_auth" ? { auth_post_code: null, auth_post_code_created: null } : {}),
    })

    if (upsertError) {
        console.error("Error upserting forum user:", upsertError)
        throw new Error("Error upserting forum user")
    }

    // Before starting the analysis, add the last_checked date to the user_signal_strengths table.
    // This is to give the best UX experience when the user is updating their forum username
    // so that when they navigate to their profile page, it shows the loading animation immediately.
    // Use unix timestamp to avoid timezone issues.
    const { error: lastCheckError } = await supabase.from("user_signal_strengths").upsert(
        {
            user_id: targetUserId,
            project_id: projectId,
            signal_strength_id: signalStrengthId,
            last_checked: Math.floor(Date.now() / 1000),
            request_id: `last_checked_${targetUserId}_${projectId}_${signalStrengthId}`,
            created: 99999999999999, // This is needed so that it is always the top result
        },
        {
            onConflict: "request_id",
        },
    )

    if (lastCheckError) {
        console.error(`Error updating last_checked for ${forumUsername}:`, lastCheckError.message)
    } else {
        console.log(`Successfully updated last_checked for ${forumUsername}`)
    }

    // Trigger analysis and wait for initial response
    console.log("Triggering forum analysis for user:", forumUsername)
    const analysisResponse = await triggerLambda(signalStrengthName, targetUserId, projectId, forumUsername)

    if (!analysisResponse.success) {
        console.error("Failed to start analysis:", analysisResponse.message)
        throw new Error(analysisResponse.message)
    }

    console.log("Analysis started successfully:", analysisResponse.message)
    return {
        success: true,
        message: analysisResponse.message,
        forumUser: forumUsername,
    }
}
