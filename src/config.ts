import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { z } from "zod";

export const CONFIG_FILENAME = "refract.config.json";

const ConfigFileSchema = z
  .object({
    sourceDir: z.string().min(1).default("source"),
    outDir: z.string().min(1).default("dist"),
    targets: z.record(z.string().min(1)).default({}),
  })
  .strict();

export type ConfigFile = z.infer<typeof ConfigFileSchema>;

/** A config with every path resolved to an absolute location. */
export interface Config {
  root: string;
  sourceDir: string;
  outDir: string;
  /** adapter name -> absolute install destination */
  targets: Record<string, string>;
}

function expandHome(p: string): string {
  if (p === "~") return homedir();
  if (p.startsWith("~/")) return path.join(homedir(), p.slice(2));
  return p;
}

function resolveFrom(root: string, p: string): string {
  const expanded = expandHome(p);
  return path.isAbsolute(expanded) ? expanded : path.resolve(root, expanded);
}

export function loadConfig(root: string): Config {
  const file = path.join(root, CONFIG_FILENAME);
  let raw: unknown = {};

  if (existsSync(file)) {
    try {
      raw = JSON.parse(readFileSync(file, "utf8"));
    } catch (err) {
      throw new Error(
        `Invalid JSON in ${CONFIG_FILENAME}: ${(err as Error).message}`,
      );
    }
  }

  const parsed = ConfigFileSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid ${CONFIG_FILENAME}:\n${issues}`);
  }

  const cfg = parsed.data;
  return {
    root,
    sourceDir: resolveFrom(root, cfg.sourceDir),
    outDir: resolveFrom(root, cfg.outDir),
    targets: Object.fromEntries(
      Object.entries(cfg.targets).map(([name, dest]) => [
        name,
        resolveFrom(root, dest),
      ]),
    ),
  };
}
