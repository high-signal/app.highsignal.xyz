import { updatePrivyAccounts } from "../../../../../../utils/updatePrivyAccounts"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest) {
    const privyId = request.headers.get("x-privy-id")!
    const targetUsername = request.nextUrl.searchParams.get("username")!

    await updatePrivyAccounts(privyId, targetUsername)

    return NextResponse.json({ message: "Privy accounts updated" })
}
