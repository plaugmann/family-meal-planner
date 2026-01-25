const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { loadEnv } = require("./load-env.cjs");

const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const env = { ...process.env, ...loadEnv(envPath) };

const webDir = path.join(rootDir, "apps", "web");
const schemaSrc = path.join(rootDir, "packages", "db", "prisma", "schema.prisma");
const schemaTmp = path.join(webDir, ".prisma-schema.tmp");

fs.writeFileSync(schemaTmp, fs.readFileSync(schemaSrc, "utf8"), "ascii");

const prismaBin = path.join(
  rootDir,
  "packages",
  "db",
  "node_modules",
  ".bin",
  process.platform === "win32" ? "prisma.cmd" : "prisma"
);

let result;
if (process.platform === "win32") {
  const quoteArg = (value) => {
    if (value.includes("\"")) {
      value = value.replace(/\"/g, "\"\"");
    }
    return /\s/.test(value) ? `"${value}"` : value;
  };
  const cmd = `"${prismaBin}" ${["generate", "--schema", schemaTmp].map(quoteArg).join(" ")}`;
  result = spawnSync(cmd, { cwd: webDir, env, stdio: "inherit", shell: true });
} else {
  result = spawnSync(
    prismaBin,
    ["generate", "--schema", schemaTmp],
    { cwd: webDir, env, stdio: "inherit" }
  );
}

try {
  fs.unlinkSync(schemaTmp);
} catch {
  // Ignore cleanup issues on Windows.
}

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
