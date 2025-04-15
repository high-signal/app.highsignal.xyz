"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { usePrivy } from "@privy-io/react-auth"

interface User {
    id: string
    username: string
    display_name: string
    profile_image_url?: string
}

interface UserContextType {
    user: User | null
    isLoading: boolean
    error: string | null
    refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType>({
    user: null,
    isLoading: true,
    error: null,
    refreshUser: async () => {},
})

export const useUser = () => useContext(UserContext)

export function UserProvider({ children }: { children: ReactNode }) {
    const { ready, authenticated, user: privyUser, getAccessToken } = usePrivy()
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchUser = async () => {
        if (!authenticated || !privyUser) {
            setUser(null)
            setIsLoading(false)
            return
        }

        try {
            setIsLoading(true)

            const accessToken = await getAccessToken()

            const response = await fetch(`/api/me`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                throw new Error("Failed to fetch user")
            }

            const userData = await response.json()
            setUser(userData)
            setError(null)
        } catch (err) {
            console.error("Error fetching user:", err)
            setError(err instanceof Error ? err.message : "Unknown error")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (ready) {
            fetchUser()
        }
    }, [ready, authenticated, privyUser?.id])

    const refreshUser = async () => {
        await fetchUser()
    }

    return <UserContext.Provider value={{ user, isLoading, error, refreshUser }}>{children}</UserContext.Provider>
}
