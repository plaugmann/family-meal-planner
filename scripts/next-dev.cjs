const path = require("path");
const { spawnSync } = require("child_process");
const { loadEnv } = require("./load-env.cjs");

const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const env = { ...process.env, ...loadEnv(envPath) };

const webDir = path.join(rootDir, "apps", "web");
const nextBin = path.join(
  webDir,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "next.cmd" : "next"
);

let result;
if (process.platform === "win32") {
  const cmd = `"${nextBin}" dev`;
  result = spawnSync(cmd, {
    cwd: webDir,
    env,
    stdio: "inherit",
    shell: true,
  });
} else {
  result = spawnSync(nextBin, ["dev"], {
    cwd: webDir,
    env,
    stdio: "inherit",
  });
}

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
