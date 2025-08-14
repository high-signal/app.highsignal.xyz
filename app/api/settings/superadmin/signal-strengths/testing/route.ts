import { NextRequest, NextResponse } from "next/server"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { triggerLambda } from "../../../../../../utils/lambda-utils/triggerLambda"

export async function POST(request: NextRequest) {
    try {
        // Get the requesting user from the request header
        const privyId = request.headers.get("x-privy-id")!
        const projectUrlSlug = request.nextUrl.searchParams.get("project")!

        // Parse the request body
        const { signalStrengthName, targetUsername, testingInputData } = await request.json()

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        const requestingUser = await getRequestingUserFromDb(supabase, privyId)
        if (!requestingUser) {
            return NextResponse.json({ error: "Requesting user not found" }, { status: 404 })
        }

        const targetUser = await getTargetUserFromDb(supabase, targetUsername)
        if (!targetUser) {
            return NextResponse.json({ error: "Target user not found" }, { status: 404 })
        }

        const project = await getProjectFromDb(supabase, projectUrlSlug)
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 })
        }

        const signalStrength = await getSignalStrengthFromDb(supabase, signalStrengthName)
        if (!signalStrength) {
            return NextResponse.json({ error: "Signal strength not found" }, { status: 404 })
        }

        await clearExistingRows({
            supabase,
            requestingUserId: requestingUser.id,
            signalStrengthId: signalStrength.id,
            targetUserId: targetUser.id,
            projectId: project.id,
            requestingUsername: requestingUser.username,
        })

        let signalStrengthUsername
        if (testingInputData.testingSignalStrengthUsername) {
            signalStrengthUsername = testingInputData.testingSignalStrengthUsername
        } else if (signalStrength.name === "discourse_forum") {
            const forumUser = await getForumUserFromDb(supabase, targetUser.id, project.id)
            if (!forumUser) {
                return NextResponse.json({ error: `Forum user not found for ${targetUser.username}` }, { status: 404 })
            }
            signalStrengthUsername = forumUser.forum_username
        } else if (signalStrength.name === "discord") {
            const discordUser = await getDiscordUserFromDb(supabase, targetUser.id)
            if (!discordUser) {
                return NextResponse.json(
                    { error: `Discord user not found for ${targetUser.username}` },
                    { status: 404 },
                )
            }
            signalStrengthUsername = discordUser.discord_username
        } else {
            return NextResponse.json(
                { error: `Signal strength (${signalStrength.name}) username not configured for testing` },
                { status: 404 },
            )
        }

        // Add the requesting user ID to the testing input data
        const structuredTestingData = {
            requestingUserId: requestingUser.id,
            testingInputData: testingInputData,
        }

        // Format the request body and pass it to the lambda function
        const analysisResponse = await triggerLambda({
            functionType: "addSingleItemToAiQueue",
            signalStrengthName: signalStrength.name,
            userId: targetUser.id,
            projectId: project.id,
            signalStrengthUsername: signalStrengthUsername,
            testingData: structuredTestingData,
        })

        if (!analysisResponse.success) {
            const errorMessage = `Failed to start analysis: ${analysisResponse.message}`
            console.error(errorMessage)
            return NextResponse.json(
                {
                    error: errorMessage,
                },
                { status: 400 },
            )
        }

        // Then trigger AI governor
        const aiGovernorResponse = await triggerLambda({
            functionType: "runAiGovernor",
        })

        if (!aiGovernorResponse.success) {
            const errorMessage = `Failed to run AI governor: ${aiGovernorResponse.message}`
            console.error(errorMessage)
            return NextResponse.json({ error: errorMessage }, { status: 400 })
        }

        return NextResponse.json({ success: true, message: "Analysis initiated successfully" }, { status: 200 })
    } catch (error) {
        console.error("Error fetching project settings:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // Get the requesting user from the request header
        const privyId = request.headers.get("x-privy-id")!
        const projectUrlSlug = request.nextUrl.searchParams.get("project")!

        // Parse the request body
        const { signalStrengthName, targetUsername, testingInputData } = await request.json()

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        const requestingUser = await getRequestingUserFromDb(supabase, privyId)
        if (!requestingUser) {
            return NextResponse.json({ error: "Requesting user not found" }, { status: 404 })
        }

        const targetUser = await getTargetUserFromDb(supabase, targetUsername)
        if (!targetUser) {
            return NextResponse.json({ error: "Target user not found" }, { status: 404 })
        }

        const project = await getProjectFromDb(supabase, projectUrlSlug)
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 })
        }

        const signalStrength = await getSignalStrengthFromDb(supabase, signalStrengthName)
        if (!signalStrength) {
            return NextResponse.json({ error: "Signal strength not found" }, { status: 404 })
        }

        await clearExistingRows({
            supabase,
            requestingUserId: requestingUser.id,
            signalStrengthId: signalStrength.id,
            targetUserId: targetUser.id,
            projectId: project.id,
            requestingUsername: requestingUser.username,
        })

        return NextResponse.json({ success: true, message: "Analysis cancelled successfully" }, { status: 200 })
    } catch (error) {
        console.error("Error fetching project settings:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

async function clearExistingRows({
    supabase,
    requestingUserId,
    signalStrengthId,
    targetUserId,
    projectId,
    requestingUsername,
}: {
    supabase: SupabaseClient
    requestingUserId: string
    signalStrengthId: string
    targetUserId: string
    projectId: string
    requestingUsername: string
}) {
    // If there is testing data, delete the existing user_signal_strengths row
    const { error: deleteError } = await supabase
        .from("user_signal_strengths")
        .delete()
        .eq("test_requesting_user", requestingUserId)
        .eq("signal_strength_id", signalStrengthId)

    if (deleteError) {
        console.error(`Error deleting user_signal_strengths row for ${requestingUsername}:`, deleteError.message)
    }

    // Fetch all the existing ai_request_queue rows for the target user
    const { data: aiRequestQueueRows, error: aiRequestQueueError } = await supabase
        .from("ai_request_queue")
        .select("*")
        .eq("user_id", targetUserId)
        .eq("project_id", projectId)
        .eq("signal_strength_id", signalStrengthId)
        .not("test_data", "is", null)

    if (aiRequestQueueError) {
        console.error(`Error fetching ai_request_queue rows for ${requestingUsername}:`, aiRequestQueueError.message)
    }

    // Filter for rows that have test_data with a matching test_requesting_user
    const rowsToDelete = aiRequestQueueRows?.filter((row) => row.test_data?.requestingUserId === requestingUserId) || []

    // Then delete the those matching rows
    const { error: deleteAiRequestQueueError } = await supabase
        .from("ai_request_queue")
        .delete()
        .in(
            "id",
            rowsToDelete.map((row) => row.id),
        )

    if (deleteAiRequestQueueError) {
        console.error(
            `Error deleting ai_request_queue rows for ${requestingUsername}:`,
            deleteAiRequestQueueError.message,
        )
    }
}

async function getRequestingUserFromDb(supabase: SupabaseClient, privyId: string) {
    const { data: requestingUser, error: requestingUserError } = await supabase
        .from("users")
        .select("id, username")
        .eq("privy_id", privyId)
        .single()

    if (requestingUserError && requestingUserError.code !== "PGRST116") {
        console.error("Error checking privy_id:", requestingUserError)
        return null
    }

    return requestingUser
}

async function getTargetUserFromDb(supabase: SupabaseClient, targetUsername: string) {
    const { data: targetUser, error: targetUserError } = await supabase
        .from("users")
        .select("id, username")
        .eq("username", targetUsername)
        .single()

    if (targetUserError || !targetUser) {
        return null
    }

    return targetUser
}

async function getProjectFromDb(supabase: SupabaseClient, projectUrlSlug: string) {
    const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id")
        .eq("url_slug", projectUrlSlug)
        .single()

    if (projectError || !project) {
        return null
    }

    return project
}

async function getForumUserFromDb(supabase: SupabaseClient, targetUserId: string, projectId: string) {
    const { data: forumUser, error: forumUserError } = await supabase
        .from("forum_users")
        .select("forum_username")
        .eq("user_id", targetUserId)
        .eq("project_id", projectId)
        .not("forum_username", "is", null)
        .single()

    if (forumUserError || !forumUser) {
        return null
    }

    return forumUser
}

async function getSignalStrengthFromDb(supabase: SupabaseClient, signalStrengthName: string) {
    const { data: signalStrength, error: signalStrengthError } = await supabase
        .from("signal_strengths")
        .select("id, name")
        .eq("name", signalStrengthName)
        .single()

    if (signalStrengthError || !signalStrength) {
        return null
    }

    return signalStrength
}

async function getDiscordUserFromDb(supabase: SupabaseClient, targetUserId: string) {
    const { data: discordUser, error: discordUserError } = await supabase
        .from("users")
        .select("discord_username")
        .eq("id", targetUserId)
        .single()

    if (discordUserError || !discordUser) {
        return null
    }

    return discordUser
}
