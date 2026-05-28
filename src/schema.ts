import { z } from "zod";

export const Kind = z.enum(["tool", "skill", "snippet", "doc"]);
export type Kind = z.infer<typeof Kind>;

const slug = z
  .string()
  .min(1)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "must be kebab-case slug");

export const FrontmatterSchema = z
  .object({
    id: slug,
    title: z.string().min(1),
    kind: Kind,
    intent: z.string().min(1),
    triggers: z.array(z.string().min(1)).optional(),
    domains: z.array(z.string().min(1)).optional(),
    related: z.array(slug).optional(),
  })
  .strict();

export type Frontmatter = z.infer<typeof FrontmatterSchema>;

export interface NeutralEntry extends Frontmatter {
  content: string;
  sourcePath: string;
}

export function buildEntry(
  data: unknown,
  content: string,
  sourcePath: string,
): NeutralEntry {
  const result = FrontmatterSchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid frontmatter in ${sourcePath}:\n${issues}`,
    );
  }
  return { ...result.data, content: content.trim(), sourcePath };
}
