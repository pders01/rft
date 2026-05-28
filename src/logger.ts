import { createConsola } from "consola";

const levelFromEnv = (): number | undefined => {
  const raw = process.env.REFRACT_LOG_LEVEL;
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

export const logger = createConsola({
  level: levelFromEnv() ?? 3,
  defaults: { tag: "refract" },
});

export type Logger = typeof logger;
