import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { addItem, exportBackup, readPreferences, replaceFromBackup, savePreferences, setCompleted, WhimsyDatabase } from './database'
import { MAX_BACKUP_BYTES, parseBackup } from '../domain/backup'

let database: WhimsyDatabase
beforeEach(() => { database = new WhimsyDatabase(`test-${crypto.randomUUID()}`) })
afterEach(async () => { await database.delete() })

describe('versioned local persistence', () => {
  it('retains items, completion and preferences after closing and reopening', async () => {
    await addItem('Water plants', 'upkeep', database)
    const item = (await database.items.toArray())[0]
    await setCompleted(item.id, true, database)
    await savePreferences({ colorScheme: 'dark' }, database)
    database.close()
    database = new WhimsyDatabase(database.name)
    expect(await database.items.get(item.id)).toMatchObject({ title: 'Water plants', completed: true })
    expect(await readPreferences(database)).toEqual({ colorScheme: 'dark' })
    expect(database.verno).toBe(1)
  })

  it('round-trips all stored data and replaces rather than merges', async () => {
    await addItem('Try pottery', 'fun', database)
    await savePreferences({ colorScheme: 'dark' }, database)
    const backup = parseBackup(JSON.stringify(await exportBackup(database)))
    await addItem('Extra', 'upkeep', database)
    await savePreferences({ colorScheme: 'light' }, database)
    await replaceFromBackup(backup, database)
    expect(await database.items.toArray()).toEqual(backup.items)
    expect(await readPreferences(database)).toEqual(backup.preferences)
  })

  it.each([
    ['unknown version', (value: Record<string, unknown>) => ({ ...value, version: 2 })],
    ['wrong shape', (value: Record<string, unknown>) => ({ ...value, items: 'bad' })],
    ['unknown field', (value: Record<string, unknown>) => ({ ...value, surprise: true })],
    ['invalid preference', (value: Record<string, unknown>) => ({ ...value, preferences: { colorScheme: 'pink' } })],
  ])('rejects %s without changing existing data', async (_, corrupt) => {
    await addItem('Keep me', 'fun', database)
    const backup = await exportBackup(database)
    const invalid = corrupt(backup)
    expect(() => parseBackup(JSON.stringify(invalid))).toThrow()
    await expect(replaceFromBackup(invalid, database)).rejects.toThrow()
    expect(await database.items.toArray()).toEqual(backup.items)
  })

  it('rejects duplicate IDs, malformed items, malformed JSON and oversized files', async () => {
    await addItem('Keep me', 'fun', database)
    const backup = await exportBackup(database)
    expect(() => parseBackup(JSON.stringify({ ...backup, items: [backup.items[0], backup.items[0]] }))).toThrow()
    for (const change of [{ title: ' ' }, { id: 'bad' }, { createdAt: 'yesterday' }, { completed: 'yes' }, { category: 'other' }]) {
      expect(() => parseBackup(JSON.stringify({ ...backup, items: [{ ...backup.items[0], ...change }] }))).toThrow()
    }
    expect(() => parseBackup('{')).toThrow()
    expect(() => parseBackup('x'.repeat(MAX_BACKUP_BYTES + 1))).toThrow('too large')
    expect(await database.items.toArray()).toEqual(backup.items)
  })

  it('rolls back both tables if a write fails after clearing them', async () => {
    await addItem('Keep me', 'upkeep', database)
    await savePreferences({ colorScheme: 'dark' }, database)
    const before = await exportBackup(database)
    const fail = () => { throw new Error('Simulated disk failure') }
    database.settings.hook('creating', fail)
    await expect(replaceFromBackup({ ...before, items: [], preferences: { colorScheme: 'light' } }, database)).rejects.toThrow()
    database.settings.hook('creating').unsubscribe(fail)
    expect(await database.items.toArray()).toEqual(before.items)
    expect(await readPreferences(database)).toEqual(before.preferences)
  })

  it('accepts an empty backup as an explicit replacement', async () => {
    await addItem('Old idea', 'fun', database)
    const backup = await exportBackup(database)
    await replaceFromBackup({ ...backup, items: [] }, database)
    expect(await database.items.count()).toBe(0)
  })
})
