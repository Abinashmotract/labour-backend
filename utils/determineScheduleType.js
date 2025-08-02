function calculateDistance([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2)); // 2 decimal places
};

function determineScheduleType(customDays) {
  if (!customDays || customDays.length === 0) return 'Mon-Sat';

  const daysMap = {
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
    Sunday: false
  };

  customDays.forEach(day => daysMap[day] = true);

  // Check for standard patterns
  if (daysMap.Monday && daysMap.Tuesday && daysMap.Wednesday &&
    daysMap.Thursday && daysMap.Friday) {
    if (daysMap.Saturday && daysMap.Sunday) return 'Daily';
    if (daysMap.Saturday) return 'Mon-Sat';
    return 'Mon-Fri';
  }

  return 'Custom';
};

module.exports = {
calculateDistance,
determineScheduleType
}