import type { NeutralEntry } from "../schema.ts";

export interface Adapter {
  name: string;
  supports?(entry: NeutralEntry): boolean;
  emit(entry: NeutralEntry, outDir: string): void;
}

export class AdapterError extends Error {
  constructor(adapter: string, entry: NeutralEntry, message: string) {
    super(`[${adapter}] ${entry.sourcePath}: ${message}`);
    this.name = "AdapterError";
  }
}
