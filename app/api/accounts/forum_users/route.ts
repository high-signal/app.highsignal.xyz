import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

import { triggerLambda } from "../../../../utils/lambda-utils/triggerLambda"

// Generate forum user auth URL
export async function GET(request: Request) {
    const signalStrengthName = "discourse_forum"

    try {
        const username = request ? new URL(request.url).searchParams.get("username") : null
        const projectUrlSlug = request ? new URL(request.url).searchParams.get("project") : null

        if (!projectUrlSlug || !username) {
            return NextResponse.json(
                { error: "Missing required fields: project and username are required" },
                { status: 400 },
            )
        }

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // Lookup the signal strength ID for the discourse_forum signal strength
        const { data: signalStrengthData, error: signalStrengthDataError } = await supabase
            .from("signal_strengths")
            .select("id")
            .eq("name", signalStrengthName)
            .single()

        if (signalStrengthDataError || !signalStrengthData) {
            console.error("Error fetching signal strength ID:", signalStrengthDataError)
            return NextResponse.json({ error: "Error fetching signal strength ID" }, { status: 500 })
        }

        // Lookup the project ID using the projectUrlSlug
        const { data: projectData, error: projectDataError } = await supabase
            .from("projects")
            .select("id")
            .eq("url_slug", projectUrlSlug)
            .single()

        if (projectDataError || !projectData) {
            console.error("Error fetching project ID:", projectDataError)
            return NextResponse.json({ error: "Error fetching project ID" }, { status: 500 })
        }

        // Lookup the project signal strength URL using the signal strength ID and project ID
        const { data: projectSignalStrengthData, error: projectSignalStrengthDataError } = await supabase
            .from("project_signal_strengths")
            .select("url")
            .eq("signal_strength_id", signalStrengthData.id)
            .eq("project_id", projectData.id)
            .single()

        if (projectSignalStrengthDataError || !projectSignalStrengthData) {
            console.error("Error fetching project signal strength URL:", projectSignalStrengthDataError)
            return NextResponse.json({ error: "Error fetching project signal strength URL" }, { status: 500 })
        }

        const ApplicationName = encodeURIComponent(process.env.NEXT_PUBLIC_SITE_NAME!)
        const ClientId = process.env.DISCOURSE_FORUM_CLIENT_ID!
        const PublicKey = encodeURIComponent(process.env.DISCOURSE_FORUM_PUBLIC_KEY!.replace(/\\n/g, "\n"))
        const Nonce = Math.floor(Math.random() * 0xfffffffffffff)
            .toString(16)
            .padStart(16, "0")
        const AuthRedirect = encodeURIComponent(
            `${process.env.NEXT_PUBLIC_SITE_URL!}/settings/u/${username}?tab=connected-accounts&type=discourse_forum&project=${projectUrlSlug}`,
        )

        return NextResponse.json({
            message: "Forum user auth URL generated successfully",
            url: `${projectSignalStrengthData.url}/user-api-key/new?application_name=${ApplicationName}&client_id=${ClientId}&scopes=session_info&public_key=${PublicKey}&nonce=${Nonce}&auth_redirect=${AuthRedirect}`,
        })
    } catch (error) {
        console.error("Error generating forum user auth URL:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// Create a new forum user
export async function POST(request: Request) {
    try {
        const signalStrengthName = "discourse_forum"

        // Parse the request URL params
        const username = request ? new URL(request.url).searchParams.get("username") : null
        const projectUrlSlug = request ? new URL(request.url).searchParams.get("project") : null

        // Parse the request body
        const body = await request.json()
        const { payload } = body

        if (!projectUrlSlug || !username || !payload) {
            return NextResponse.json(
                { error: "Missing required fields: project, username, and payload are required" },
                { status: 400 },
            )
        }

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // Lookup the user ID using the username
        const { data: targetUserData, error: targetUserDataError } = await supabase
            .from("users")
            .select("id")
            .eq("username", username)
            .single()

        if (targetUserDataError || !targetUserData) {
            console.error("Error fetching target user ID:", targetUserDataError)
            return NextResponse.json({ error: "Error fetching target user ID" }, { status: 500 })
        }

        // Steps:
        // - Get the url for the forum using the projectUrlSlug
        // Lookup the signal strength ID for the discourse_forum signal strength
        const { data: signalStrengthData, error: signalStrengthDataError } = await supabase
            .from("signal_strengths")
            .select("id")
            .eq("name", signalStrengthName)
            .single()

        if (signalStrengthDataError || !signalStrengthData) {
            console.error("Error fetching signal strength ID:", signalStrengthDataError)
            return NextResponse.json({ error: "Error fetching signal strength ID" }, { status: 500 })
        }

        // Lookup the project ID using the projectUrlSlug
        const { data: projectData, error: projectDataError } = await supabase
            .from("projects")
            .select("id")
            .eq("url_slug", projectUrlSlug)
            .single()

        if (projectDataError || !projectData) {
            console.error("Error fetching project ID:", projectDataError)
            return NextResponse.json({ error: "Error fetching project ID" }, { status: 500 })
        }

        // Lookup the project signal strength URL using the signal strength ID and project ID
        const { data: projectSignalStrengthData, error: projectSignalStrengthDataError } = await supabase
            .from("project_signal_strengths")
            .select("url")
            .eq("signal_strength_id", signalStrengthData.id)
            .eq("project_id", projectData.id)
            .single()

        if (projectSignalStrengthDataError || !projectSignalStrengthData) {
            console.error("Error fetching project signal strength URL:", projectSignalStrengthDataError)
            return NextResponse.json({ error: "Error fetching project signal strength URL" }, { status: 500 })
        }

        // Decrypt the payload to get the user API key
        const decryptedPayload = (() => {
            try {
                const forge = require("node-forge")
                const privateKey = process.env.DISCOURSE_FORUM_PRIVATE_KEY!

                // Convert base64 to buffer
                const encryptedBuffer = Buffer.from(payload, "base64")

                // Convert the private key to forge format
                const privateKeyPem = forge.pki.privateKeyFromPem(privateKey)

                // Convert buffer to forge buffer
                const forgeBuffer = forge.util.createBuffer(encryptedBuffer)

                // Decrypt using private key with PKCS#1 v1.5 padding (matching openssl rsautl)
                const decrypted = privateKeyPem.decrypt(forgeBuffer.getBytes(), "RSAES-PKCS1-V1_5")

                // Parse the decrypted JSON
                const parsed = JSON.parse(decrypted)
                return parsed
            } catch (error) {
                console.error("Error decrypting payload:", error)
                throw new Error("Failed to decrypt payload")
            }
        })()

        // - Use the User-Api-Key in the header request to the forum endpoint /session/current.json
        const sessionResponse = await fetch(`${projectSignalStrengthData.url}/session/current.json`, {
            headers: {
                "User-Api-Key": decryptedPayload.key,
            },
        })

        // - Get the username from the response for current_user.username
        const sessionData = await sessionResponse.json()
        const forumUsername = sessionData?.current_user?.username

        if (!forumUsername) {
            return NextResponse.json({ error: "Failed to get forum username" }, { status: 400 })
        }

        // Check if any existing forum_users entry exists for a DIFFERENT user_id and same project_id for the username
        const { data: existingEntries, error: existingEntriesError } = await supabase
            .from("forum_users")
            .select("user_id, last_updated")
            .eq("project_id", projectData.id)
            .eq("forum_username", forumUsername)

        if (existingEntriesError) {
            console.error("Error fetching existing forum users:", existingEntriesError)
            return NextResponse.json({ error: "Error fetching existing forum users" }, { status: 500 })
        }

        // If they do exist, delete the entries for those other users
        // e.g. Someone lost their old High Signal account and created a new one.
        // We need to delete the old entry for the old account so it does not double count their contributions.
        if (existingEntries) {
            for (let i = existingEntries.length - 1; i >= 0; i--) {
                const entry = existingEntries[i]
                if (entry.user_id !== targetUserData.id) {
                    await supabase.from("forum_users").delete().eq("user_id", entry.user_id)
                    existingEntries.splice(i, 1) // Remove the deleted entry from the array
                }
            }
        }

        // Create/update an entry with the new username
        const { error: upsertError } = await supabase.from("forum_users").upsert({
            user_id: targetUserData.id,
            project_id: projectData.id,
            forum_username: forumUsername,
            encrypted_payload: payload,
            ...(existingEntries[0]?.last_updated ? { last_updated: null } : {}),
        })

        if (upsertError) {
            console.error("Error upserting forum user:", upsertError)
            return NextResponse.json({ error: "Error upserting forum user" }, { status: 500 })
        }

        // Before starting the analysis, add the last_checked date to the user_signal_strengths table.
        // This is to give the best UX experience when the user is updating their forum username
        // so that when they navigate to their profile page, it shows the loading animation immediately.
        // Use unix timestamp to avoid timezone issues.
        const { error: lastCheckError } = await supabase.from("user_signal_strengths").upsert(
            {
                user_id: targetUserData.id,
                project_id: projectData.id,
                signal_strength_id: signalStrengthData.id,
                last_checked: Math.floor(Date.now() / 1000),
                request_id: `last_checked_${targetUserData.id}_${projectData.id}_${signalStrengthData.id}`,
                created: 99999999999999,
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

        try {
            // Trigger analysis and wait for initial response
            console.log("Triggering forum analysis for user:", forumUsername)
            const analysisResponse = await triggerLambda(
                signalStrengthName,
                targetUserData.id,
                projectData.id,
                forumUsername,
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

            console.log("Analysis started successfully:", analysisResponse.message)
            return NextResponse.json(
                {
                    success: true,
                    message: analysisResponse.message,
                    forumUser: forumUsername,
                },
                { status: 200 },
            )
        } catch (analysisError) {
            console.error("Error starting analysis:", analysisError)
            return NextResponse.json(
                {
                    error: "An unexpected error occurred while starting the analysis",
                    forumUser: forumUsername,
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
        const signalStrengthName = "discourse_forum"

        // Parse the request URL params
        const username = request ? new URL(request.url).searchParams.get("username") : null
        const projectUrlSlug = request ? new URL(request.url).searchParams.get("project") : null

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // Validate required fields
        if (!username || !projectUrlSlug) {
            return NextResponse.json(
                { error: "Missing required fields: username and project are required" },
                { status: 400 },
            )
        }

        // Lookup the user ID using the username
        const { data: targetUserData, error: targetUserDataError } = await supabase
            .from("users")
            .select("id")
            .eq("username", username)
            .single()

        if (targetUserDataError || !targetUserData) {
            console.error("Error fetching target user ID:", targetUserDataError)
            return NextResponse.json({ error: "Error fetching target user ID" }, { status: 500 })
        }

        // Lookup the project ID using the projectUrlSlug
        const { data: projectData, error: projectDataError } = await supabase
            .from("projects")
            .select("id")
            .eq("url_slug", projectUrlSlug)
            .single()

        if (projectDataError || !projectData) {
            console.error("Error fetching project ID:", projectDataError)
            return NextResponse.json({ error: "Error fetching project ID" }, { status: 500 })
        }

        // Lookup the signal strength ID for the discourse_forum signal strength
        const { data: signalStrengthData, error: signalStrengthDataError } = await supabase
            .from("signal_strengths")
            .select("id")
            .eq("name", signalStrengthName)
            .single()

        if (signalStrengthDataError || !signalStrengthData) {
            console.error("Error fetching signal strength ID:", signalStrengthDataError)
            return NextResponse.json({ error: "Error fetching signal strength ID" }, { status: 500 })
        }

        // Delete the forum_users entry
        const { error: forumUserError } = await supabase
            .from("forum_users")
            .delete()
            .eq("user_id", targetUserData.id)
            .eq("project_id", projectData.id)

        if (forumUserError) {
            console.error("Error deleting forum user:", forumUserError)
            return NextResponse.json({ error: "Error deleting forum user" }, { status: 500 })
        }

        // Delete associated user_signal_strengths entries
        const { error: signalError } = await supabase
            .from("user_signal_strengths")
            .delete()
            .eq("user_id", targetUserData.id)
            .eq("project_id", projectData.id)
            .eq("signal_strength_id", signalStrengthData.id)

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
