import { NextRequest, NextResponse } from "next/server"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { triggerLambda } from "../../../../../../utils/lambda-utils/triggerLambda"

interface StructuredTestingData {
    requestingUserId: string
    testingInputData: TestingInputData
}

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

        // If there is testing data, delete the existing user_signal_strengths row
        const { error: deleteError } = await supabase
            .from("user_signal_strengths")
            .delete()
            .eq("test_requesting_user", requestingUser.id)
            .eq("signal_strength_id", signalStrength.id)

        if (deleteError) {
            console.error(
                `Error deleting user_signal_strengths row for ${requestingUser.username}:`,
                deleteError.message,
            )
        }

        let signalStrengthUsername
        if (testingInputData.testingSignalStrengthUsername) {
            signalStrengthUsername = testingInputData.testingSignalStrengthUsername
        } else if (signalStrength.name === "discourse_forum") {
            const forumUser = await getForumUserFromDb(supabase, targetUser.id, project.id)
            if (!forumUser) {
                return NextResponse.json({ error: "Forum user not found" }, { status: 404 })
            }
            signalStrengthUsername = forumUser.forum_username
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
        const analysisResponse = await triggerLambda(
            signalStrength.name,
            targetUser.id,
            project.id,
            signalStrengthUsername,
            structuredTestingData,
        )

        if (!analysisResponse.success) {
            console.error("Failed to start analysis:", analysisResponse.message)
            return NextResponse.json(
                {
                    error: analysisResponse.message,
                },
                { status: 400 },
            )
        }

        return NextResponse.json({ success: true, message: "Analysis initiated successfully" }, { status: 200 })
    } catch (error) {
        console.error("Error fetching project settings:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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
