// =========================
// Get priority queue items
// =========================
async function getPriorityQueueItems(supabase, availableSpace) {
    const typePriority = {
        raw_score: 1,
        single_update: 2,
        bulk_update: 3,
    }

    const priorityOrder = Object.keys(typePriority).sort((a, b) => typePriority[a] - typePriority[b])
    let remainingSpace = availableSpace
    let combinedQueueItems = []

    for (const priorityType of priorityOrder) {
        if (remainingSpace <= 0) break

        console.log(`🔍 Fetching ${priorityType} items (limit: ${remainingSpace})`)

        const { data: typeQueueItems, error: typeQueueItemsError } = await supabase
            .from("ai_request_queue")
            .select("*")
            .eq("status", "pending")
            .eq("type", priorityType)
            .order("id", { ascending: true })
            .limit(remainingSpace)

        if (typeQueueItemsError) {
            const errorMessage = `Error fetching ${priorityType} queue items: ${typeQueueItemsError.message}`
            console.error(errorMessage)
            throw errorMessage
        }

        if (typeQueueItems && typeQueueItems.length > 0) {
            combinedQueueItems = combinedQueueItems.concat(typeQueueItems)
            remainingSpace -= typeQueueItems.length
            console.log(`🔍 Found ${typeQueueItems.length} ${priorityType} items`)
        } else {
            console.log(`📭 No ${priorityType} items found`)
        }
    }

    return combinedQueueItems
}
