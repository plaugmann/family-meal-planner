const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.join(rootDir, "packages", "db", "node_modules", ".prisma", "client");
const targetDir = path.join(rootDir, "apps", "web", "node_modules", ".prisma", "client");

async function sync() {
  await fs.promises.rm(targetDir, { recursive: true, force: true });
  await fs.promises.mkdir(targetDir, { recursive: true });
  await fs.promises.cp(sourceDir, targetDir, { recursive: true });
  console.log("Synced Prisma client to apps/web node_modules/.prisma/client");
}

sync().catch((error) => {
  console.error(error);
  process.exit(1);
});
