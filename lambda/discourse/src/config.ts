import { z } from "zod"
import { AdapterConfig, AdapterRuntimeConfig } from "@shared/types"

/**
 * Zod schema for the Discourse adapter's static configuration.
 * This validates environment variables and secrets specific to Discourse.
 */
/**
 * Zod schema for the Discourse adapter's static secrets, aligning with the legacy environment variables.
 */
export const DiscourseAdapterSecretsSchema = z.object({
    DISCOURSE_FORUM_CLIENT_ID: z.string().min(1),
    DISCOURSE_FORUM_PRIVATE_KEY: z.string().min(1),
});
export type DiscourseAdapterSecrets = z.infer<typeof DiscourseAdapterSecretsSchema>;

/**
 * Zod schema for the Discourse adapter's dynamic run-time parameters, combined
 * with the static secrets.
 */
/**
 * Type definition for the Discourse adapter's configuration, which combines
 * static secrets with dynamic, per-run parameters.
 * This extends the base AdapterConfig from shared types.
 */
/**
 * Zod schema for the Discourse adapter's combined configuration, including secrets and dynamic parameters.
 */
export const DiscourseAdapterConfigSchema = DiscourseAdapterSecretsSchema.extend({
    PROJECT_ID: z.string().uuid(),
    SIGNAL_STRENGTH_ID: z.string().uuid(),
    url: z.string().url(),
});

/**
 * Type definition for the Discourse adapter's configuration, inferred from the Zod schema.
 */
export type DiscourseAdapterConfig = z.infer<typeof DiscourseAdapterConfigSchema>;

/**
 * Type definition for the Discourse adapter's full runtime configuration.
 * This includes the static and dynamic config, plus the AI configuration.
 */
export type DiscourseAdapterRuntimeConfig = AdapterRuntimeConfig<DiscourseAdapterConfig>;
