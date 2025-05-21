import { getAccessToken } from "@privy-io/react-auth"
import { useState, useEffect, useCallback } from "react"

export const useGetUsers = (
    project: string,
    username?: string,
    fuzzy: boolean = false,
    shouldFetch: boolean = true,
    isSuperAdminRequesting: boolean = false,
    isRawData: boolean = false,
) => {
    const [users, setUsers] = useState<UserData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(
        async (backgroundRefresh: boolean = false) => {
            try {
                if (!backgroundRefresh) {
                    setLoading(true)
                }

                const url = new URL(
                    isSuperAdminRequesting ? "/api/superadmin/users" : "/api/users",
                    window.location.origin,
                )
                url.searchParams.append("project", project)
                if (username) {
                    url.searchParams.append("user", username)
                    if (fuzzy) {
                        url.searchParams.append("fuzzy", "true")
                    }
                }

                if (isRawData) {
                    url.searchParams.append("showRawScoreCalcOnly", "true")
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
                setUsers(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred")
            } finally {
                setLoading(false)
            }
        },
        [project, username, fuzzy],
    )

    useEffect(() => {
        if (shouldFetch) {
            fetchData()
        } else {
            setUsers([])
            setLoading(false)
            setError(null)
        }
    }, [fetchData, shouldFetch])

    const refreshUserData = useCallback(() => {
        fetchData(true)
    }, [fetchData])

    return { users, loading, error, refreshUserData }
}
