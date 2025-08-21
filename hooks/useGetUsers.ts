import { getAccessToken } from "@privy-io/react-auth"
import { useState, useEffect, useCallback } from "react"

interface UseGetUsersOptions {
    project?: string
    username?: string
    fuzzy?: boolean
    shouldFetch?: boolean
    isSuperAdminRequesting?: boolean
    isRawData?: boolean
    page?: number
    isUserDataVisible?: boolean
    leaderboardOnly?: boolean
    pageSize?: number
}

export const useGetUsers = ({
    project,
    username,
    fuzzy = false,
    shouldFetch = true,
    isSuperAdminRequesting = false,
    isRawData = false,
    page = 1,
    isUserDataVisible = false,
    leaderboardOnly = false,
    pageSize,
}: UseGetUsersOptions = {}) => {
    const [users, setUsers] = useState<UserData[] | null>(null)
    const [maxPage, setMaxPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(
        async (backgroundRefresh: boolean = false) => {
            try {
                if (!backgroundRefresh) {
                    setLoading(true)
                }

                const url = new URL(
                    isSuperAdminRequesting
                        ? "/api/superadmin/users"
                        : isUserDataVisible
                          ? "/api/private-data/users"
                          : "/api/users",
                    window.location.origin,
                )

                url.searchParams.append("page", page.toString())

                if (project) {
                    url.searchParams.append("project", project)
                }

                if (leaderboardOnly) {
                    url.searchParams.append("leaderboardOnly", "true")
                }

                if (pageSize) {
                    url.searchParams.append("pageSize", pageSize.toString())
                }

                if (username) {
                    url.searchParams.append("username", username)
                    if (fuzzy) {
                        url.searchParams.append("fuzzy", "true")
                    }
                }

                if (isRawData) {
                    url.searchParams.append("showRawScoreCalcOnly", "true")
                }

                const token = isSuperAdminRequesting || isUserDataVisible ? await getAccessToken() : null
                const response = await fetch(url.toString(), {
                    method: "GET",
                    headers: {
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                })

                if (!response.ok) {
                    throw new Error("Failed to fetch data")
                }
                const dataJson = await response.json()
                const data = dataJson.data

                // Add a timestamp to every data object
                // To track when the user data was last updated
                data.forEach((user: UserData) => {
                    user.timestamp = Math.floor(Date.now())
                })

                setUsers(data)
                setMaxPage(dataJson.maxPage)
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred")
            } finally {
                setLoading(false)
            }
        },
        [project, username, fuzzy, page, isUserDataVisible, isSuperAdminRequesting, isRawData, leaderboardOnly],
    )

    useEffect(() => {
        if (shouldFetch) {
            fetchData()
        } else {
            setUsers(null)
            setLoading(false)
            setError(null)
        }
    }, [shouldFetch, fetchData])

    const refreshUserData = useCallback(() => {
        fetchData(true)
    }, [fetchData])

    return { users, maxPage, loading, error, refreshUserData }
}
