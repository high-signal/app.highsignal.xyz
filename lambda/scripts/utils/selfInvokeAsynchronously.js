const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda")

const selfInvokeAsynchronously = async (input) => {
    const lambda = new LambdaClient({ region: process.env.AWS_REGION })

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
