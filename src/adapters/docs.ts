import path from "node:path";
import { templates } from "../templates/index.ts";
import { writeOut } from "./describe.ts";
import type { Adapter } from "./types.ts";

export const docsAdapter: Adapter = {
  name: "docs",

  emit(entry, outDir) {
    const rendered = templates.docs({
      id: entry.id,
      title: entry.title,
      kind: entry.kind,
      intent: entry.intent,
      domains: entry.domains,
      related: entry.related,
      content: entry.content,
    });

    writeOut(path.join(outDir, "docs", `${entry.id}.md`), rendered);
  },
};
