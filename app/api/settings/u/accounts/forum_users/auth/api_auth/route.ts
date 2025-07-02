import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { forumUserManagement } from "../../../../../../../../utils/forumUserManagement"

// Generate forum user auth URL
export async function PUT(request: Request) {
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

        const applicationName = encodeURIComponent(process.env.NEXT_PUBLIC_SITE_NAME!)
        const clientId = process.env.DISCOURSE_FORUM_CLIENT_ID!
        const publicKey = encodeURIComponent(process.env.DISCOURSE_FORUM_PUBLIC_KEY!.replace(/\\n/g, "\n"))
        const nonce = Math.floor(Math.random() * 0xfffffffffffff)
            .toString(16)
            .padStart(16, "0")
        const authRedirect = encodeURIComponent(
            `${process.env.NEXT_PUBLIC_SITE_URL!}/settings/u/${username}?tab=accounts&type=discourse_forum&project=${projectUrlSlug}`,
        )

        return NextResponse.json({
            message: "Forum user auth URL generated successfully",
            url: `${projectSignalStrengthData.url}/user-api-key/new?application_name=${applicationName}&client_id=${clientId}&scopes=session_info&public_key=${publicKey}&nonce=${nonce}&auth_redirect=${authRedirect}`,
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

        try {
            await forumUserManagement({
                type: "api_auth",
                supabase,
                targetUserId: targetUserData.id,
                projectId: projectData.id,
                forumUsername,
                data: payload,
                signalStrengthName,
                signalStrengthId: signalStrengthData.id,
            })

            return NextResponse.json({ success: true }, { status: 200 })
        } catch (error) {
            console.error("Error managing forum user:", error)
            return NextResponse.json(
                {
                    error: error instanceof Error ? error.message : "An unexpected error occurred",
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
