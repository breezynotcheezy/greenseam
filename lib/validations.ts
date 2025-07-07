import { z } from "zod"

export const importFormSchema = z
  .object({
    file: z.instanceof(File).optional(),
    rawText: z.string().optional(),
    teamOverride: z.string().optional(),
    chunkSize: z.number().min(500).max(3000).default(2000),
  })
  .refine((data) => data.file || (data.rawText && data.rawText.trim().length > 0), {
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
