// "Cook for the weather": recipe ideas for today's weather, season and
// country, plus fruit and vegetables that are typically in season.

// ---- Season ----

// Meteorological seasons; flipped south of the equator. Near the equator
// there is no real winter, so produce follows a tropical list instead.
function seasonFor(latitude, dateString) {
  if (Math.abs(latitude) < 23.5) return { key: "tropical", label: "tropical, all year" };
  const month = Number(dateString.slice(5, 7)); // 1-12
  const north = ["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "autumn", "autumn", "autumn", "winter"];
  const flip = { winter: "summer", spring: "autumn", summer: "winter", autumn: "spring" };
  const key = latitude >= 0 ? north[month - 1] : flip[north[month - 1]];
  const hemisphere = latitude >= 0 ? "Northern" : "Southern";
  return { key, label: `${key}, ${hemisphere} Hemisphere` };
}

const PRODUCE = {
  spring: {
    fruits: ["Strawberries", "Rhubarb", "Apricots", "Cherries"],
    veggies: ["Asparagus", "Peas", "Artichokes", "Radishes", "Spinach", "Spring onions"],
  },
  summer: {
    fruits: ["Peaches", "Blueberries", "Watermelon", "Plums", "Raspberries"],
    veggies: ["Tomatoes", "Zucchini", "Sweet corn", "Cucumbers", "Peppers", "Green beans"],
  },
  autumn: {
    fruits: ["Apples", "Pears", "Grapes", "Figs", "Cranberries"],
    veggies: ["Pumpkin", "Butternut squash", "Sweet potatoes", "Brussels sprouts", "Mushrooms", "Cauliflower"],
  },
  winter: {
    fruits: ["Oranges", "Clementines", "Grapefruit", "Kiwi", "Pomegranates"],
    veggies: ["Kale", "Leeks", "Parsnips", "Cabbage", "Carrots", "Celeriac"],
  },
  tropical: {
    fruits: ["Mangoes", "Papaya", "Pineapple", "Bananas", "Passion fruit"],
    veggies: ["Sweet potatoes", "Okra", "Cassava", "Eggplant", "Chilies", "Plantains"],
  },
};

// ---- Recipes ----

// cozy: wet or cold; fresh: hot and sunny; mild: everything in between.
function cookingMood(kind, tempMax) {
  if (["rain", "snow", "storm", "fog"].includes(kind) || tempMax < 12) return "cozy";
  if (tempMax >= 24 && (kind === "clear" || kind === "partly")) return "fresh";
  return "mild";
}

const MOOD_HEADLINES = {
  cozy: "Soup-and-stew weather. Get something bubbling on the stove.",
  fresh: "Too hot to cook much? Keep it cool and fresh.",
  mild: "A mild day. Good for something in between.",
};

// [emoji, dish, why]
const RECIPES = {
  cozy: {
    spring: [["🥣", "Pea and mint soup", "Sweet spring peas, ready in 20 minutes"], ["🍲", "Chicken and asparagus pot pie", "Warming, with in-season asparagus"]],
    summer: [["🍝", "Roasted tomato pasta", "Makes the most of ripe tomatoes"], ["🌽", "Sweet corn chowder", "Creamy comfort on a grey summer day"]],
    autumn: [["🎃", "Butternut squash soup", "Silky, sweet and in season"], ["🍄", "Mushroom risotto", "Slow stirring for a rainy afternoon"]],
    winter: [["🥘", "Beef and root vegetable stew", "Parsnips and carrots at their best"], ["🥬", "Kale and white bean soup", "Hearty, cheap and quick"]],
    tropical: [["🍛", "Coconut chickpea curry", "Warming spice with coconut"], ["🍠", "Sweet potato and lentil stew", "Filling and full of flavour"]],
  },
  fresh: {
    spring: [["🥗", "Asparagus and radish salad", "Crunchy, bright and no-cook"], ["🍓", "Strawberry spinach salad", "Sweet and peppery"]],
    summer: [["🍅", "Tomato and peach salad", "Peak-summer produce, zero cooking"], ["🥒", "Chilled cucumber soup", "Cool and refreshing"]],
    autumn: [["🍎", "Apple and fennel slaw", "Crisp on a warm autumn day"], ["🍐", "Pear, walnut and blue cheese salad", "Sweet and salty, no oven needed"]],
    winter: [["🍊", "Citrus and avocado salad", "Bright flavours for a sunny winter day"], ["🥗", "Kale Caesar", "Hearty greens, served cold"]],
    tropical: [["🥭", "Mango salsa with grilled fish", "Juicy, tangy and quick"], ["🍍", "Pineapple fried rice", "Sweet, savoury and fast"]],
  },
  mild: {
    spring: [["🍳", "Spring vegetable frittata", "Uses whatever greens you have"], ["🐟", "Lemon salmon with peas", "Light but satisfying"]],
    summer: [["🌮", "Grilled veggie tacos", "Zucchini, peppers and corn"], ["🍆", "Ratatouille", "A summer garden in one pan"]],
    autumn: [["🍠", "Sheet-pan sweet potatoes and sausage", "One tray, little washing up"], ["🥧", "Apple crumble", "Autumn apples, warm from the oven"]],
    winter: [["🥦", "Roasted cauliflower with tahini", "Simple and full of flavour"], ["🥧", "Leek and potato gratin", "Comforting without being heavy"]],
    tropical: [["🍌", "Banana pancakes", "Ripe bananas, quick breakfast"], ["🍤", "Garlic prawns with rice", "Light and fast"]],
  },
};

// One local favourite per country: [cozy dish, fresh dish].
const LOCAL_DISHES = {
  US: ["Chili con carne", "Cobb salad"],
  CA: ["French Canadian pea soup", "Cedar-plank salmon"],
  MX: ["Pozole", "Aguachile"],
  GB: ["Shepherd's pie", "Coronation chicken"],
  IE: ["Irish stew", "Smoked salmon on brown bread"],
  FR: ["Boeuf bourguignon", "Salade niçoise"],
  IT: ["Minestrone", "Caprese salad"],
  ES: ["Cocido madrileño", "Gazpacho"],
  DE: ["Kartoffelsuppe", "Kartoffelsalat"],
  IS: ["Kjötsúpa (lamb soup)", "Plokkfiskur"],
  IN: ["Dal tadka", "Kachumber salad"],
  JP: ["Ramen", "Hiyashi chuka (cold noodles)"],
  KR: ["Kimchi jjigae", "Naengmyeon (cold noodles)"],
  CN: ["Hot pot", "Smashed cucumber salad"],
  TH: ["Tom yum soup", "Som tam (papaya salad)"],
  AU: ["Beef and red wine pie", "Barbecued prawns"],
  NZ: ["Lamb shank stew", "Fish tacos with slaw"],
  BR: ["Feijoada", "Açaí bowl"],
};

function recipeSearchUrl(dish) {
  return `https://duckduckgo.com/?q=${encodeURIComponent(`${dish} recipe`)}`;
}

/**
 * @param {object} p
 * @param {object} p.place geocoded place (latitude, country, country_code)
 * @param {string} p.kind weather scene from weatherKind()
 * @param {number} p.tempMax today's high in °C
 * @param {string} p.date today's date, YYYY-MM-DD
 */
function foodIdeas({ place, kind, tempMax, date }) {
  const season = seasonFor(place.latitude, date);
  const mood = cookingMood(kind, tempMax);
  const ideas = RECIPES[mood][season.key].map(([icon, name, why]) => ({ icon, name, why }));

  const local = LOCAL_DISHES[(place.country_code || "").toUpperCase()];
  if (local) {
    const name = mood === "fresh" ? local[1] : local[0];
    ideas.unshift({ icon: "📍", name, why: `A local favourite in ${place.country}` });
  }

  return {
    headline: MOOD_HEADLINES[mood],
    ideas: ideas.map((idea) => ({ ...idea, url: recipeSearchUrl(idea.name) })),
    season,
    produce: PRODUCE[season.key],
  };
}
