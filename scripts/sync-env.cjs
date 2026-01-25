const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const source = path.join(rootDir, ".env");
const target = path.join(rootDir, "apps", "web", ".env.local");

if (!fs.existsSync(source)) {
  console.error("Missing .env at repo root.");
  process.exit(1);
}

fs.copyFileSync(source, target);
console.log(`Copied ${source} -> ${target}`);
