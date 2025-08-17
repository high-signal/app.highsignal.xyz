import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import { triggerLambda } from "../../../../../../../utils/lambda-utils/triggerLambda"

export async function GET() {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data, error } = await supabase
        .from("ai_request_queue")
        .select("*")
        .neq("status", "completed")
        .neq("status", "error")

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const queueLength = data.length
    const smartScoreCompleted = !data.some((item) => item.type === "single_update")

    // When the only item in the queue is a single_update, trigger an AI governor to run the smart score calculations
    if (queueLength === 1 && data[0].type === "single_update") {
        triggerLambda({
            functionType: "runAiGovernor",
        })
    }

    return NextResponse.json({ queueLength, smartScoreCompleted, error })
}
