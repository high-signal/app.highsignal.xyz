export interface ValidationError {
    field: keyof SignalStrengthProjectSettingsState
    message: string
}

export function validateSignalStrengthProjectSettings(
    backend: boolean,
    settings: SignalStrengthProjectSettingsState,
): ValidationError[] {
    if (backend) {
        // TODO: Sanitize settings before processing
    }

    const errors: ValidationError[] = []

    // Validate max value
    if (settings.maxValue.new !== null) {
        const maxValue = settings.maxValue.new
        if (maxValue === "") {
            errors.push({
                field: "maxValue",
                message: "Max score is required",
            })
        } else if (typeof maxValue !== "number") {
            errors.push({
                field: "maxValue",
                message: "Max score must be a number",
            })
        } else if (maxValue < 1 || maxValue > 100) {
            errors.push({
                field: "maxValue",
                message: "Max score must be between 1 and 100",
            })
        } else if (!Number.isInteger(maxValue)) {
            errors.push({
                field: "maxValue",
                message: "Max score must be an integer",
            })
        }
    }

    // Validate previous days
    if (settings.previousDays.new !== null) {
        const previousDays = settings.previousDays.new
        if (previousDays === "") {
            errors.push({
                field: "previousDays",
                message: "Previous days is required",
            })
        } else if (
            typeof previousDays !== "number" ||
            !Number.isInteger(previousDays) ||
            ![30, 60, 90].includes(previousDays)
        ) {
            errors.push({
                field: "previousDays",
                message: "Previous days must be either 30, 60, or 90",
            })
        }
    }

    // Validate url
    if (settings.url.new !== null || settings.enabled.new === true) {
        const url = settings.url.new
        if (url === "" || (url === null && settings.enabled.new === true)) {
            errors.push({
                field: "url",
                message: "URL is required",
            })
        }
    }

    // Validate auth parent post url if manual post is enabled
    if (
        (settings.authTypes.current?.includes("manual_post") && !settings.authTypes.new) ||
        settings.authTypes.new?.includes("manual_post")
    ) {
        const authParentPostUrl = settings.authParentPostUrl.new
        if (authParentPostUrl === "" || (authParentPostUrl === null && settings.enabled.new === true)) {
            errors.push({
                field: "authParentPostUrl",
                message: "Public message post URL is required",
            })
        }
    }

    // If enabled is true, then an auth type must be set before saving
    if (settings.enabled.new === true) {
        if (
            settings.authTypes.current === null &&
            (settings.authTypes.new === null || settings.authTypes.new.length === 0)
        ) {
            errors.push({
                field: "authTypes",
                message: "Select at least one authentication type",
            })
        }
    }

    return errors
}
