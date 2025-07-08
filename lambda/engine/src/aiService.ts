/**
 * @file This module provides a client for interacting with AI services, specifically OpenAI.
 * It abstracts the details of making API calls and, most importantly, ensures that the
 * responses are parsed and validated against a strict schema before being used elsewhere
 * in the application.
 *
 * @features
 * - **OpenAI Client**: Implements a client to communicate with the OpenAI Chat Completions API.
 * - **Structured JSON Response**: Configured to always request JSON output from the model.
 * - **Robust Validation**: Uses Zod to validate the structure and types of the AI's response,
 *   preventing malformed data from propagating through the system.
 * - **Flexible Parsing**: Handles both flat and nested JSON structures from the AI.
 * - **Factory Function**: Provides a simple factory (`getAIServiceClient`) for creating a client instance.
 */
import OpenAI from "openai"
import { z, ZodError } from "zod"
import { AppConfig } from "./config"
import { Logger } from "./logger"
import { AIServiceClient, ModelConfig, AIScoreOutput, AiConfig } from "./types"

const OPENAI_DEFAULT_MAX_TOKENS = 4096

// Zod schema for the core data we expect from the AI. This provides robust validation.
const AIScoreOutputSchema = z
    .object({
        value: z.number(),
        summary: z.string(),
        description: z.string().optional().default(""),
        improvements: z.string().optional().default(""),
        // The AI might return either snake_case or camelCase for this field.
        // We accept either and transform it to a consistent snake_case.
        explained_reasoning: z.string().min(1).optional(),
        explainedReasoning: z.string().min(1).optional(),
    })
    .transform((data) => ({
        value: data.value,
        summary: data.summary,
        description: data.description ?? "",
        improvements: data.improvements ?? "",
        explained_reasoning: data.explained_reasoning || data.explainedReasoning || "",
    }))
    // After the transform, we pipe it into a final schema to ensure explained_reasoning is a string.
    .pipe(
        z.object({
            value: z.number(),
            summary: z.string(),
            description: z.string(),
            improvements: z.string(),
            explained_reasoning: z.string(),
        }),
    )

type AIScoreData = z.infer<typeof AIScoreOutputSchema>

/**
 * An implementation of `AIServiceClient` that communicates with the OpenAI API.
 */
class OpenAIAIServiceClient implements AIServiceClient {
    private openai: OpenAI
    private logger: Logger

    constructor(apiKey: string, logger: Logger) {
        if (!apiKey) {
            logger.error("[AISERVICE] OpenAI API key is missing.")
            throw new Error("OpenAI API key is not configured.")
        }
        this.openai = new OpenAI({ apiKey })
        this.logger = logger
    }

    /**
     * Parses and validates the JSON response from the OpenAI API.
     *
     * @param content The raw JSON string from the API response.
     * @returns The validated AI score data.
     * @throws An error if parsing or validation fails.
     */
    private _parseAndValidateResponse(content: string): AIScoreData {
        let parsedJson
        try {
            parsedJson = JSON.parse(content)
        } catch (error) {
            this.logger.error("[AISERVICE] Failed to parse OpenAI JSON response.", {
                error: (error as Error).message,
                rawContent: content,
            })
            throw new Error(`Failed to parse OpenAI JSON response: ${(error as Error).message}`)
        }

        // Attempt to validate the flat structure first.
        const flatValidation = AIScoreOutputSchema.safeParse(parsedJson)
        if (flatValidation.success) {
            return flatValidation.data
        }

        // If flat validation fails, check for a nested structure.
        // This is common for smart scores where the AI wraps the output in a dynamic key.
        const keys = Object.keys(parsedJson)
        if (keys.length === 1 && typeof parsedJson[keys[0]] === "object" && parsedJson[keys[0]] !== null) {
            this.logger.info(`Found a nested object under key '${keys[0]}', attempting to validate it.`)
            const nestedObject = parsedJson[keys[0]]

            // FIX: Smart scores are qualitative and may not include a 'value'. Default to 0.
            if (nestedObject.value === undefined) {
                this.logger.info(`'value' field missing in nested object, defaulting to 0.`)
                nestedObject.value = 0
            }

            const nestedValidation = AIScoreOutputSchema.safeParse(nestedObject)
            if (nestedValidation.success) {
                const transformed = {
                    ...nestedObject,
                    value: nestedObject.explainedReasoning?.value ?? nestedObject.value,
                    summary: nestedObject.explainedReasoning?.summary ?? nestedObject.summary,
                }
                return AIScoreOutputSchema.parse(transformed)
            }
        }

        // If both attempts fail, log the initial error and throw.
        this.logger.error("[AISERVICE] OpenAI response failed Zod validation.", {
            error: flatValidation.error.issues, // Log issues from the more likely flat structure attempt
            receivedData: content,
        })
        throw new Error("OpenAI response validation failed.")
    }

    async getStructuredResponse(prompt: string, modelConfig: ModelConfig): Promise<AIScoreOutput> {
        this.logger.info("[AISERVICE] Sending request to OpenAI.", {
            model: modelConfig.model,
            promptExcerpt: prompt.substring(0, 100) + "...",
        })

        try {
            const completion = await this.openai.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: `${prompt}\n\nRespond with a JSON object containing two keys: 'value' (a number between 0 and 100) and 'summary' (a string for reasoning).`,
                    },
                ],
                model: modelConfig.model,
                temperature: modelConfig.temperature,
                max_tokens: modelConfig.maxTokens || OPENAI_DEFAULT_MAX_TOKENS,
                response_format: { type: "json_object" },
            })

            this.logger.info("[AISERVICE] Received response from OpenAI.", {
                requestId: completion.id,
                modelUsed: completion.model,
            })

            const content = completion.choices[0]?.message?.content
            if (!content) {
                this.logger.error("[AISERVICE] OpenAI response content is empty.")
                throw new Error("OpenAI response content is empty.")
            }

            const validatedData = this._parseAndValidateResponse(content)

            return {
                ...validatedData,
                requestId: completion.id,
                modelUsed: completion.model,
                promptTokens: completion.usage?.prompt_tokens,
                completionTokens: completion.usage?.completion_tokens,
            }
        } catch (error: any) {
            this.logger.error("[AISERVICE] Error calling OpenAI API.", {
                errorMessage: error.message,
                model: modelConfig.model,
            })
            throw error
        }
    }
}

/**
 * Factory function to get an AI service client.
 * Currently, it only supports and returns an OpenAI client.
 *
 * @param appConfig The application configuration containing the OpenAI API key.
 * @param _aiDbConfig The AI configuration from the database. Currently unused but preserved for future use (e.g., selecting a provider).
 * @param logger A logger instance.
 * @returns An instance of AIServiceClient.
 * @throws An error if the OpenAI API key is missing.
 */
export const getAIServiceClient = (
    appConfig: AppConfig,
    _aiDbConfig: AiConfig, // Param is kept for future-proofing.
    logger: Logger,
): AIServiceClient => {
    // In the future, this factory could select a client based on a provider
    // field in `aiDbConfig`, e.g., 'openai', 'anthropic', 'google'.

    if (!appConfig.OPENAI_API_KEY) {
        logger.error("[AISERVICE] OpenAI API key is not configured in appConfig.")
        throw new Error("OpenAI API key is not configured in application config.")
    }

    return new OpenAIAIServiceClient(appConfig.OPENAI_API_KEY, logger)
}
