import { z } from 'zod'

export const itemSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(200),
  category: z.enum(['upkeep', 'fun']),
  completed: z.boolean(),
  createdAt: z.iso.datetime(),
}).strict()
export type Item = z.infer<typeof itemSchema>
export type Category = Item['category']
export const preferencesSchema = z.object({ colorScheme: z.enum(['light', 'dark', 'auto']) }).strict()
export type Preferences = z.infer<typeof preferencesSchema>
export const defaultPreferences: Preferences = { colorScheme: 'auto' }
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024
export const backupSchema = z.object({
  format: z.literal('whimsy-backup'),
  version: z.literal(1),
  exportedAt: z.iso.datetime(),
  items: z.array(itemSchema).max(10000),
  preferences: preferencesSchema,
}).strict().superRefine((backup, context) => {
  if (new Set(backup.items.map((item) => item.id)).size !== backup.items.length) {
    context.addIssue({ code: 'custom', message: 'Duplicate item IDs', path: ['items'] })
  }
})
export type Backup = z.infer<typeof backupSchema>

export function parseBackup(text: string): Backup {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) {
    throw new Error('Backup is too large. Choose a file smaller than 5 MB.')
  }
  try { return backupSchema.parse(JSON.parse(text)) }
  catch { throw new Error('This is not a valid Whimsy version 1 backup. Your saved data has not changed.') }
}
