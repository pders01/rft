import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import type { Config } from "./config.ts";

export type DriftReason = "missing" | "changed";

export interface Drift {
  adapter: string;
  /** path relative to the adapter subtree, e.g. "commits/SKILL.md" */
  file: string;
  reason: DriftReason;
  target: string;
}

export interface CheckReport {
  /** number of built files that match the installed target byte-for-byte */
  ok: number;
  drift: Drift[];
}

function walkRelative(dir: string, base = dir): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...walkRelative(full, base));
    } else {
      out.push(path.relative(base, full));
    }
  }
  return out;
}

/**
 * Compare freshly built output against the installed targets. Only files the
 * build produced are inspected, so unrelated files already living in a target
 * (e.g. other skills under ~/.claude/skills) are never reported as drift.
 */
export function checkTargets(config: Config, builtOutDir: string): CheckReport {
  const report: CheckReport = { ok: 0, drift: [] };

  for (const [adapter, target] of Object.entries(config.targets)) {
    const builtDir = path.join(builtOutDir, adapter);
    if (!existsSync(builtDir)) continue;

    for (const rel of walkRelative(builtDir)) {
      const builtFile = path.join(builtDir, rel);
      const targetFile = path.join(target, rel);

      if (!existsSync(targetFile)) {
        report.drift.push({ adapter, file: rel, reason: "missing", target });
        continue;
      }
      const builtContent = readFileSync(builtFile);
      const targetContent = readFileSync(targetFile);
      if (!builtContent.equals(targetContent)) {
        report.drift.push({ adapter, file: rel, reason: "changed", target });
        continue;
      }
      report.ok += 1;
    }
  }

  return report;
}
