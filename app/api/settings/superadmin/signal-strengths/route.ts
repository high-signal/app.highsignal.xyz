import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        const { data: signalStrengths, error: signalStrengthsError } = await supabase
            .from("signal_strengths")
            .select("*")

        if (signalStrengthsError) {
            return NextResponse.json({ error: "Internal server error" }, { status: 500 })
        }

        const formattedSignalStrengths = signalStrengths.map((signalStrength) => ({
            name: signalStrength.name,
            displayName: signalStrength.display_name,
            status: signalStrength.status,
            prompt: signalStrength.prompt,
        }))

        return NextResponse.json({ success: true, signalStrengths: formattedSignalStrengths }, { status: 200 })
    } catch (error) {
        console.error("Error fetching signal strengths:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
