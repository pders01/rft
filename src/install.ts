import { cpSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import type { Config } from "./config.ts";

export interface InstallResult {
  adapter: string;
  target: string;
  files: number;
}

export interface InstallReport {
  installed: InstallResult[];
  /** adapters configured with a target but with nothing built to copy */
  missing: string[];
}

function countFiles(dir: string): number {
  let n = 0;
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) n += countFiles(full);
    else n += 1;
  }
  return n;
}

/**
 * Copy each configured adapter's output subtree from `outDir` into its
 * target. Assumes `build` has already populated `outDir`. Targets whose
 * source subtree does not exist (adapter emitted nothing) are reported as
 * missing rather than failing the run.
 */
export function installTargets(config: Config): InstallReport {
  const report: InstallReport = { installed: [], missing: [] };

  for (const [adapter, target] of Object.entries(config.targets)) {
    const src = path.join(config.outDir, adapter);
    if (!existsSync(src)) {
      report.missing.push(adapter);
      continue;
    }
    cpSync(src, target, { recursive: true });
    report.installed.push({
      adapter,
      target,
      files: countFiles(src),
    });
  }

  return report;
}
