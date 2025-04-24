import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { getRoutePermissions } from "./security/routePermissions"

import { verifyAuthentication } from "./security/verifyAuth"

export async function middleware(request: NextRequest) {
    // Skip middleware for non-API routes
    if (!request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.next()
    }

    // Get the method-specific permissions for this path
    const methodPermission = getRoutePermissions(request.nextUrl.pathname, request.method)

    // If no permissions are defined for this route/method, block it by default
    if (!methodPermission) {
        console.warn(
            `No permissions defined for route: ${request.nextUrl.pathname} with method: ${request.method}. Blocking access.`,
        )
        return NextResponse.json({ error: "This route is not configured for access" }, { status: 403 })
    }

    try {
        // If the method requires authentication
        if (methodPermission.requiresAuth) {
            const authResult = await verifyAuthentication(request.headers.get("Authorization"))
            if (!authResult.success) {
                return authResult.error
            }

            // Add the privyId to the request headers for use in the route handler
            const requestHeaders = new Headers(request.headers)
            requestHeaders.set("x-privy-id", authResult.privyId!)

            // If the method requires project admin permissions
            if (methodPermission.requiresProjectAdmin) {
                // TODO: Implement project admin check
                // This would need to be implemented based on your specific requirements
                // For example, checking if the user is an admin of the project in the URL
            }

            return NextResponse.next({
                request: {
                    headers: requestHeaders,
                },
            })
        }

        // If the method does not require auth, allow it
        return NextResponse.next()
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid token" }, { status: 401 })
    }
}

// Configure which routes the middleware should run on
export const config = {
    // matcher: ["/api/:path*"],
    matcher: ["/api/me"],
}
