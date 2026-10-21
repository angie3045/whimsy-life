import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Alert, AppShell, Badge, Button, Container, Group, Loader, MantineProvider, Paper, SimpleGrid, Stack, Text, Title, createTheme } from '@mantine/core'
import { db, readPreferences } from './data/database'
import { Collection } from './ui/Collection'
import { Preferences } from './ui/Preferences'
import { PwaStatus } from './ui/PwaStatus'

const pages = ['Today', 'Life Upkeep', 'Fun', 'Preferences'] as const
type Page = typeof pages[number]
const theme = createTheme({ primaryColor: 'teal', defaultRadius: 'md' })

export default function App() {
  const [page, setPage] = useState<Page>('Today')
  const data = useLiveQuery(async () => {
    try {
      return { items: await db.items.orderBy('createdAt').reverse().toArray(), preferences: await readPreferences(), error: false }
    } catch { return { items: [], preferences: { colorScheme: 'auto' as const }, error: true } }
  }, [])

  return <MantineProvider theme={theme} defaultColorScheme="auto" forceColorScheme={data?.preferences.colorScheme === 'auto' ? undefined : data?.preferences.colorScheme}>
    <AppShell header={{ height: 76 }} padding="md">
      <AppShell.Header>
        <Container size="md" h="100%">
          <Group h="100%" justify="space-between">
            <div><Text fw={800} size="xl">whimsy<span className="brand-dot">.</span></Text><Text size="xs" c="dimmed">A little care. A little joy.</Text></div>
            <Badge variant="light">On your device</Badge>
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="md" className="main-container">
          <Stack gap="xl">
            <nav aria-label="Main navigation" className="navigation">
              {pages.map((name) => <Button key={name} variant={page === name ? 'filled' : 'subtle'}
                aria-current={page === name ? 'page' : undefined} onClick={() => setPage(name)}>{name}</Button>)}
            </nav>
            {!data ? <Group role="status"><Loader size="sm" /><Text>Opening your saved space…</Text></Group>
              : data.error ? <Alert color="red" title="Storage is unavailable" role="alert">Whimsy could not open your saved data. Enable browser storage and reload. Existing data has not been replaced.</Alert>
              : page === 'Preferences' ? <Preferences preferences={data.preferences} />
              : page === 'Today' ? <Stack gap="lg">
                <div><Text c="teal" fw={700} size="sm" mb="xs">MAKE A LITTLE ROOM</Text><Title order={1}>A day with a bit of both.</Title>
                  <Text c="dimmed" mt="sm" size="lg">Something to keep life moving. Something just for you.</Text></div>
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  {(['upkeep', 'fun'] as const).map((category) => {
                    const count = data.items.filter((item) => item.category === category && !item.completed).length
                    const name = category === 'fun' ? 'Fun' : 'Life Upkeep'
                    return <Paper key={category} withBorder p="xl" radius="lg"><Stack align="flex-start">
                      <Badge color={category === 'fun' ? 'grape' : 'teal'} variant="light">{name}</Badge>
                      <Title order={2} size="h3">{count ? `${count} ${count === 1 ? 'idea' : 'ideas'} waiting for you` : category === 'fun' ? 'What would feel good?' : 'What needs a little care?'}</Title>
                      <Text c="dimmed">{category === 'fun' ? 'Collect hobbies, places, shows, and small adventures.' : 'Capture chores, house projects, and everyday to-dos.'}</Text>
                      <Button variant="light" onClick={() => setPage(name)}>Explore {name}</Button>
                    </Stack></Paper>
                  })}
                </SimpleGrid>
                <Text size="sm" c="dimmed">Start by collecting a few ideas. Your daily planning space will grow from here.</Text>
              </Stack>
              : <Collection key={page} category={page === 'Fun' ? 'fun' : 'upkeep'}
                items={data.items.filter((item) => item.category === (page === 'Fun' ? 'fun' : 'upkeep'))} />}
            <PwaStatus />
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  </MantineProvider>
}
