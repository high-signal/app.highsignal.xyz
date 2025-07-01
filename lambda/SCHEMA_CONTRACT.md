# Schema Contract: PlatformOutput

This document defines the official data contract for the `PlatformOutput` object, which is the standardized format for all data processed by the Lambda Engine. Adherence to this schema is mandatory for all platform adapters to ensure data consistency and downstream compatibility.

## 1. TypeScript Implementation

The canonical implementation of this schema is defined in the `PlatformOutput` interface within the engine's types file.

- **Location**: `engine/src/types.ts`

Any questions or clarifications regarding the schema should be resolved by consulting the TypeScript interface.

## 2. Runtime Validation

To enforce this contract at runtime, a Zod-based validator is available. All data must be successfully validated against this schema before being passed to the core engine.

- **Validator**: `engine/src/validatePlatformOutput.ts`
