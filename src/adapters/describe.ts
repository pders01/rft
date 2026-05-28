import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { NeutralEntry } from "../schema.ts";

/**
 * Compose a consumer description: the entry's intent, plus an optional
 * trigger clause labelled per target (e.g. "Triggers" for skills,
 * "Use when" for MCP).
 */
export function describe(entry: NeutralEntry, triggerLabel: string): string {
  const parts = [entry.intent.trim()];
  if (entry.triggers && entry.triggers.length > 0) {
    parts.push(`${triggerLabel}: ${entry.triggers.join("; ")}.`);
  }
  return parts.join(" ");
}

/** Write a file, creating its parent directory if needed. */
export function writeOut(filePath: string, content: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
}
