import validator from "validator"
export interface ValidationError {
    field: keyof SignalStrengthProjectSettingsState
    message: string
}

export function validateSignalStrengthProjectSettings(settings: SignalStrengthProjectSettingsState): ValidationError[] {
    const errors: ValidationError[] = []

    const isActive =
        settings.enabled.new === true || (settings.enabled.new === null && settings.enabled.current === true)

    if (isActive) {
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
                ![30, 60, 90, 180, 270, 360].includes(previousDays)
            ) {
                errors.push({
                    field: "previousDays",
                    message: "Previous days must be either 30, 60, 90, 180, 270 or 360",
                })
            }
        }

        // Check url has a value
        if ((settings.url.current === null && settings.url.new === null) || settings.url.new === "") {
            errors.push({
                field: "url",
                message: "Required",
            })
        }

        // Check url is a valid url
        if (settings.url.new && settings.url.new !== "") {
            if (!validator.isURL(settings.url.new)) {
                errors.push({
                    field: "url",
                    message: "Invalid URL",
                })
            }
        }

        // Validate auth parent post url if manual post is enabled
        if (
            (settings.authTypes.current?.includes("manual_post") &&
                (!settings.authTypes.new || settings.authTypes.new?.length === 0)) ||
            settings.authTypes.new?.includes("manual_post")
        ) {
            let showError = false

            if (settings.authParentPostUrl.new !== null && settings.authParentPostUrl.new === "") {
                // If there is a new one that is not null, show error
                showError = true
            } else if (!settings.authParentPostUrl.current && !settings.authParentPostUrl.new) {
                // If there is no current one and no new one, show error
                showError = true
            }
            if (showError) {
                errors.push({
                    field: "authParentPostUrl",
                    message: "Required",
                })
            } else if (
                settings.authParentPostUrl.new &&
                settings.authParentPostUrl.new !== "" &&
                !validator.isURL(settings.authParentPostUrl.new)
            ) {
                errors.push({
                    field: "authParentPostUrl",
                    message: "Invalid URL",
                })
            }
        }

        // If enabled is true, then an auth type must be set before saving
        const hasCurrentAuthTypes = settings.authTypes.current && settings.authTypes.current.length > 0
        const hasNewAuthTypes = settings.authTypes.new && settings.authTypes.new.length > 0

        let showAuthTypeRequiredError = false

        if (hasNewAuthTypes) {
            showAuthTypeRequiredError = false
        } else if (hasCurrentAuthTypes && settings.authTypes.new?.length === 0) {
            showAuthTypeRequiredError = true
        } else if (!hasCurrentAuthTypes && !hasNewAuthTypes) {
            showAuthTypeRequiredError = true
        }

        if (showAuthTypeRequiredError) {
            errors.push({
                field: "authTypes",
                message: "Select at least one auth type",
            })
        }
    }

    return errors
}
