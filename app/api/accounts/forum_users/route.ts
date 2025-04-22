import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { verifyAuth } from "../../../../utils/verifyAuth"
// @ts-ignore
import { getSignalStrengthConfig } from "../../../../scripts/discourse_forum/getSignalStrengthConfig"
// @ts-ignore
import { fetchUserActivity } from "../../../../scripts/discourse_forum/fetchUserActivity"
// @ts-ignore
import { updateUserData } from "../../../../scripts/discourse_forum/updateUserData"
// @ts-ignore
import { updateRequired } from "../../../../scripts/discourse_forum/updateRequired"
// @ts-ignore
import { analyzeUserData } from "../../../../scripts/discourse_forum/analyzeUserData"

export async function PUT(request: Request) {
    const SIGNAL_STRENGTH_NAME = "discourse_forum"

    try {
        // TODO ENABLE AUTH AFTER TESTING
        // // Check auth token
        // const authHeader = request.headers.get("Authorization")
        // const authResult = await verifyAuth(authHeader)
        // if (authResult instanceof NextResponse) return authResult

        // // If not authenticated, return an error
        // if (!authResult.isAuthenticated) {
        //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        // }

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // Parse the request body
        const body = await request.json()
        const { user_id, project_id, forum_username } = body

        // Validate required fields
        if (!user_id || !project_id || !forum_username) {
            return NextResponse.json(
                { error: "Missing required fields: user_id, project_id, and forum_username are required" },
                { status: 400 },
            )
        }

        // TODO: Add a check to see if the forum_username is already in the database
        // If it is, delete the old entry and create a new one for the new requesting user

        // Check if an entry already exists with the same user_id and project_id
        const { data: existingEntry, error: checkError } = await supabase
            .from("forum_users")
            .select("last_updated")
            .eq("user_id", user_id)
            .eq("project_id", project_id)
            .single()

        if (checkError && checkError.code !== "PGRST116") {
            console.error("Error checking for existing entry:", checkError)
            return NextResponse.json({ error: "Error checking for existing entry" }, { status: 500 })
        }

        let result

        if (existingEntry) {
            // Entry exists, update it and clear last_updated if it had a value
            const updateData: Record<string, any> = {
                forum_username: forum_username,
            }

            // Only set last_updated to null if it had a value
            if (existingEntry.last_updated) {
                updateData.last_updated = null
            }

            const { data, error } = await supabase
                .from("forum_users")
                .update(updateData)
                .eq("user_id", user_id)
                .eq("project_id", project_id)
                .select()
                .single()

            if (error) {
                console.error("Error updating forum user:", error)
                return NextResponse.json({ error: "Error updating forum user" }, { status: 500 })
            }

            result = data
        } else {
            // Entry doesn't exist, create a new one
            const { data, error } = await supabase
                .from("forum_users")
                .insert([
                    {
                        user_id,
                        project_id,
                        forum_username,
                    },
                ])
                .select()
                .single()

            if (error) {
                console.error("Error creating forum user:", error)
                return NextResponse.json({ error: "Error creating forum user" }, { status: 500 })
            }

            result = data
        }

        // After successful update, trigger the PATCH route to analyze the user forum activity
        try {
            // Get the signal strength ID using the name from the signal_strengths table
            const { data: signalStrengthData, error: signalError } = await supabase
                .from("signal_strengths")
                .select("id")
                .eq("name", SIGNAL_STRENGTH_NAME)
                .single()

            if (signalError) {
                console.error("Error fetching signal strength ID:", signalError)
                // Continue without triggering PATCH
                return NextResponse.json(result)
            }

            if (!signalStrengthData) {
                console.log(`No signal strength found with name: ${SIGNAL_STRENGTH_NAME}`)
                // Continue without triggering PATCH
                return NextResponse.json(result)
            }

            const signal_strength_id = signalStrengthData.id

            // Check if this signal strength is enabled for the project
            const { data: projectSignalData, error: projectSignalError } = await supabase
                .from("project_signal_strengths")
                .select("enabled")
                .eq("project_id", project_id)
                .eq("signal_strength_id", signal_strength_id)
                .single()

            if (projectSignalError || !projectSignalData || !projectSignalData.enabled) {
                console.log(`Signal strength ${SIGNAL_STRENGTH_NAME} is not enabled for this project`)
                // Continue without triggering PATCH
                return NextResponse.json(result)
            }

            // Get the request URL from the request object
            const requestUrl = new URL(request.url)
            const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`

            // Create a new request object for the PATCH route
            const patchRequest = new Request(`${baseUrl}/api/accounts/forum_users`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id,
                    project_id,
                    signal_strength_id,
                    forum_username,
                }),
            })

            // Call the PATCH handler directly
            PATCH(patchRequest).catch((error) => {
                console.error("Error in background PATCH request:", error)
            })

            // Return the PUT result immediately
            return NextResponse.json(result)
        } catch (patchError) {
            console.error("Error preparing PATCH request:", patchError)
            // Continue with just the PUT result
            return NextResponse.json(result)
        }
    } catch (error) {
        console.error("Unhandled error in forum user update:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        // TODO ENABLE AUTH AFTER TESTING
        // // Check auth token
        // const authHeader = request.headers.get("Authorization")
        // const authResult = await verifyAuth(authHeader)
        // if (authResult instanceof NextResponse) return authResult

        // // If not authenticated, return an error
        // if (!authResult.isAuthenticated) {
        //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        // }

        console.log("PATCH request received")

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // Parse the request body
        const body = await request.json()
        const { user_id, project_id, signal_strength_id, forum_username } = body

        // Validate required fields
        if (!project_id || !signal_strength_id || !forum_username) {
            return NextResponse.json(
                { error: "Missing required fields: project_id, signal_strength_id, and forum_username are required" },
                { status: 400 },
            )
        }

        // === Fetch signal strength config from Supabase ===
        console.log(`Fetching signal strength config from Supabase for project ${project_id}...`)
        const signalStrengthConfig = await getSignalStrengthConfig(supabase, project_id, signal_strength_id)

        if (!signalStrengthConfig || signalStrengthConfig.length === 0) {
            return NextResponse.json({ error: "Signal strength config not found" }, { status: 404 })
        }

        const enabled = signalStrengthConfig[0].enabled
        const maxValue = signalStrengthConfig[0].max_value
        const url = signalStrengthConfig[0].url
        const previousDays = signalStrengthConfig[0].previous_days

        if (!enabled) {
            return NextResponse.json({ error: "Signal strength is not enabled for this project" }, { status: 400 })
        }

        // === Get user data from Supabase ===
        const { data: userData, error: userError } = await supabase
            .from("forum_users")
            .select("*")
            .eq("user_id", user_id)
            .eq("project_id", project_id)
            .single()

        if (userError) {
            console.error("Error fetching user data:", userError)
            return NextResponse.json({ error: "User not found or error fetching user data" }, { status: 404 })
        }

        const lastUpdated = userData.last_updated

        // === Get user display name from Supabase ===
        const { data: userDisplayName, error: userDisplayNameError } = await supabase
            .from("users")
            .select("display_name")
            .eq("id", user_id)
            .single()

        if (userDisplayNameError) {
            console.error("Error fetching user display name:", userDisplayNameError)
            return NextResponse.json({ error: "User not found or error fetching user display name" }, { status: 404 })
        }

        const displayName = userDisplayName.display_name

        // === Fetch activity data from forum API ===
        console.log(`Fetching activity for user: ${forum_username}`)
        const activityData = await fetchUserActivity(url, forum_username)
        console.log(`Processed ${activityData?.length || 0} activities for ${forum_username}`)

        // === Update the last_checked date in the user_signal_strengths table ===
        // Use unix timestamp to avoid timezone issues
        const { error } = await supabase.from("user_signal_strengths").upsert(
            {
                user_id: user_id,
                project_id: project_id,
                signal_strength_id: signal_strength_id,
                last_checked: Math.floor(Date.now() / 1000),
            },
            {
                onConflict: "user_id,project_id,signal_strength_id",
            },
        )

        console.log("user_id", user_id)
        console.log("project_id", project_id)
        console.log("signal_strength_id", signal_strength_id)

        if (error) {
            console.error(`Error updating last_checked for ${forum_username}:`, error.message)
        } else {
            console.log(`Successfully updated last_checked for ${forum_username}`)
        }

        if (!activityData || activityData.length === 0) {
            return NextResponse.json({ error: "No activity data found for this user" }, { status: 404 })
        }

        // === Get the latest activity date for the update ===
        const latestActivityDate = activityData.sort(
            (a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        )[0].updated_at

        // === Check if update is required ===
        if (!updateRequired(lastUpdated, latestActivityDate)) {
            return NextResponse.json({ message: "User data is up to date. No analysis needed." }, { status: 200 })
        }

        // Filter activity data to the past X days
        const filteredActivityData = activityData.filter(
            (activity: any) =>
                new Date(activity.updated_at) > new Date(new Date().setDate(new Date().getDate() - previousDays)),
        )

        console.log(`Filtered activity data to the past ${previousDays} days: ${filteredActivityData.length}`)

        // === Analyze user data with AI ===
        const analysisResults = await analyzeUserData(
            filteredActivityData,
            forum_username,
            displayName,
            maxValue,
            previousDays,
        )

        // === Validity check on maxValue ===
        if (analysisResults && !analysisResults.error) {
            if (analysisResults[forum_username].value > maxValue) {
                console.log(`User ${forum_username} has a score greater than ${maxValue}. Setting to ${maxValue}.`)
                analysisResults[forum_username].value = maxValue
            }
        }

        // === Store the analysis results in the database ===
        if (analysisResults && !analysisResults.error) {
            await updateUserData(
                supabase,
                project_id,
                signal_strength_id,
                forum_username,
                userData,
                latestActivityDate,
                analysisResults,
            )

            return NextResponse.json({
                message: "User data successfully updated",
                analysis: analysisResults[forum_username],
            })
        } else {
            console.error(`Analysis failed for ${forum_username}:`, analysisResults?.error || "Unknown error")
            return NextResponse.json({ error: "Failed to analyze user data" }, { status: 500 })
        }
    } catch (error) {
        console.error("Unhandled error in forum user update:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    // TODO ENABLE AUTH AFTER TESTING
    // // Check auth token
    // const authHeader = request.headers.get("Authorization")
    // const authResult = await verifyAuth(authHeader)
    // if (authResult instanceof NextResponse) return authResult

    // // If not authenticated, return an error
    // if (!authResult.isAuthenticated) {
    //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    try {
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // Parse the request body
        const body = await request.json()
        const { user_id, project_id, signal_strength_id } = body

        // Validate required fields
        if (!user_id || !project_id) {
            return NextResponse.json(
                { error: "Missing required fields: user_id and project_id are required" },
                { status: 400 },
            )
        }

        // Delete the forum user entry
        const { error: forumUserError } = await supabase
            .from("forum_users")
            .delete()
            .eq("user_id", user_id)
            .eq("project_id", project_id)

        // Delete associated signal strength
        const { error: signalError } = await supabase
            .from("user_signal_strengths")
            .delete()
            .eq("user_id", user_id)
            .eq("project_id", project_id)
            .eq("signal_strength_id", signal_strength_id)

        if (forumUserError || signalError) {
            console.error("Error deleting forum user:", forumUserError || signalError)
            return NextResponse.json({ error: "Error deleting forum user" }, { status: 500 })
        }

        return NextResponse.json({ message: "Forum user deleted successfully" })
    } catch (error) {
        console.error("Unhandled error in forum user deletion:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
