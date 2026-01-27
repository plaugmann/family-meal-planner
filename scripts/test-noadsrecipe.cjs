const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const modulePath = path.resolve(__dirname, "..", "apps", "web", "lib", "recipe-scrapers", "noadsrecipe.ts");
const moduleUrl = pathToFileURL(modulePath).href;

async function loadModule() {
  return await import(moduleUrl);
}

test("noadsrecipe: cheeseburgersuppe exact parse", async () => {
  const { fetchNoAdsRecipe, scaleIngredients } = await loadModule();
  const url = "https://www.madbanditten.dk/cheeseburger-suppe-hvidkaalssuppe-med-smag-af-burger/";
  const recipe = await fetchNoAdsRecipe(url);

  assert.equal(recipe.title, "Cheeseburgersuppe");
  assert.equal(recipe.servings, 5);

  const expectedIngredients = [
    "150 g bacon",
    "100 g cheddar (revet)",
    "100 g cheddar (revet)",
    "500 g hakket oksek\u00f8d",
    "50 g l\u00f8g",
    "2 fed hvidl\u00f8g",
    "500 g hvidk\u00e5l",
    "2 tsk st\u00f8dt spidskommen",
    "1 tsk cayennepeber",
    "8 dl oksebouillon",
    "40 g koncentreret tomatpur\u00e9",
    "200 g fl\u00f8deost naturel",
    "sm\u00f8r eller kokosolie til stegning ( til stegning)",
  ];
  assert.deepEqual(recipe.ingredients, expectedIngredients);

  const expectedDirections = [
    "Sk\u00e6r bacon i tern og steg det spr\u00f8dt. Fisk de stegte bacontern op og lad dem dryppe af p\u00e5 k\u00f8kkenrulle.",
    "Brun oksek\u00f8det p\u00e5 panden i baconfedtet, til det er gennemstegt.",
    "Hak l\u00f8g og hvidl\u00f8g fint. Snit hvidk\u00e5len helt fint p\u00e5 et mandolinjern eller evt. i foodprocessor.",
    "Opvarm sm\u00f8r eller kokosolie i en suppegryde og steg f\u00f8rst de hakkede l\u00f8g og hvidl\u00f8g heri, til l\u00f8gene er blevet klare.",
    "Kom det brunede oksek\u00f8d, inkl. stegefedtet i suppegryden til l\u00f8gene sammen med det fintsnittede hvidk\u00e5l, krydderier, bouillon, tomatpur\u00e9, cheddar og fl\u00f8deost.",
    "Vend det hele godt sammen og lad det koge op.",
    "Skru ned for temperaturen og lad suppen simre i 20-30 minutter.",
    "Smag til med salt og peber.",
    "Drys med de spr\u00f8dstegte bacontern og revet cheddar p\u00e5 toppen.",
  ];
  assert.deepEqual(recipe.directions, expectedDirections);

  const scaled = scaleIngredients(recipe.ingredientParts, recipe.servings, 10);
  const cabbage = scaled.find((item) => item.product.includes("hvidk\u00e5l"));
  assert.equal(cabbage.amount, 1000);
});

test("noadsrecipe: kaalbolle med tunsalat parses", async () => {
  const { fetchNoAdsRecipe } = await loadModule();
  const url = "https://www.madbanditten.dk/kaalbolle-med-tunsalat/";
  const recipe = await fetchNoAdsRecipe(url);

  assert.equal(recipe.title, "K\u00e5lbolle med tunsalat");
  assert.equal(recipe.servings, 2);
  assert.ok(recipe.ingredients.length > 0);
  assert.ok(recipe.directions.length > 0);
});

test("noadsrecipe: arla kyllingekofta parses", async () => {
  const { fetchNoAdsRecipe } = await loadModule();
  const url = "https://www.arla.dk/opskrifter/kyllingekofta/";
  const recipe = await fetchNoAdsRecipe(url);

  assert.equal(recipe.title, "Kyllingekofta");
  assert.equal(recipe.servings, 4);
  assert.ok(recipe.ingredients.length > 0);
  assert.ok(recipe.directions.length > 0);
});

test("noadsrecipe: spansk tortilla includes image", async () => {
  const { fetchNoAdsRecipe } = await loadModule();
  const url = "https://www.madbanditten.dk/spansk-tortilla-med-peberfrugt/";
  const recipe = await fetchNoAdsRecipe(url);

  assert.equal(recipe.title, "Spansk tortilla med peberfrugt");
  assert.ok(recipe.servings > 0);
  assert.ok(recipe.imageUrl);
});
