const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const modulePath = path.resolve(__dirname, "..", "apps", "web", "lib", "recipe-scrapers", "site-search.ts");
const moduleUrl = pathToFileURL(modulePath).href;

async function loadModule() {
  return await import(moduleUrl);
}

test("madbanditten search returns results", async () => {
  const { searchMadbanditten } = await loadModule();
  const results = await searchMadbanditten("tortilla", 5);
  assert.ok(results.length > 0);
  assert.ok(results.some((item) => item.url.includes("madbanditten.dk")));
});

test("valdemarsro search returns results", async () => {
  const { searchValdemarsro } = await loadModule();
  const results = await searchValdemarsro("kylling", 5);
  assert.ok(results.length > 0);
  assert.ok(results.some((item) => item.url.includes("valdemarsro.dk")));
});

test("arla search returns results", async () => {
  const { searchArla } = await loadModule();
  const results = await searchArla("kylling", 5);
  assert.ok(results.length > 0);
  assert.ok(results.some((item) => item.url.includes("arla.dk")));
});
