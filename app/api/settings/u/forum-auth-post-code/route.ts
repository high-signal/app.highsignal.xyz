import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
    try {
        const signalStrengthName = "discourse_forum"

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        const targetUsername = request.nextUrl.searchParams.get("username")
        const projectUrlSlug = request.nextUrl.searchParams.get("project")

        if (!targetUsername || !projectUrlSlug) {
            return NextResponse.json({ error: "Username and project are required" }, { status: 400 })
        }

        const { data: targetUserData, error: targetUserDataError } = await supabase
            .from("users")
            .select("id")
            .eq("username", targetUsername)
            .single()

        if (targetUserDataError) {
            return NextResponse.json({ error: "Target user not found" }, { status: 404 })
        }

        const { data: projectData, error: projectDataError } = await supabase
            .from("projects")
            .select("id")
            .eq("url_slug", projectUrlSlug)
            .single()

        if (projectDataError) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 })
        }

        const { data: forumUserData, error: forumUserDataError } = await supabase
            .from("forum_users")
            .select("auth_post_code")
            .eq("user_id", targetUserData.id)
            .eq("project_id", projectData.id)
            .single()

        if (forumUserDataError) {
            return NextResponse.json({ error: "Forum user not found" }, { status: 404 })
        }

        const { data: signalStrengthData, error: signalStrengthDataError } = await supabase
            .from("signal_strengths")
            .select("id")
            .eq("name", signalStrengthName)
            .single()

        if (signalStrengthDataError) {
            return NextResponse.json({ error: "Signal strength not found" }, { status: 404 })
        }

        const { data: projectSignalStrengthData, error: projectSignalStrengthDataError } = await supabase
            .from("project_signal_strengths")
            .select("auth_parent_post_url")
            .eq("project_id", projectData.id)
            .eq("signal_strength_id", signalStrengthData.id)
            .single()

        if (projectSignalStrengthDataError) {
            return NextResponse.json({ error: "Project signal strength not found" }, { status: 404 })
        }

        // Make a call to the auth_parent_post_url to get all the posts on that thread to see if the auth post code is in the posts
        const authParentPostResponse = await fetch(`${projectSignalStrengthData.auth_parent_post_url}.json`)
        const authParentPostData = await authParentPostResponse.json()
        const authParentPostPosts = authParentPostData.post_stream.posts

        // Check if the auth post code is in the posts
        const matchingAuthPost = authParentPostPosts.find((post: any) =>
            post.cooked.includes(forumUserData.auth_post_code),
        )

        if (matchingAuthPost) {
            // If the auth post code is found, update the forum username and auth post id in the database
            const { error: updateError } = await supabase
                .from("forum_users")
                .update({
                    forum_username: matchingAuthPost.username,
                    auth_post_id: matchingAuthPost.id,
                })
                .eq("user_id", targetUserData.id)
                .eq("project_id", projectData.id)
                .single()

            if (updateError) {
                return NextResponse.json({ error: "Error updating forum username and auth post id" }, { status: 500 })
            }

            return NextResponse.json({ authPostCodeFound: true })
        } else {
            return NextResponse.json({ authPostCodeFound: false })
        }
    } catch (error) {
        console.error("Error generating auth post code:", error)
        return NextResponse.json({ error: "Error generating auth post code" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        const targetUsername = request.nextUrl.searchParams.get("username")
        const projectUrlSlug = request.nextUrl.searchParams.get("project")

        if (!targetUsername || !projectUrlSlug) {
            return NextResponse.json({ error: "Username and project are required" }, { status: 400 })
        }

        const { data: targetUserData, error: targetUserDataError } = await supabase
            .from("users")
            .select("id")
            .eq("username", targetUsername)
            .single()

        if (targetUserDataError) {
            return NextResponse.json({ error: "Target user not found" }, { status: 404 })
        }

        const { data: projectData, error: projectDataError } = await supabase
            .from("projects")
            .select("id")
            .eq("url_slug", projectUrlSlug)
            .single()

        if (projectDataError) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 })
        }

        const generateAuthCode = () => {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            const generatePart = () => {
                return Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
            }
            return `${generatePart()}-${generatePart()}-${generatePart()}`
        }

        const isAuthCodeUnique = async (code: string) => {
            const { data, error } = await supabase
                .from("forum_users")
                .select("auth_post_code")
                .eq("auth_post_code", code)
                .single()

            // If we get a "not found" error, that means the code is unique
            if (error?.code === "PGRST116") {
                return true
            }

            // If we got data back, the code exists
            if (data) {
                return false
            }

            // For any other error, we should consider it not unique to be safe
            return false
        }

        let authPostCode = generateAuthCode()
        let isUnique = false
        let attempts = 0
        const maxAttempts = 5

        while (!isUnique && attempts < maxAttempts) {
            isUnique = await isAuthCodeUnique(authPostCode)
            if (!isUnique) {
                authPostCode = generateAuthCode()
            }
            attempts++
        }

        if (!isUnique) {
            return NextResponse.json({ error: "Failed to generate unique auth code" }, { status: 500 })
        }

        // Create/update an entry with the new username
        const { error: upsertError } = await supabase.from("forum_users").upsert({
            user_id: targetUserData.id,
            project_id: projectData.id,
            auth_post_code: authPostCode,
        })

        if (upsertError) {
            return NextResponse.json({ error: "Error generating auth post code" }, { status: 500 })
        }

        return NextResponse.json({ authPostCode: authPostCode })
    } catch (error) {
        console.error("Error generating auth post code:", error)
        return NextResponse.json({ error: "Error generating auth post code" }, { status: 500 })
    }
}
