import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { validateAddressName } from "../../../../../../utils/inputValidation"
import { sanitize } from "../../../../../../utils/sanitize"

// Authenticated POST request
// Updates a user addresses in the database
// Takes a JSON body with updated parameters
export async function POST(request: NextRequest) {
    try {
        // Get the target username from the URL search params
        const targetUsername = request.nextUrl.searchParams.get("username")
        const targetAddress = request.nextUrl.searchParams.get("address")
        if (!targetUsername || !targetAddress) {
            return NextResponse.json({ error: "Username and address are required" }, { status: 400 })
        }

        // Parse the request body
        const body = await request.json()
        const { changedFields } = body

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // Get the target user
        const { data: targetUser, error: userError } = await supabase
            .from("users")
            .select("id")
            .eq("username", targetUsername)
            .single()

        if (userError) {
            console.error("Error fetching user:", userError)
            return NextResponse.json({ error: "Error fetching user" }, { status: 500 })
        }

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Validate the new address name if provided
        if (changedFields.name !== undefined) {
            const addressNameError = validateAddressName(changedFields.name)
            if (addressNameError) {
                return NextResponse.json({ error: addressNameError }, { status: 400 })
            }
        }

        // Validate the sharing setting if provided
        if (changedFields.sharing) {
            const validSharingValues = ["private", "public", "shared"]
            if (!validSharingValues.includes(changedFields.sharing)) {
                return NextResponse.json(
                    { error: "Sharing value must be 'private', 'public', or 'shared'" },
                    { status: 400 },
                )
            }

            if (changedFields.sharing === "shared" && changedFields.userAddressesShared?.length === 0) {
                return NextResponse.json(
                    { error: "To use the 'Shared' option you must select at least one project" },
                    { status: 400 },
                )
            }
        }

        // ************************************************
        // SANITIZE USER INPUTS BEFORE STORING IN DATABASE
        // ************************************************
        const sanitizedFields: Record<string, any> = {}
        if (changedFields.name !== undefined) sanitizedFields.name = sanitize(changedFields.name)
        if (changedFields.userAddressesShared)
            sanitizedFields.userAddressesShared = sanitize(changedFields.userAddressesShared)

        // Update data in the user address table
        const { error: updateUserAddressError } = await supabase
            .from("user_addresses")
            .update({
                is_public: changedFields.sharing === "public",
                ...(sanitizedFields.name !== undefined && { address_name: sanitizedFields.name }),
            })
            .eq("user_id", targetUser.id)
            .eq("address", targetAddress)
            .select()
            .single()

        if (updateUserAddressError) {
            console.error("Error updating user:", updateUserAddressError)
            return NextResponse.json({ error: "Error updating user" }, { status: 500 })
        }

        // Get all the projectIds using the userAddressesShared array
        const sharedProjectIds = await supabase
            .from("projects")
            .select("id")
            .in("url_slug", sanitizedFields?.userAddressesShared?.split(",") || [])

        if (sharedProjectIds.error) {
            console.error("Error fetching shared projects:", sharedProjectIds.error)
            return NextResponse.json({ error: "Error fetching shared projects" }, { status: 500 })
        }

        // Get the address_id for the target address confirming ownership by target user
        const { data: addressData, error: addressError } = await supabase
            .from("user_addresses")
            .select("id")
            .eq("user_id", targetUser.id)
            .eq("address", targetAddress)
            .single()

        if (addressError) {
            console.error("Error fetching address:", addressError)
            return NextResponse.json({ error: "Error fetching address" }, { status: 500 })
        }

        // In the user_addresses_shared table, delete any existing entries
        // that no longer exist in the userAddressesShared array
        const { error: deleteUserAddressesSharedError } = await supabase
            .from("user_addresses_shared")
            .delete()
            .eq("address_id", addressData.id)
            .not("project_id", "in", `(${sharedProjectIds.data?.map((project) => project.id)?.join(",")})`)

        if (deleteUserAddressesSharedError) {
            console.error("Error deleting user addresses shared:", deleteUserAddressesSharedError)
            return NextResponse.json({ error: "Error deleting user addresses shared" }, { status: 500 })
        }

        // Add any new projectIds to the user_addresses_shared table
        const { error: addUserAddressesSharedError } = await supabase.from("user_addresses_shared").upsert(
            sharedProjectIds.data.map((project) => ({
                address_id: addressData.id,
                project_id: project.id,
            })),
            { onConflict: "address_id,project_id", ignoreDuplicates: true },
        )

        if (addUserAddressesSharedError) {
            console.error("Error adding user addresses shared:", addUserAddressesSharedError)
            return NextResponse.json({ error: "Error adding user addresses shared" }, { status: 500 })
        }

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error("Unhandled error in user update:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
