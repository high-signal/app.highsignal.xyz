import { getUsers } from "../../../../utils/api-utils/usersGetUtil"

// Returns user data for a given project with additional superadmin fields
export async function GET(request: Request) {
    return getUsers(request, true)
}
