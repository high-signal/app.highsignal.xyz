import { getProjects } from "../../../utils/api-utils/projectsGetUtil"

// Unauthenticated GET request
// Returns users for the given project
export async function GET(request: Request) {
    return getProjects(request)
}
