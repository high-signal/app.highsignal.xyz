import { useState, useEffect } from "react"

export const useGetProjects = (project: string) => {
    const [projects, setProjects] = useState<ProjectData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = async (backgroundRefresh: boolean = false) => {
        try {
            if (!backgroundRefresh) {
                setLoading(true)
            }

            const url = new URL("/api/projects", window.location.origin)
            if (project) {
                url.searchParams.append("project", project)
            }

            const response = await fetch(url.toString())
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
