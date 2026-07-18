import path from "node:path";
import { templates } from "../templates/index.ts";
import { describe, writeOut } from "./describe.ts";
import { type Adapter, AdapterError } from "./types.ts";

const MAX_DESCRIPTION = 1024;

export const skillAdapter: Adapter = {
  name: "skills",

  supports(entry) {
    return entry.kind === "skill" || entry.kind === "tool";
  },

  emit(entry, outDir) {
    const description = describe(entry, "Triggers");
    if (description.length > MAX_DESCRIPTION) {
      throw new AdapterError(
        this.name,
        entry,
        `description exceeds ${MAX_DESCRIPTION} chars (got ${description.length})`,
      );
    }

    const rendered = templates.skill({
      id: entry.id,
      title: entry.title,
      description,
      explicitInvocation: entry.invocation === "explicit",
      content: entry.content,
    });

    writeOut(path.join(outDir, "skills", entry.id, "SKILL.md"), rendered);
  },
};
