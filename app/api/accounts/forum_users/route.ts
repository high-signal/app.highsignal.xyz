import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

import { triggerForumAnalysis } from "../../../../utils/lambda-utils/forumAnalysis"

// Create a new forum user
export async function POST(request: Request) {
    try {
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // Parse the request body
        const body = await request.json()
        const { user_id, project_id, forum_username, signal_strength_name } = body

        // Validate required fields
        if (!user_id || !project_id || !forum_username || !signal_strength_name) {
            return NextResponse.json(
                {
                    error: "Missing required fields: user_id, project_id, forum_username, and signal_strength_name are required",
                },
                { status: 400 },
            )
        }

        // Get the signal_strength_id to use in the last_checked upsert
        const { data: signalStrengthData, error: signalStrengthDataError } = await supabase
            .from("signal_strengths")
            .select("id")
            .eq("name", signal_strength_name)
            .single()

        if (signalStrengthDataError) {
            console.error("Error fetching signal strength ID:", signalStrengthDataError)
        }

        if (signalStrengthData?.id) {
            // TODO: Fix this now it requires a request_id for creation
            // Before anything else, add the last_checked date to the user_signal_strengths table.
            // This is to give the best UX experience when the user is updating their forum username
            // so that when they navigate to their profile page, it shows the loading animation immediately.
            // Use unix timestamp to avoid timezone issues.
            const { error: lastCheckError } = await supabase.from("user_signal_strengths").upsert(
                {
                    user_id: user_id,
                    project_id: project_id,
                    signal_strength_id: signalStrengthData.id,
                    last_checked: Math.floor(Date.now() / 1000),
                },
                {
                    onConflict: "user_id,project_id,signal_strength_id",
                },
            )

            if (lastCheckError) {
                console.error(`Error updating last_checked for ${forum_username}:`, lastCheckError.message)
            } else {
                console.log(`Successfully updated last_checked for ${forum_username}`)
            }
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

        try {
            // Trigger analysis and wait for initial response
            console.log("Triggering forum analysis for user:", forum_username)
            const analysisResponse = await triggerForumAnalysis(user_id, project_id, forum_username)

            if (!analysisResponse.success) {
                console.error("Failed to start analysis:", analysisResponse.message)
                return NextResponse.json(
                    {
                        error: analysisResponse.message,
                        forumUser: result,
                    },
                    { status: 400 },
                )
            }

            console.log("Analysis started successfully:", analysisResponse.message)
            return NextResponse.json(
                {
                    success: true,
                    message: analysisResponse.message,
                    forumUser: result,
                },
                { status: 200 },
            )
        } catch (analysisError) {
            console.error("Error starting analysis:", analysisError)
            return NextResponse.json(
                {
                    error: "An unexpected error occurred while starting the analysis",
                    forumUser: result,
                },
                { status: 500 },
            )
        }
    } catch (error) {
        console.error("Unhandled error in forum user update:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
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

        // Delete the forum_users entry
        const { error: forumUserError } = await supabase
            .from("forum_users")
            .delete()
            .eq("user_id", user_id)
            .eq("project_id", project_id)

        // Delete associated user_signal_strengths entry
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
