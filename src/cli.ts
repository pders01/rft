#!/usr/bin/env -S npx tsx
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { build } from "./build.ts";
import { checkTargets } from "./check.ts";
import { type Config, loadConfig } from "./config.ts";
import { installTargets } from "./install.ts";
import { logger } from "./logger.ts";

function runBuild(config: Config): boolean {
  if (!existsSync(config.sourceDir)) {
    logger.error(`source dir not found: ${config.sourceDir}`);
    return false;
  }
  if (existsSync(config.outDir)) {
    rmSync(config.outDir, { recursive: true, force: true });
  }

  const report = build({
    sourceDir: config.sourceDir,
    outDir: config.outDir,
  });

  if (report.errors.length > 0) {
    logger.error(`Build failed with ${report.errors.length} error(s)`);
    for (const e of report.errors) logger.error(e);
    return false;
  }

  logger.success(
    `${report.entries} entr${report.entries === 1 ? "y" : "ies"} projected`,
  );
  for (const [name, n] of Object.entries(report.emittedByAdapter)) {
    logger.info(`  ${name}: ${n}`);
  }
  return true;
}

function cmdBuild(config: Config): number {
  return runBuild(config) ? 0 : 1;
}

function cmdInstall(config: Config): number {
  if (!runBuild(config)) return 1;

  if (Object.keys(config.targets).length === 0) {
    logger.warn(
      "no targets configured; set `targets` in refract.config.json to install",
    );
    return 0;
  }

  const report = installTargets(config);
  for (const { adapter, target, files } of report.installed) {
    logger.success(`${adapter}: ${files} file(s) → ${target}`);
  }
  for (const adapter of report.missing) {
    logger.warn(`${adapter}: target configured but nothing built to install`);
  }
  return 0;
}

function cmdCheck(config: Config): number {
  if (!existsSync(config.sourceDir)) {
    logger.error(`source dir not found: ${config.sourceDir}`);
    return 1;
  }
  if (Object.keys(config.targets).length === 0) {
    logger.warn("no targets configured; nothing to check");
    return 0;
  }

  const tmp = mkdtempSync(path.join(tmpdir(), "refract-check-"));
  try {
    const report = build({ sourceDir: config.sourceDir, outDir: tmp });
    if (report.errors.length > 0) {
      logger.error(`Build failed with ${report.errors.length} error(s)`);
      for (const e of report.errors) logger.error(e);
      return 1;
    }

    const check = checkTargets(config, tmp);
    if (check.drift.length === 0) {
      logger.success(`in sync — ${check.ok} file(s) match their targets`);
      return 0;
    }

    logger.error(`drift detected in ${check.drift.length} file(s):`);
    for (const d of check.drift) {
      const where = d.reason === "missing" ? "not installed" : "differs";
      logger.error(`  ${d.adapter}/${d.file}: ${where} at ${d.target}`);
    }
    logger.info("run `pnpm sync` to reconcile");
    return 1;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function cmdClean(config: Config): number {
  if (existsSync(config.outDir)) {
    rmSync(config.outDir, { recursive: true, force: true });
    logger.info(`removed ${config.outDir}`);
  }
  return 0;
}

function main(): number {
  const cmd = process.argv[2] ?? "build";

  if (cmd === "--help" || cmd === "-h" || cmd === "help") {
    logger.log("refract <build|install|check|clean>");
    return 0;
  }

  let config: Config;
  try {
    config = loadConfig(process.cwd());
  } catch (err) {
    logger.error((err as Error).message);
    return 1;
  }

  switch (cmd) {
    case "build":
      return cmdBuild(config);
    case "install":
      return cmdInstall(config);
    case "check":
      return cmdCheck(config);
    case "clean":
      return cmdClean(config);
    default:
      logger.error(`Unknown command: ${cmd}`);
      return 2;
  }
}

process.exit(main());
