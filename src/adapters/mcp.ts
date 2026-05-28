import path from "node:path";
import { templates } from "../templates/index.ts";
import { describe, writeOut } from "./describe.ts";
import type { Adapter } from "./types.ts";

export const mcpAdapter: Adapter = {
  name: "mcp",

  supports(entry) {
    return entry.kind === "tool";
  },

  emit(entry, outDir) {
    const rendered = templates.mcp({
      id: entry.id,
      description: describe(entry, "Use when"),
    });

    writeOut(path.join(outDir, "mcp", `${entry.id}.json`), rendered);
  },
};
