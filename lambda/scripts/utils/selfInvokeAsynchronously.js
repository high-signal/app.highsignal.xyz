const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda")
const { NodeHttpHandler } = require("@smithy/node-http-handler")

// Reuse a single LambdaClient instance instead of creating a new one for each call
// Configure with larger connection pool to handle many concurrent requests
let lambdaClient = null

const getLambdaClient = () => {
    if (!lambdaClient) {
        const requestHandler = new NodeHttpHandler({
            connectionTimeout: 1000,
            requestTimeout: 1000,
            // Increase maxSockets to allow more concurrent connections
            maxSockets: 200, // Default is 50, increase to handle more concurrent requests
        })

        lambdaClient = new LambdaClient({
            region: process.env.AWS_REGION,
            requestHandler,
        })
    }
    return lambdaClient
}

const selfInvokeAsynchronously = async (input) => {
    const lambda = getLambdaClient()

    let payloadObj

    if (typeof input === "string") {
        try {
            payloadObj = JSON.parse(input)
        } catch (e) {
            console.error("❌ Could not parse input string as JSON", e)
            throw new Error("Malformed input passed to selfInvokeAsynchronously")
        }
    } else if (typeof input === "object" && input !== null) {
        payloadObj = input
    } else {
        throw new Error("Input must be a stringified JSON or a plain object")
    }

    const payload = {
        ...payloadObj,
        source: "aws.lambda",
    }

    const response = await lambda.send(
        new InvokeCommand({
            FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
            InvocationType: "Event", // async fire-and-forget
            Payload: JSON.stringify(payload),
        }),
    )

    return response
}

module.exports = {
    selfInvokeAsynchronously,
}
