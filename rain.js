// Rain-o-meter: turns today's rain forecast into a chance, a level and a
// list of rain gear to bring.

const RAIN_LEVELS = [
  { min: 80, name: "Soaked" },
  { min: 50, name: "Likely" },
  { min: 20, name: "Maybe" },
  { min: 0, name: "Dry" },
];

// Above this wind speed (km/h) an umbrella turns inside out.
const UMBRELLA_WIND_LIMIT = 40;

function rainLevel(chance) {
  return RAIN_LEVELS.find((level) => chance >= level.min).name;
}

// When a location has no rain probability, estimate one from the expected amount (mm).
function chanceFromAmount(amount) {
  if (amount >= 10) return 90;
  if (amount >= 1) return 60;
  if (amount > 0) return 30;
  return 5;
}

/**
 * @param {object} day today's forecast
 * @param {number|null} day.chance precipitation_probability_max, 0-100
 * @param {number} day.amount precipitation_sum in mm
 * @param {number} day.windMax wind_speed_10m_max in km/h
 * @param {number} day.code WMO weather code
 */
function rainOutlook({ chance, amount, windMax, code }) {
  const known = chance !== null && chance !== undefined;
  const percent = known ? Math.round(chance) : chanceFromAmount(amount);
  const level = rainLevel(percent);
  const kind = weatherKind(code);
  const windy = windMax >= UMBRELLA_WIND_LIMIT;
  const gear = [];
  const notes = [];

  if (kind === "snow" && percent >= 20) {
    gear.push(["🥾", "Waterproof boots"], ["🧥", "Warm waterproof coat"], ["🧤", "Gloves and a hat"]);
    notes.push("It's snow, not rain, so skip the umbrella and bundle up.");
  } else if (level === "Dry") {
    gear.push(["😎", "No rain gear needed"]);
    notes.push("Leave the umbrella at home.");
  } else if (level === "Maybe") {
    gear.push(windy ? ["🧥", "Light hooded jacket"] : ["☂️", "Compact umbrella"]);
    notes.push("Pack something small, just in case.");
  } else if (level === "Likely") {
    gear.push(windy ? ["🧥", "Hooded raincoat"] : ["☂️", "Umbrella"], ["🧥", "Water-resistant jacket"]);
    notes.push("Rain is likely at some point today.");
  } else {
    gear.push(["🧥", "Raincoat"], ["☂️", "Umbrella"], ["🥾", "Waterproof boots"]);
    notes.push("Expect a soaking. Dress for it!");
  }

  if (windy && kind !== "snow" && level !== "Dry") {
    // Drop the umbrella; a hood copes with gusts.
    const i = gear.findIndex(([, name]) => name.includes("mbrella"));
    if (i !== -1) gear.splice(i, 1);
    notes.push(`Gusts up to ${Math.round(windMax)} km/h: too windy for an umbrella.`);
  }
  if (kind === "storm" && level !== "Dry") {
    gear.push(["⚡", "Plans to stay indoors"]);
    notes.push("Thunderstorms expected. Head inside when you hear thunder.");
  }

  // Keep one raincoat if two rules added one.
  const seen = new Set();
  const uniqueGear = gear.filter(([, name]) => {
    const key = name.includes("coat") || name.includes("jacket") ? "coat" : name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const amountText =
    amount > 0 ? `Up to ${amount.toFixed(1)} mm expected today.` : "No measurable rain expected today.";

  return { percent, known, level, gear: uniqueGear, amountText, note: notes.join(" ") };
}
