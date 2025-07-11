import { ParsedPlay } from "./types";

export const importFormSchema = z.object({
  file: z.any().optional(), // Change from File instance check to any since File is not available during validation
  rawText: z.string().optional(),
  teamOverride: z.string().optional(),
  chunkSize: z.number().min(1000).max(8000).default(4000),
}).refine(data => data.file || (data.rawText && data.rawText.trim().length > 0), {
  message: "Either a file or raw text must be provided",
  path: ["file"],
})

export type ImportFormData = z.infer<typeof importFormSchema>

export const uploadRecordSchema = z.object({
  id: z.number(),
  filename: z.string(),
  plateAppearances: z.number(),
  teamName: z.string(),
  createdAt: z.string(),
})

export type UploadRecord = z.infer<typeof uploadRecordSchema>

export function validateParsedData(data: ParsedPlay[]): boolean {
  return !data.some((play) => play.isHit && play.isError);
}
