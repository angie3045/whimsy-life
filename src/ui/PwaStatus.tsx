import { Alert, Button, Group, Text } from '@mantine/core'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function PwaStatus() {
  const { offlineReady: [offlineReady, setOfflineReady], needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW()
  if (!offlineReady && !needRefresh) return null
  return <Alert title={needRefresh ? 'An update is ready' : 'Ready for offline use'} role="status">
    <Text size="sm">{needRefresh ? 'Finish any unsaved entry before reloading.' : 'Whimsy can now open without a connection on this device.'}</Text>
    <Group mt="sm">
      {needRefresh && <Button size="xs" onClick={() => void updateServiceWorker(true)}>Reload to update</Button>}
      <Button size="xs" variant="subtle" onClick={() => { setOfflineReady(false); setNeedRefresh(false) }}>Dismiss</Button>
    </Group>
  </Alert>
}
