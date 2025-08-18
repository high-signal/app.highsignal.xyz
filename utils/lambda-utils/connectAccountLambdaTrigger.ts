import { SupabaseClient } from "@supabase/supabase-js"
import { triggerLambda } from "./triggerLambda"

export async function connectAccountLambdaTrigger({
    supabase,
    targetUserId,
    projectId,
    signalStrengthId,
    signalStrengthName,
    signalStrengthUsername,
}: {
    supabase: SupabaseClient
    targetUserId: string
    projectId: string
    signalStrengthId: string
    signalStrengthName: string
    signalStrengthUsername: string
}) {
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
        console.error(`Error updating last_checked for ${signalStrengthUsername}:`, lastCheckError.message)
    } else {
        console.log(`Successfully updated last_checked for ${signalStrengthUsername}`)
    }
    // Trigger analysis and wait for initial response
    console.log("addSingleItemToAiQueue for:", signalStrengthUsername)
    const analysisResponse = await triggerLambda({
        functionType: "addSingleItemToAiQueue",
        signalStrengthName,
        userId: targetUserId,
        projectId,
        signalStrengthUsername: signalStrengthUsername,
    })
    if (!analysisResponse.success) {
        console.error("Failed to start analysis:", analysisResponse.message)
        throw new Error(analysisResponse.message)
    }
    // Trigger the runAiGovernor lambda to run the engine.
    console.log("runAiGovernor for:", signalStrengthUsername)
    const runAiGovernorResponse = await triggerLambda({
        functionType: "runAiGovernor",
    })
    if (!runAiGovernorResponse.success) {
        console.error("Failed to start runAiGovernor:", runAiGovernorResponse.message)
        throw new Error(runAiGovernorResponse.message)
    }
    console.log("Analysis started successfully:", analysisResponse.message)
    return {
        success: true,
        message: analysisResponse.message,
        signalStrengthUsername: signalStrengthUsername,
    }
}
