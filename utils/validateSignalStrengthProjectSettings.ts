export interface ValidationError {
    field: keyof SignalStrengthProjectSettingsState
    message: string
}

export function validateSignalStrengthProjectSettings(settings: SignalStrengthProjectSettingsState): ValidationError[] {
    const errors: ValidationError[] = []

    const isActive =
        settings.enabled.new === true || (settings.enabled.new === null && settings.enabled.current === true)

    // TODO: Remove all the enabled checks inside this now I have the isActive check surrounding it

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
                ![30, 60, 90].includes(previousDays)
            ) {
                errors.push({
                    field: "previousDays",
                    message: "Previous days must be either 30, 60, or 90",
                })
            }
        }

        // Validate url
        // TODO: Add a check here to see if the url is a valid url
        if (settings.url.new !== null || (settings.enabled.new === true && settings.url.current === null)) {
            const url = settings.url.new
            if (url === "" || (url === null && settings.enabled.new === true)) {
                errors.push({
                    field: "url",
                    message: "Required",
                })
            }
        }

        // Validate auth parent post url if manual post is enabled
        // TODO: Add a check here to see if the url is a valid url
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
            }
        }

        // If enabled is true, then an auth type must be set before saving
        if ((settings.enabled.current === true && !settings.enabled.new) || settings.enabled.new === true) {
            const hasCurrentAuthTypes = settings.authTypes.current && settings.authTypes.current.length > 0
            const hasNewAuthTypes = settings.authTypes.new && settings.authTypes.new.length > 0

            let showError = false

            if (hasNewAuthTypes) {
                showError = false
            } else if (hasCurrentAuthTypes && settings.authTypes.new?.length === 0) {
                showError = true
            } else if (!hasCurrentAuthTypes && !hasNewAuthTypes) {
                showError = true
            }

            if (showError) {
                errors.push({
                    field: "authTypes",
                    message: "Select at least one auth type",
                })
            }
        }
    }

    return errors
}
