"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { useEarlyAccess } from "./EarlyAccessContext"

interface User {
    id: string
    username: string
    displayName: string
    profileImageUrl?: string
    isSuperAdmin?: boolean
    accessCode?: string
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
    setTriggerUserCreation: (value: boolean) => void
}

const UserContext = createContext<UserContextType>({
    loggedInUser: null,
    loggedInUserLoading: true,
    userCreated: "",
    setUserCreated: () => {},
    error: null,
    refreshUser: async () => {},
    setTriggerUserCreation: () => {},
})

export const useUser = () => useContext(UserContext)

export function UserProvider({ children }: { children: ReactNode }) {
    const { ready, authenticated, user: privyUser, getAccessToken } = usePrivy()
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null)
    const [loggedInUserLoading, setLoggedInUserLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [missingUser, setMissingUser] = useState(false)
    const [triggerUserCreation, setTriggerUserCreation] = useState(false)
    const [userCreated, setUserCreated] = useState("")

    // If user is authenticated with Privy, but not in the database, create a new user in the database
    // This is to ensure that the user is always in the database even if the DB user creation fails
    // the first time the user logs in for any reason. Otherwise, the user will be authenticated, but not
    // have a user profile in the database, and will not be able to access the app.
    useEffect(() => {
        if (authenticated && missingUser) {
            const createUser = async () => {
                // Get the early earlyAccessCode from the browser local storage
                // and store it in the database to track user signup funnel
                const earlyAccessCode = localStorage.getItem("earlyAccessCode")

                const token = await getAccessToken()
                const response = await fetch("/api/users?earlyAccessCode=" + earlyAccessCode, {
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
                    console.warn("Failed to create user")
                    setLoggedInUserLoading(false)
                }
            }
            createUser()
        }
    }, [authenticated, getAccessToken, missingUser, triggerUserCreation])

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
                console.log("No existing user found - Creating new user")
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
            value={{
                loggedInUser,
                loggedInUserLoading,
                userCreated,
                setUserCreated,
                error,
                refreshUser,
                setTriggerUserCreation,
            }}
        >
            {children}
        </UserContext.Provider>
    )
}
