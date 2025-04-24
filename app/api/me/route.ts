import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
    try {
        // Get the privyId from the headers (set by middleware)
        const privyId = request.headers.get("x-privy-id")!

        // Query Supabase for the user data
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // NOTE: The permission checks are done in the middleware
        // the results here are used to display buttons in the UI only
        const { data: userData, error } = await supabase
            .from("users")
            .select(
                `
                id, 
                username, 
                display_name, 
                profile_image_url, 
                is_super_admin,
                project_admins (
                    project_id,
                    projects (
                        display_name,
                        url_slug,
                        project_logo_url
                    )
                )
            `,
            )
            .eq("privy_id", privyId)
            .single()

        if (error) {
            console.error("Error fetching user data:", error)
            return NextResponse.json({ error: "Error fetching user data" }, { status: 500 })
        }

        if (!userData) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const formattedUserData = {
            id: userData.id,
            username: userData.username,
            displayName: userData.display_name,
            profileImageUrl: userData.profile_image_url,
            isSuperAdmin: userData.is_super_admin,
            projectAdmins: userData.project_admins.map((project) => {
                type ProjectData = {
                    display_name: string
                    url_slug: string
                    project_logo_url: string
                }
                const projects = project.projects as unknown as ProjectData
                return {
                    projectId: project.project_id,
                    projectName: projects.display_name,
                    urlSlug: projects.url_slug,
                    projectLogoUrl: projects.project_logo_url,
                }
            }),
        }

        return NextResponse.json(formattedUserData)
    } catch (error) {
        console.error("Error in /me route:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
