import { getAccessToken } from "@privy-io/react-auth"
import { useState, useEffect } from "react"

export const useGetProjects = (project?: string, isSuperAdminRequesting: boolean = false) => {
    const [projects, setProjects] = useState<ProjectData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = async (backgroundRefresh: boolean = false) => {
        try {
            if (!backgroundRefresh) {
                setLoading(true)
            }

            const url = new URL(
                isSuperAdminRequesting ? "/api/superadmin/projects" : "/api/projects",
                window.location.origin,
            )
            if (project) {
                url.searchParams.append("project", project)
            }

            const token = isSuperAdminRequesting ? await getAccessToken() : null
            const response = await fetch(url.toString(), {
                method: "GET",
                headers: {
                    ...(isSuperAdminRequesting && token ? { Authorization: `Bearer ${token}` } : {}),
                },
            })
            if (!response.ok) {
                throw new Error("Failed to fetch data")
            }
            const data = await response.json()
            setProjects(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [project])

    const refreshProjects = () => {
        fetchData(true)
    }

    return { projects, loading, error, refreshProjects }
}
