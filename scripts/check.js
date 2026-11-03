import { readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { validateDatabase } from "../lib/domain.js";
for (const folder of [".", "lib", "scripts", "tests/unit", "tests/e2e"]) {
  for (const file of readdirSync(folder).filter((f) => f.endsWith(".js"))) {
    const r = spawnSync(process.execPath, ["--check", `${folder}/${file}`], {
      stdio: "inherit",
    });
    if (r.status !== 0) process.exit(r.status || 1);
  }
}
validateDatabase(JSON.parse(readFileSync("ingredients-db.json", "utf8")));
for (const name of ["inspiration.json", "manifest.webmanifest", "package.json"])
  JSON.parse(readFileSync(name, "utf8"));
console.log("Syntax, JSON and ingredient evidence contract passed.");
