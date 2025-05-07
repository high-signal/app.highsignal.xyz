import { NextRequest, NextResponse } from "next/server"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { sanitize } from "../../../../../../utils/sanitize"
import { triggerForumAnalysis } from "../../../../../../utils/lambda-utils/forumAnalysis"

export async function GET(request: NextRequest) {
    try {
        // Get the requesting user from the request header
        const privyId = request.headers.get("x-privy-id")!
        const projectUrlSlug = request.nextUrl.searchParams.get("project")!
        const signalStrengthName = request.nextUrl.searchParams.get("signalStrengthName")!
        const targetUsername = request.nextUrl.searchParams.get("targetUsername")!

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        const requestingUser = await getRequestingUserFromDb(supabase, privyId)
        if (!requestingUser) {
            return NextResponse.json({ error: "Requesting user not found" }, { status: 404 })
        }

        const targetUser = await getTargetUserFromDb(supabase, targetUsername)
        if (!targetUser) {
            return NextResponse.json({ error: "Target user not found" }, { status: 404 })
        }

        const signalStrength = await getSignalStrengthFromDb(supabase, projectUrlSlug, signalStrengthName)
        if (!signalStrength) {
            return NextResponse.json({ error: "Signal strength not found" }, { status: 404 })
        }

        const project = await getProjectFromDb(supabase, projectUrlSlug)
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 })
        }

        const { data: testResults, error: testResultsError } = await supabase
            .from("user_signal_strengths_tests")
            .select("*")
            .eq("requesting_user_id", requestingUser.id)
            .eq("user_id", targetUser.id)
            .eq("signal_strength_id", signalStrength.id)
            .eq("project_id", project.id)
            .single()

        if (testResultsError) {
            if (testResultsError.code === "PGRST116") {
                // No results found - this is an expected state
                return NextResponse.json(
                    {
                        success: true,
                        message: "Test results are being processed",
                        testResults: null,
                    },
                    { status: 202 },
                )
            }
            console.error("Error fetching signal strength test results:", testResultsError)
            return NextResponse.json({ error: "Internal server error" }, { status: 500 })
        }

        return NextResponse.json(
            { success: true, message: "Signal strength test result found", testResults },
            { status: 200 },
        )
    } catch (error) {
        console.error("Error fetching project settings:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        // Get the requesting user from the request header
        const privyId = request.headers.get("x-privy-id")!
        const projectUrlSlug = request.nextUrl.searchParams.get("project")!

        // Parse the request body
        const { targetUsername, signalStrengthName, testingPrompt, testingModel, testingTemperature, testingMaxChars } =
            await request.json()

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

        const signalStrength = await getSignalStrengthFromDb(supabase, projectUrlSlug, signalStrengthName)
        if (!signalStrength) {
            return NextResponse.json({ error: "Signal strength not found" }, { status: 404 })
        }

        const forumUser = await getForumUserFromDb(supabase, targetUser.id, project.id)
        if (!forumUser) {
            return NextResponse.json({ error: "Forum user not found" }, { status: 404 })
        }

        // Delete any existing test results for this user and signal strength
        await supabase
            .from("user_signal_strengths_tests")
            .delete()
            .eq("user_id", targetUser.id)
            .eq("signal_strength_id", signalStrength.id)
            .eq("project_id", project.id)
            .eq("requesting_user_id", requestingUser.id)

        // ***************
        // SECURITY CHECK
        // ***************
        // Sanitize new prompt
        const sanitizedTestingPrompt = sanitize(testingPrompt)

        const testingData = {
            requestingUserId: requestingUser.id,
            testingPrompt: sanitizedTestingPrompt,
            testingModel: testingModel,
            testingTemperature: testingTemperature,
            testingMaxChars: testingMaxChars,
        }

        // Format the request body and pass it to the lambda function
        await triggerForumAnalysis(targetUser.id, project.id, forumUser.forum_username, testingData)

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

async function getSignalStrengthFromDb(supabase: SupabaseClient, projectUrlSlug: string, signalStrengthName: string) {
    const { data: signalStrength, error: signalStrengthError } = await supabase
        .from("signal_strengths")
        .select("id")
        .eq("name", signalStrengthName)
        .single()

    if (signalStrengthError || !signalStrength) {
        return null
    }

    return signalStrength
}
