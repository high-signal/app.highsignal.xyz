import { useState, useEffect } from "react"

export const useGetUsers = (project: string, username?: string) => {
    const [users, setUsers] = useState<UserData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const url = new URL("/api/users", window.location.origin)
                url.searchParams.append("project", project)
                if (username) {
                    url.searchParams.append("user", username)
                }

                const response = await fetch(url.toString())
                if (!response.ok) {
                    throw new Error("Failed to fetch data")
                }
                const data = await response.json()
                setUsers(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [project, username])

    return { users, loading, error }
}
