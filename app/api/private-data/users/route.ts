import { getUsersUtil } from "../../../../utils/api-utils/getUsersUtil"

// Protected GET request for logged in users
// Returns user data for a given project
export async function GET(request: Request) {
    return getUsersUtil(request, false, true)
}
