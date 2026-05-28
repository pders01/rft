import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { adapters as defaultAdapters } from "./adapters/index.ts";
import type { Adapter } from "./adapters/index.ts";
import { parseFile } from "./parse.ts";
import type { NeutralEntry } from "./schema.ts";

export interface BuildOptions {
  sourceDir: string;
  outDir: string;
  adapters?: Adapter[];
}

export interface BuildReport {
  entries: number;
  emittedByAdapter: Record<string, number>;
  errors: string[];
}

function walkMarkdown(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walkMarkdown(full));
    } else if (st.isFile() && name.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

export function build(options: BuildOptions): BuildReport {
  const adapters = options.adapters ?? defaultAdapters;
  const report: BuildReport = {
    entries: 0,
    emittedByAdapter: Object.fromEntries(adapters.map((a) => [a.name, 0])),
    errors: [],
  };

  // report.entries is derived from `entries.length` at the end — single source
  // of truth for the count.

  const seenIds = new Map<string, string>();
  const files = walkMarkdown(options.sourceDir);
  const entries: NeutralEntry[] = [];

  for (const file of files) {
    try {
      const entry = parseFile(file);
      const prior = seenIds.get(entry.id);
      if (prior) {
        report.errors.push(
          `Duplicate id "${entry.id}" in ${file} (also in ${prior})`,
        );
        continue;
      }
      seenIds.set(entry.id, file);
      entries.push(entry);
    } catch (err) {
      report.errors.push((err as Error).message);
    }
  }

  report.entries = entries.length;
  if (report.errors.length > 0) return report;

  for (const entry of entries) {
    for (const adapter of adapters) {
      if (adapter.supports && !adapter.supports(entry)) continue;
      try {
        adapter.emit(entry, options.outDir);
        report.emittedByAdapter[adapter.name]++;
      } catch (err) {
        report.errors.push((err as Error).message);
      }
    }
  }

  return report;
}
