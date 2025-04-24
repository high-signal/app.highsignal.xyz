"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { usePrivy } from "@privy-io/react-auth"

interface User {
    id: string
    username: string
    displayName: string
    profileImageUrl?: string
    isSuperAdmin?: boolean
    projectAdmins?: {
        projectId: string
        projectName: string
        urlSlug: string
        projectLogoUrl: string
    }[]
}

interface UserContextType {
    loggedInUser: User | null
    loggedInUserLoading: boolean
    userCreated: string
    setUserCreated: (username: string) => void
    error: string | null
    refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType>({
    loggedInUser: null,
    loggedInUserLoading: true,
    userCreated: "",
    setUserCreated: () => {},
    error: null,
    refreshUser: async () => {},
})

export const useUser = () => useContext(UserContext)

export function UserProvider({ children }: { children: ReactNode }) {
    const { ready, authenticated, user: privyUser, getAccessToken } = usePrivy()
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null)
    const [loggedInUserLoading, setLoggedInUserLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [missingUser, setMissingUser] = useState(false)
    const [userCreated, setUserCreated] = useState("")

    // If user is authenticated with Privy, but not in the database, create a new user in the database
    // This is to ensure that the user is always in the database even if the DB user creation fails
    // the first time the user logs in for any reason. Otherwise, the user will be authenticated, but not
    // have a user profile in the database, and will not be able to access the app.
    useEffect(() => {
        if (authenticated && missingUser) {
            const createUser = async () => {
                const token = await getAccessToken()

                console.log("Creating user in database...")

                const response = await fetch("/api/users", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                })
                if (response.ok) {
                    console.log("User created successfully")
                    setMissingUser(false)
                    fetchUser()

                    const newUser = await response.json()
                    setUserCreated(newUser.username)
                } else {
                    console.error("Failed to create user")
                    // TODO: Show an error message to the user asking them to try again later
                }
            }

            createUser()
        }
    }, [authenticated, getAccessToken, missingUser])

    const fetchUser = async (backgroundRefresh: boolean = false) => {
        if (ready && !authenticated) {
            setLoggedInUserLoading(false)
            setLoggedInUser(null)
            return
        }

        try {
            if (!backgroundRefresh) {
                setLoggedInUserLoading(true)
            }

            const accessToken = await getAccessToken()

            const response = await fetch(`/api/me`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                console.log("User not found in database - Creating user")
                setMissingUser(true)
                return
            }

            if (response.status === 200) {
                const userData = await response.json()
                setLoggedInUser(userData)
                setError(null)
                setLoggedInUserLoading(false)
            }
        } catch (err) {
            console.error("Error fetching user:", err)
            setError(err instanceof Error ? err.message : "Unknown error")
            setLoggedInUserLoading(false)
        }
    }

    useEffect(() => {
        if (ready) {
            fetchUser()
        }
    }, [ready, authenticated, privyUser?.id])

    const refreshUser = async () => {
        await fetchUser(true)
    }

    return (
        <UserContext.Provider
            value={{ loggedInUser, loggedInUserLoading, userCreated, setUserCreated, error, refreshUser }}
        >
            {children}
        </UserContext.Provider>
    )
}
