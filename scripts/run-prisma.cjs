const path = require("path");
const { spawnSync } = require("child_process");
const { loadEnv } = require("./load-env.cjs");

const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const env = { ...process.env, ...loadEnv(envPath) };

const prismaBin = path.join(
  rootDir,
  "packages",
  "db",
  "node_modules",
  ".bin",
  process.platform === "win32" ? "prisma.cmd" : "prisma"
);
const prismaCwd = path.join(rootDir, "packages", "db");

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/run-prisma.cjs <args...>");
  process.exit(1);
}

if (!args.includes("--schema")) {
  args.push("--schema", path.join(rootDir, "packages", "db", "prisma", "schema.prisma"));
}

let result;
if (process.platform === "win32") {
  const quoteArg = (value) => {
    if (value.includes("\"")) {
      value = value.replace(/\"/g, "\"\"");
    }
    return /\s/.test(value) ? `"${value}"` : value;
  };
  const cmd = `"${prismaBin}" ${args.map(quoteArg).join(" ")}`;
  result = spawnSync(cmd, {
    cwd: prismaCwd,
    env,
    stdio: "inherit",
    shell: true,
  });
} else {
  result = spawnSync(prismaBin, args, {
    cwd: prismaCwd,
    env,
    stdio: "inherit",
  });
}

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
