import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { forumUserManagement } from "../../../../../../../../utils/forumUserManagement"

// Generate a new auth post code
export async function PUT(request: NextRequest) {
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
            const chars = "BCDGHJLMNPQRTVWYZ"
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

        // Create/update an entry with the new auth post code
        const { error: upsertError } = await supabase.from("forum_users").upsert({
            user_id: targetUserData.id,
            project_id: projectData.id,
            auth_post_code: authPostCode,
            auth_post_code_created: Math.floor(Date.now() / 1000),
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

// Check if the auth post code is found on the forum thread then create/update the forum user
export async function POST(request: NextRequest) {
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
            .select("auth_post_code, auth_post_code_created, auth_post_id")
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
            .select("url, auth_parent_post_url")
            .eq("project_id", projectData.id)
            .eq("signal_strength_id", signalStrengthData.id)
            .single()

        if (projectSignalStrengthDataError) {
            return NextResponse.json({ error: "Project signal strength not found" }, { status: 404 })
        }

        if (forumUserData.auth_post_id) {
            // If an auth_post_id already exists, then this is an update check
            // We need to check if the post is still there
            const authPostResponse = await fetch(
                `${projectSignalStrengthData.url}/posts/${forumUserData.auth_post_id}.json`,
            )
            const authPostData = await authPostResponse.json()
            if (authPostData) {
                // Check it still has the auth post code in it
                if (authPostData.cooked.includes(forumUserData.auth_post_code)) {
                    // Update the username in the forum user
                    await forumUserManagement({
                        type: "manual_post",
                        supabase,
                        targetUserId: targetUserData.id,
                        projectId: projectData.id,
                        forumUsername: authPostData.username,
                        data: forumUserData.auth_post_id,
                        signalStrengthName,
                        signalStrengthId: signalStrengthData.id,
                    })

                    return NextResponse.json({ authPostCodeFound: true })
                } else {
                    return NextResponse.json({ authPostCodeFound: false })
                }
            } else {
                return NextResponse.json({ authPostCodeFound: false })
            }
        } else {
            // Else, this is a new post check

            // Make a call to the auth_parent_post_url to get all the
            // posts on that thread to see if the auth post code is in the posts
            const authParentPostResponse = await fetch(`${projectSignalStrengthData.auth_parent_post_url}.json`)
            const authParentPostData = await authParentPostResponse.json()
            const authParentPostPosts = authParentPostData.post_stream.posts

            interface ForumPost {
                created_at: string
                username: string
                id: number
                cooked: string
            }

            const createdAfter = forumUserData.auth_post_code_created // in seconds

            // Filter posts that contain the code and are created after the code was issued
            const matchingAuthPosts = authParentPostPosts.filter((post: ForumPost) => {
                const postCreated = Math.floor(new Date(post.created_at).getTime() / 1000) // to seconds
                return post.cooked.includes(forumUserData.auth_post_code) && postCreated >= createdAfter
            })

            // Pick the earliest one
            const matchingAuthPost = matchingAuthPosts.reduce((earliest: ForumPost | null, post: ForumPost) => {
                if (!earliest) return post
                const current = new Date(post.created_at).getTime()
                const earliestTime = new Date(earliest.created_at).getTime()
                return current < earliestTime ? post : earliest
            }, null)

            if (matchingAuthPost) {
                try {
                    const forumUsername = matchingAuthPost.username
                    const authPostId = matchingAuthPost.id

                    await forumUserManagement({
                        type: "manual_post",
                        supabase,
                        targetUserId: targetUserData.id,
                        projectId: projectData.id,
                        forumUsername,
                        data: authPostId,
                        signalStrengthName,
                        signalStrengthId: signalStrengthData.id,
                    })

                    return NextResponse.json({ authPostCodeFound: true })
                } catch (error) {
                    console.error("Error managing forum user:", error)
                    return NextResponse.json(
                        {
                            error: error instanceof Error ? error.message : "An unexpected error occurred",
                        },
                        { status: 500 },
                    )
                }
            } else {
                return NextResponse.json({ authPostCodeFound: false })
            }
        }
    } catch (error) {
        console.error("Error generating auth post code:", error)
        return NextResponse.json({ error: "Error generating auth post code" }, { status: 500 })
    }
}
