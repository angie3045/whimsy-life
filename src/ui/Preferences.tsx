import { useRef, useState } from 'react'
import { Alert, Button, FileButton, Group, Modal, Paper, Select, Stack, Text, Title } from '@mantine/core'
import { exportBackup, replaceFromBackup, savePreferences } from '../data/database'
import { MAX_BACKUP_BYTES, parseBackup, type Backup, type Preferences as PreferencesValue } from '../domain/backup'

export function Preferences({ preferences }: { preferences: PreferencesValue }) {
  const [pending, setPending] = useState<Backup | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const resetFile = useRef<() => void>(null)
  async function download() {
    setBusy(true)
    setError('')
    try {
      const backup = await exportBackup()
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `whimsy-backup-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
      setMessage('Backup prepared. Keep the downloaded JSON file somewhere safe.')
    } catch { setError('Could not export your data. Please try again.') }
    finally { setBusy(false) }
  }
  async function choose(file: File | null) {
    if (!file) return
    setError('')
    setMessage('')
    setBusy(true)
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('Backup is too large. Choose a file smaller than 5 MB.')
      setPending(parseBackup(await file.text()))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not read this backup.') }
    finally { resetFile.current?.(); setBusy(false) }
  }
  async function restore() {
    if (!pending) return
    setBusy(true)
    setError('')
    try {
      await replaceFromBackup(pending)
      setPending(null)
      setMessage('Backup restored. Your saved data is ready.')
    } catch {
      setPending(null)
      setError('Could not restore the backup. Your previous data is unchanged.')
    } finally { setBusy(false) }
  }
  return <Stack>
    <Title order={1}>Preferences</Title>
    <Paper withBorder p="lg" radius="lg">
      <Select label="Appearance" value={preferences.colorScheme} allowDeselect={false}
        data={[{ value: 'auto', label: 'Use device setting' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
        onChange={(value) => {
          if (value === 'auto' || value === 'light' || value === 'dark')
            void savePreferences({ colorScheme: value }).catch(() => setError('Could not save your preference.'))
        }} />
    </Paper>
    <Paper withBorder p="lg" radius="lg"><Stack>
      <Title order={2} size="h3">Your data, on your device</Title>
      <Text>Whimsy saves in this browser, with no account or cloud sync. Export a backup before clearing browser data, switching devices, or changing the app’s URL.</Text>
      <Text c="dimmed" size="sm">Browser storage can be cleared by your device. Private browsing is temporary. An export includes all items and preferences.</Text>
      <Group>
        <Button onClick={() => void download()} disabled={busy}>Export backup</Button>
        <FileButton onChange={(file) => void choose(file)} accept=".json,application/json" resetRef={resetFile}>
          {(props) => <Button {...props} variant="light" disabled={busy}>Import backup</Button>}
        </FileButton>
      </Group>
    </Stack></Paper>
    <Paper withBorder p="lg" radius="lg">
      <Title order={2} size="h3">Keep Whimsy close</Title>
      <Text mt="sm">Use Whimsy through its URL. When hosted securely, you can also add it to your home screen using your browser’s menu or share sheet. Visit once online before using it offline.</Text>
    </Paper>
    {message && <Alert color="teal" role="status">{message}</Alert>}
    {error && <Alert color="red" role="alert">{error}</Alert>}
    <Modal opened={pending !== null} onClose={() => { if (!busy) setPending(null) }}
      title="Replace saved data?" centered closeOnEscape={!busy} closeOnClickOutside={!busy} withCloseButton={!busy}>
      <Stack>
        <Text>This backup contains {pending?.items.length ?? 0} items. Restoring it replaces all current items and preferences in this browser, including changes in other open tabs. This cannot be undone. Export a backup first if you want to keep your current data.</Text>
        <Group justify="flex-end">
          <Button variant="default" disabled={busy} onClick={() => setPending(null)}>Cancel</Button>
          <Button color="red" loading={busy} onClick={() => void restore()}>Replace all data</Button>
        </Group>
      </Stack>
    </Modal>
  </Stack>
}
