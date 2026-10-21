import { useState } from 'react'
import { Alert, Button, Checkbox, Paper, Stack, Text, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { addItem, setCompleted } from '../data/database'
import type { Category, Item } from '../domain/backup'

export function Collection({ category, items }: { category: Category; items: Item[] }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const form = useForm({
    initialValues: { title: '' },
    validate: { title: (value) => value.trim().length < 1 || value.trim().length > 200
      ? 'Enter a name between 1 and 200 characters.' : null },
  })
  const isFun = category === 'fun'
  async function submit({ title }: { title: string }) {
    setBusy(true)
    setError('')
    try { await addItem(title, category); form.reset() }
    catch { setError('Could not save. Check that browser storage is available and try again.') }
    finally { setBusy(false) }
  }
  return <Stack>
    <div><Title order={1}>{isFun ? 'Fun' : 'Life Upkeep'}</Title>
      <Text c="dimmed">{isFun ? 'Make room for things you look forward to.' : 'A little care for your home and everyday life.'}</Text></div>
    <Paper withBorder p="lg" radius="lg">
      <form onSubmit={form.onSubmit(submit)}><Stack>
        <TextInput label={isFun ? 'Something to enjoy' : 'Something to take care of'}
          placeholder={isFun ? 'Try pottery, a recommended show…' : 'Fix a shelf, water the plants…'}
          maxLength={200} {...form.getInputProps('title')} />
        <Button type="submit" loading={busy} style={{ alignSelf: 'flex-start' }}>Add to {isFun ? 'Fun' : 'Life Upkeep'}</Button>
      </Stack></form>
    </Paper>
    {error && <Alert color="red" role="alert">{error}</Alert>}
    {items.length === 0
      ? <Paper withBorder p="xl" radius="lg"><Title order={2} size="h3">{isFun ? 'Your next little adventure starts here' : 'Give your to-dos a home'}</Title>
        <Text c="dimmed" mt="xs">Add your first idea above. It will stay saved in this browser.</Text></Paper>
      : <Stack gap="sm">{items.map((item) =>
        <Paper key={item.id} withBorder p="md" radius="md">
          <Checkbox checked={item.completed} label={item.title}
            styles={{ label: { overflowWrap: 'anywhere', textDecoration: item.completed ? 'line-through' : undefined } }}
            onChange={(event) => {
              setError('')
              void setCompleted(item.id, event.currentTarget.checked)
                .catch(() => setError('Could not save this change. Please try again.'))
            }} />
        </Paper>)}</Stack>}
  </Stack>
}
