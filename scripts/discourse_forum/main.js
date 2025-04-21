require("dotenv").config({ path: "../.env" });

const { createClient } = require("@supabase/supabase-js");

const { analyzeUserData } = require("./analyzeUserData");
const { getUsernames } = require("./getUsernames");
const { fetchUserActivity } = require("./fetchUserActivity");
const { updateUserData } = require("./updateUserData");
const { updateRequired } = require("./updateRequired");
const { getSignalStrengthConfig } = require("./getSignalStrengthConfig");

// === CONFIG ===
const PROJECT_ID = 1;
const SIGNAL_STRENGTH_ID = 1;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// === Main function ===
async function main() {
  try {
    // === Fetch all signal strength configs from Supabase ===
    console.log("");
    console.log(
      `Fetching signal strength config from Supabase for project ${PROJECT_ID}...`
    );
    const signalStrengthConfig = await getSignalStrengthConfig(
      supabase,
      PROJECT_ID,
      SIGNAL_STRENGTH_ID
    );

    const enabled = signalStrengthConfig[0].enabled;
    const maxValue = signalStrengthConfig[0].max_value;
    const url = signalStrengthConfig[0].url;
    const previousDays = signalStrengthConfig[0].previous_days;

    if (!enabled) {
      console.log("Signal strength is not enabled. Exiting...");
      return;
    }

    // === Fetch all forum usernames from Supabase ===
    console.log("");
    console.log(
      `Fetching all forum_username from Supabase for project ${PROJECT_ID}...`
    );
    const users = await getUsernames(supabase, PROJECT_ID);
    console.log(`Found ${users.length} users`);

    // === Process each user ===
    for (const user of users) {
      const username = user.forum_username;
      const lastUpdated = user.last_updated;

      // === Fetch activity data from forum API ===
      console.log("--------------------------------");
      console.log(`Fetching activity for user: ${username}`);
      const activityData = await fetchUserActivity(url, username);
      console.log(
        `Processed ${activityData.length} activities for ${username}`
      );

      if (activityData) {
        // === Get the latest activity date for the update ===
        const latestActivityDate = activityData.sort(
          (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
        )[0].updated_at;

        // === Check if update is required ===
        if (updateRequired(lastUpdated, latestActivityDate)) {
          console.log(`User ${username} needs updating.`);
          console.log(`Last updated:         ${lastUpdated}`);
          console.log(`Latest activity date: ${latestActivityDate}`);

          // Filter activity data to the past 90 days
          const filteredActivityData = activityData.filter(
            (activity) =>
              new Date(activity.updated_at) >
              new Date(new Date().setDate(new Date().getDate() - previousDays))
          );

          console.log(
            `Filtered activity data to the past ${previousDays} days: ${filteredActivityData.length}`
          );

          // === Analyze user data with AI ===
          const analysisResults = await analyzeUserData(
            filteredActivityData,
            username,
            maxValue,
            previousDays
          );

          // === Validity check on maxValue ===
          if (analysisResults && !analysisResults.error) {
            if (analysisResults.value > maxValue) {
              console.error(
                `User ${username} has a score greater than ${maxValue}. Setting to ${maxValue}.`
              );
              analysisResults.value = maxValue;
            }
          }

          // === Store the analysis results in the database ===
          if (analysisResults && !analysisResults.error) {
            await updateUserData(
              supabase,
              PROJECT_ID,
              SIGNAL_STRENGTH_ID,
              username,
              user,
              latestActivityDate,
              analysisResults
            );
          } else {
            console.error(
              `Analysis failed for ${username}:`,
              analysisResults?.error || "Unknown error"
            );
          }
        } else {
          console.log(`User ${username} is up to date. No analysis needed.`);
        }
      } else {
        console.log(`No activity data found for ${username}`);
      }

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("User activity processing completed.");
  } catch (error) {
    console.error("Error in main:", error.message);
  }
}

main().catch((err) => {
  console.error("Error running script:", err.message);
});
