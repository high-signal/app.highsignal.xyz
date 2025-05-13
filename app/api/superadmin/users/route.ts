import { getUsersUtil } from "../../../../utils/api-utils/getUsersUtil"

// Returns user data for a given project with additional superadmin fields
export async function GET(request: Request) {
    return getUsersUtil(request, true)
}
