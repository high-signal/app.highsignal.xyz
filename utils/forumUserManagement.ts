import { SupabaseClient } from "@supabase/supabase-js"
import { connectAccountLambdaTrigger } from "./lambda-utils/connectAccountLambdaTrigger"

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

    const connectAccountLambdaTriggerResponse = await connectAccountLambdaTrigger({
        supabase,
        targetUserId,
        projectId,
        signalStrengthId,
        signalStrengthName,
        signalStrengthUsername: forumUsername,
    })

    return connectAccountLambdaTriggerResponse
}
