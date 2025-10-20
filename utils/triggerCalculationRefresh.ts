import { SupabaseClient } from "@supabase/supabase-js"
import { triggerLambda } from "./lambda-utils/triggerLambda"

export async function triggerCalculationRefresh(supabase: SupabaseClient, userId: string) {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    // Delete the user_signal_strengths item for the current user for yesterday (UTC)
    const { error: deleteUserSignalStrengthsError } = await supabase
        .from("user_signal_strengths")
        .delete()
        .eq("user_id", userId)
        .eq("day", yesterday)

    if (deleteUserSignalStrengthsError) {
        console.error(`❌ Error deleting user_signal_strengths:`, deleteUserSignalStrengthsError)
        return
    }

    console.log(`🔄 User_signal_strengths deleted for user id: ${userId} - Date: ${yesterday}`)

    // Delete the ai_request_queue item for the current user for yesterday (UTC)
    const { error: deleteAiRequestQueueError } = await supabase
        .from("ai_request_queue")
        .delete()
        .eq("user_id", userId)
        .eq("day", yesterday)

    if (deleteAiRequestQueueError) {
        console.error(`❌ Error deleting ai_request_queue:`, deleteAiRequestQueueError)
        return
    }

    console.log(`🔄 Ai_request_queue deleted for user id: ${userId} - Date: ${yesterday}`)

    // Trigger the add all items to ai queue lambda function
    await triggerLambda({ functionType: "addAllItemsToAiQueue" })

    // Then run the run ai governor lambda function
    await triggerLambda({ functionType: "runAiGovernor" })

    console.log(`Calculation refresh triggered for user id: ${userId} - Date: ${yesterday}`)
}
