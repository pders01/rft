import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Handlebars from "handlebars";

Handlebars.registerHelper("yaml", (value: unknown) => {
  if (value === undefined || value === null) return "";
  return JSON.stringify(String(value));
});

Handlebars.registerHelper("yamlList", (value: unknown) => {
  if (!Array.isArray(value) || value.length === 0) return "[]";
  return `[${value.map((v) => JSON.stringify(String(v))).join(", ")}]`;
});

Handlebars.registerHelper("json", (value: unknown) =>
  JSON.stringify(value),
);

const here = path.dirname(fileURLToPath(import.meta.url));

function load(name: string): HandlebarsTemplateDelegate {
  const raw = readFileSync(path.join(here, `${name}.hbs`), "utf8");
  return Handlebars.compile(raw, { noEscape: true, strict: true });
}

export const templates = {
  skill: load("skill"),
  mcp: load("mcp"),
  docs: load("docs"),
} as const;
