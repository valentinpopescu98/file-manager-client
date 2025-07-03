export function isoToDate(isoString) {
  const cleanDateStr = isoString.slice(0, 23);
  const date = new Date(cleanDateStr);

  if (isNaN(date)) {
    return "NaN";
  }

  return date.toLocaleString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}