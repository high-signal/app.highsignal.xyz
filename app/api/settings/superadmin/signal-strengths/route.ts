import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
    try {
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        const { data: signalStrengths, error: signalStrengthsError } = await supabase.from("signal_strengths").select(
            `
                *,
                prompts (
                    *
                )
            `,
        )

        if (signalStrengthsError) {
            return NextResponse.json({ error: "Internal server error" }, { status: 500 })
        }

        const formattedSignalStrengths = signalStrengths.map((signalStrength) => {
            return {
                name: signalStrength.name,
                displayName: signalStrength.display_name,
                status: signalStrength?.status,
                model: signalStrength?.model,
                maxChars: signalStrength?.max_chars,
                prompts: signalStrength?.prompts.sort(
                    (a: { created_at: string }, b: { created_at: string }) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                ),
            }
        })

        return NextResponse.json({ success: true, signalStrengths: formattedSignalStrengths }, { status: 200 })
    } catch (error) {
        console.error("Error fetching signal strengths:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
