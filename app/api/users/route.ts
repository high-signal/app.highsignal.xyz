import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { getUsersUtil } from "../../../utils/api-utils/getUsersUtil"

// Unauthenticated GET request
// Returns user data for a given project
export async function GET(request: Request) {
    return getUsersUtil(request)
}

// Authenticated POST request (uses logged in user privyId)
// Creates a new user in the database
// Takes no arguments as it creates a default user in the database
// Note: This is a special API where it only requires a logged in user, so remains on this API route
export async function POST(request: Request) {
    try {
        // Get the privyId of the logged in user from the headers (set by middleware)
        const privyId = request.headers.get("x-privy-id")!

        // Get the earlyAccessCode from the query params
        const { searchParams } = new URL(request.url)
        const earlyAccessCode = searchParams.get("earlyAccessCode")

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // Check if privy_id already exists
        const { data: existingPrivyUser, error: privyCheckError } = await supabase
            .from("users")
            .select("id")
            .eq("privy_id", privyId)
            .single()

        if (privyCheckError && privyCheckError.code !== "PGRST116") {
            console.error("Error checking privy_id:", privyCheckError)
            return NextResponse.json({ error: "Error checking privy_id" }, { status: 500 })
        }

        if (existingPrivyUser) {
            return NextResponse.json({ error: "User already exists with this Privy ID" }, { status: 409 })
        }

        // Function to generate a random 6-digit number (excluding 0)
        function generateRandomNumber(): number {
            // Generate a random number between 100000 and 999999
            return Math.floor(Math.random() * 900000) + 100000
        }

        // Function to check if a username exists in the database
        async function usernameExists(supabase: any, username: string): Promise<boolean> {
            const { data, error } = await supabase.from("users").select("id").eq("username", username).single()

            // If error is PGRST116 (no rows returned), the username doesn't exist
            if (error && error.code === "PGRST116") {
                return false
            }

            // If there's another error or data exists, the username exists
            return true
        }

        // Function to generate a unique username with retries
        async function generateUniqueUsername(supabase: any, maxAttempts = 3): Promise<string | null> {
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const username = `user_${generateRandomNumber()}`
                const exists = await usernameExists(supabase, username)

                if (!exists) {
                    return username
                }
            }

            return null // All attempts failed
        }

        // Generate a unique username
        const username = await generateUniqueUsername(supabase)

        if (!username) {
            return NextResponse.json(
                { error: "Failed to generate a unique username after multiple attempts" },
                { status: 500 },
            )
        }

        // Create display name from username (e.g., "User 849124")
        const displayName = `User ${username.split("_")[1]}`

        // Create new user
        const { data: newUser, error: insertError } = await supabase
            .from("users")
            .insert([
                {
                    privy_id: privyId,
                    username: username,
                    display_name: displayName,
                    ...(earlyAccessCode && { signup_code: earlyAccessCode }),
                },
            ])
            .select()
            .single()

        if (insertError) {
            console.error("Error creating user:", insertError)
            return NextResponse.json({ error: "Error creating user" }, { status: 500 })
        }

        return NextResponse.json(newUser, { status: 201 })
    } catch (error) {
        console.error("Unhandled error in user creation:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
