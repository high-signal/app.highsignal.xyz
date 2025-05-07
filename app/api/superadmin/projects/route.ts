import { getProjects } from "../../../../utils/api-utils/projectsGetUtil"

// Returns projects with additional superadmin fields
export async function GET(request: Request) {
    return getProjects(request, true)
}
