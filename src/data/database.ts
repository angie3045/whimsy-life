import Dexie, { type Table } from 'dexie'
import {
  backupSchema, defaultPreferences, itemSchema, preferencesSchema,
  type Backup, type Category, type Item, type Preferences,
} from '../domain/backup'

interface SettingsRow { key: 'preferences'; value: Preferences }
export class WhimsyDatabase extends Dexie {
  items!: Table<Item, string>
  settings!: Table<SettingsRow, string>
  constructor(name = 'whimsy') {
    super(name)
    // Keep v1 intact. Future schema changes must add a version and upgrade.
    this.version(1).stores({ items: 'id, category, createdAt', settings: 'key' })
  }
}
export const db = new WhimsyDatabase()
export async function addItem(title: string, category: Category, database = db) {
  await database.items.add(itemSchema.parse({
    id: crypto.randomUUID(), title, category, completed: false, createdAt: new Date().toISOString(),
  }))
}
export async function setCompleted(id: string, completed: boolean, database = db) {
  await database.items.update(id, { completed })
}
export async function readPreferences(database = db): Promise<Preferences> {
  return (await database.settings.get('preferences'))?.value ?? { ...defaultPreferences }
}
export async function savePreferences(value: Preferences, database = db) {
  await database.settings.put({ key: 'preferences', value: preferencesSchema.parse(value) })
}
export async function exportBackup(database = db): Promise<Backup> {
  return database.transaction('r', database.items, database.settings, async () =>
    backupSchema.parse({
      format: 'whimsy-backup', version: 1, exportedAt: new Date().toISOString(),
      items: await database.items.toArray(), preferences: await readPreferences(database),
    }),
  )
}
// Called only after UI confirmation. Validate again at the persistence boundary.
export async function replaceFromBackup(input: unknown, database = db) {
  const backup = backupSchema.parse(input)
  await database.transaction('rw', database.items, database.settings, async () => {
    await database.items.clear()
    await database.settings.clear()
    await database.items.bulkAdd(backup.items)
    await database.settings.put({ key: 'preferences', value: backup.preferences })
  })
}
