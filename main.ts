// Leonida Legend — entrypoint for the GTA VI trophy guide.
// Copies app/ and screenshots/ into the output directory and writes
// dossier.json with buildDossier from the kit's vendor/makefun-frontend.ts.
// Node 22, standard library only. No network.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const ROOT = import.meta.dirname;

function outDir(): string {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--output" && argv[i + 1]) return argv[i + 1];
    if (argv[i].startsWith("--output=")) return argv[i].slice("--output=".length);
  }
  const env = process.env.MAKEFUN_OUTPUT_DIR;
  if (env) return env;
  return "/output";
}

function clearContents(out: string): void {
  // Clear the output directory's CONTENTS, never the directory itself: the
  // grader runs as uid 65534 and /output is a mount owned by root, so
  // deleting the directory itself fails with EPERM.
  mkdirSync(out, { recursive: true });
  for (const name of readdirSync(out)) {
    rmSync(join(out, name), { recursive: true, force: true });
  }
}

function main(): void {
  const appDir = join(ROOT, "app");
  if (!existsSync(appDir)) {
    console.error("app/ is missing");
    process.exit(2);
  }
  const out = outDir();
  clearContents(out);
  cpSync(appDir, join(out, "app"), { recursive: true });
  const shotsDir = join(ROOT, "screenshots");
  if (existsSync(shotsDir)) {
    cpSync(shotsDir, join(out, "screenshots"), { recursive: true });
  }
  // buildDossier returns the dossier as bytes (a Uint8Array); it does not
  // write the file itself — write those exact bytes to dossier.json.
  const dossier = buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 48 * 1024 * 1024,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(out, "dossier.json"), dossier);
  console.log("wrote " + out + "/dossier.json (" + dossier.length + " bytes)");
}

main();
