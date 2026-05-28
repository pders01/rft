import { readFileSync } from "node:fs";
import matter from "gray-matter";
import { buildEntry, type NeutralEntry } from "./schema.ts";

export function parseFile(sourcePath: string): NeutralEntry {
  const raw = readFileSync(sourcePath, "utf8");
  const { data, content } = matter(raw);
  return buildEntry(data, content, sourcePath);
}
