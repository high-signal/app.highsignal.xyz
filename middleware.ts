import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { getRoutePermissions, Role } from "./security/routePermissions"
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
        if (!methodPermission.requiresAuth) {
            // If the method does not require auth, allow it
            return NextResponse.next()
        } else {
            // If the method requires authentication
            const authResult = await verifyAuthentication(request.headers.get("Authorization"))
            if (!authResult.success) {
                return authResult.error
            }

            // Add the privyId to the request headers for use in the route handler
            const requestHeaders = new Headers(request.headers)
            requestHeaders.set("x-privy-id", authResult.privyId!)

            // *********************
            // LOGGED IN USER CHECK
            // *********************
            // If route allows currentUser, return immediately after confirming auth
            // This is for routes that just need the user to be logged in e.g. /api/me and user creation
            if (methodPermission.allowedAccess?.includes("loggedInUser")) {
                return NextResponse.next({
                    request: {
                        headers: requestHeaders,
                    },
                })
            }

            // ************************
            // GET LOGGED IN USER DATA
            // ************************
            // Get logged in user data to determine their roles
            const authHeader = request.headers.get("Authorization")!
            const response = await fetch(new URL("/api/me", request.url).toString(), {
                headers: {
                    Authorization: authHeader,
                    "Content-Type": "application/json",
                },
            })
            if (!response.ok) {
                throw new Error("Failed to fetch user data from /api/me endpoint")
            }

            const loggedInUserData = await response.json()

            // ******************
            // TARGET USER CHECK
            // ******************
            // If targetUser is allowed access check if logged in user is the target user
            if (methodPermission.allowedAccess?.includes("targetUser")) {
                const targetUsername = request.headers.get("x-target-username")?.toLowerCase()
                if (loggedInUserData.username === targetUsername) {
                    return NextResponse.next({
                        request: {
                            headers: requestHeaders,
                        },
                    })
                }
            }

            // ******************
            // SUPER ADMIN CHECK
            // ******************
            // If targetUser is allowed access check if logged in user is a superAdmin
            if (methodPermission.allowedAccess?.includes("superAdmin")) {
                if (loggedInUserData.isSuperAdmin) {
                    return NextResponse.next({
                        request: {
                            headers: requestHeaders,
                        },
                    })
                }
            }

            // If nothing has passed, return a 403
            return NextResponse.json({ error: "You do not have permission to access this resource." }, { status: 403 })
        }
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid token" }, { status: 401 })
    }
}

// Configure which routes the middleware should run on
export const config = {
    matcher: ["/api/:path*"],
}
