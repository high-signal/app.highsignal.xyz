function updateRequired(lastUpdated, latestActivityDate) {
  // If no activity data, no update needed
  if (!latestActivityDate) {
    return false;
  }

  // Truncate timestamps to seconds for comparison
  const truncatedLastUpdated = lastUpdated
    ? lastUpdated.substring(0, 19)
    : null;
  const truncatedLatestActivityDate = latestActivityDate.substring(0, 19);

  // Update is required if there's no last update or if the dates don't match
  return !lastUpdated || truncatedLastUpdated !== truncatedLatestActivityDate;
}

module.exports = {
  updateRequired,
};
