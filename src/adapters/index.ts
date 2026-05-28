import { docsAdapter } from "./docs.ts";
import { mcpAdapter } from "./mcp.ts";
import { skillAdapter } from "./skills.ts";
import type { Adapter } from "./types.ts";

export const adapters: Adapter[] = [skillAdapter, mcpAdapter, docsAdapter];

export type { Adapter } from "./types.ts";
