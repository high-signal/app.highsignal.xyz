import { getProjectsUtil } from "../../../../utils/api-utils/getProjectsUtil"

// Returns projects with additional superadmin fields
export async function GET(request: Request) {
    return getProjectsUtil(request, false, true)
}
