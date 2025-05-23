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
            // TODO: This is hardcoded to the "raw" prompt type for now
            // it should return all latest prompts for the signal strength and then have filtering on the UI
            const filteredPrompts = signalStrength.prompts
                .filter((prompt: { type: string }) => prompt.type === "raw")
                .sort(
                    (a: { created_at: string }, b: { created_at: string }) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                )

            const latestPrompt = filteredPrompts.length > 0 ? filteredPrompts[0] : null

            return {
                name: signalStrength.name,
                displayName: signalStrength.display_name,
                status: signalStrength?.status,
                model: signalStrength?.model,
                temperature: signalStrength?.temperature,
                promptId: latestPrompt?.id,
                prompt: latestPrompt?.prompt,
                maxChars: signalStrength?.max_chars,
            }
        })

        return NextResponse.json({ success: true, signalStrengths: formattedSignalStrengths }, { status: 200 })
    } catch (error) {
        console.error("Error fetching signal strengths:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
