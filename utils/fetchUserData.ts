import { createClient } from "@supabase/supabase-js"

type ProjectData = {
    display_name: string
    url_slug: string
    project_logo_url: string
}

type FormattedUserData = {
    id: string
    username: string
    displayName: string
    profileImageUrl: string
    isSuperAdmin: boolean
    accessCode: string
    projectAdmins: Array<{
        projectId: string
        projectName: string
        urlSlug: string
        projectLogoUrl: string
    }>
}

export async function fetchUserData(
    privyId: string,
): Promise<{ data: FormattedUserData | null; error: string | null }> {
    try {
        // Query Supabase for the user data
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        const { data: userData, error } = await supabase
            .from("users")
            .select(
                `
                id, 
                username, 
                display_name, 
                profile_image_url, 
                is_super_admin,
                signup_code,
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
            return { data: null, error: "Error fetching user data" }
        }

        if (!userData) {
            return { data: null, error: "User not found" }
        }

        const formattedUserData: FormattedUserData = {
            id: userData.id,
            username: userData.username,
            displayName: userData.display_name,
            profileImageUrl: userData.profile_image_url,
            isSuperAdmin: userData.is_super_admin,
            accessCode: userData.signup_code,
            projectAdmins: userData.project_admins.map((project) => {
                const projects = project.projects as unknown as ProjectData
                return {
                    projectId: project.project_id,
                    projectName: projects.display_name,
                    urlSlug: projects.url_slug,
                    projectLogoUrl: projects.project_logo_url,
                }
            }),
        }

        return { data: formattedUserData, error: null }
    } catch (error) {
        console.error("Error in fetchUserData:", error)
        return { data: null, error: "Internal server error" }
    }
}
