import { getProjectsUtil } from "../../../utils/api-utils/getProjectsUtil"

// Unauthenticated GET request
// Returns users for the given project
export async function GET(request: Request) {
    return getProjectsUtil(request)
}
