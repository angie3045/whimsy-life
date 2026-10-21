import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { addItem, db, exportBackup } from './data/database'

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    offlineReady: [false, vi.fn()], needRefresh: [false, vi.fn()], updateServiceWorker: vi.fn(),
  }),
}))
beforeEach(async () => { await db.items.clear(); await db.settings.clear() })
afterEach(async () => { await db.items.clear(); await db.settings.clear() })

it('navigates all sections, validates an entry and keeps saved items across remounts', async () => {
  const user = userEvent.setup()
  const view = render(<App />)
  expect(await screen.findByRole('heading', { name: 'A day with a bit of both.' })).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Life Upkeep' }))
  expect(await screen.findByText('Give your to-dos a home')).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Add to Life Upkeep' }))
  expect(await screen.findByText('Enter a name between 1 and 200 characters.')).toBeVisible()
  await user.type(screen.getByLabelText('Something to take care of'), 'Water plants')
  await user.click(screen.getByRole('button', { name: 'Add to Life Upkeep' }))
  await user.click(await screen.findByRole('checkbox', { name: 'Water plants' }))
  await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Water plants' })).toBeChecked())
  await user.click(screen.getByRole('button', { name: 'Fun' }))
  expect(await screen.findByText('Your next little adventure starts here')).toBeVisible()
  view.unmount()
  render(<App />)
  await screen.findByRole('heading', { name: 'A day with a bit of both.' })
  await user.click(screen.getByRole('button', { name: 'Life Upkeep' }))
  expect(await screen.findByRole('checkbox', { name: 'Water plants' })).toBeChecked()
  await user.click(screen.getByRole('button', { name: 'Preferences' }))
  expect(await screen.findByRole('combobox', { name: 'Appearance' })).toBeVisible()
})

it('does not change data for invalid imports or cancellation, and replaces only after confirmation', async () => {
  await addItem('From backup', 'fun')
  const backup = await exportBackup()
  await db.items.clear()
  await addItem('Current idea', 'upkeep')
  const user = userEvent.setup()
  const { container } = render(<App />)
  await screen.findByRole('heading', { name: 'A day with a bit of both.' })
  await user.click(screen.getByRole('button', { name: 'Preferences' }))
  const input = container.querySelector('input[type="file"]') as HTMLInputElement
  await user.upload(input, new File(['{}'], 'invalid.json', { type: 'application/json' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('not a valid')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect((await db.items.toArray())[0].title).toBe('Current idea')
  const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' })
  await user.upload(input, file)
  const dialog = await screen.findByRole('dialog', { name: 'Replace saved data?' })
  expect((await db.items.toArray())[0].title).toBe('Current idea')
  await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
  expect((await db.items.toArray())[0].title).toBe('Current idea')
  await user.upload(input, file)
  await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Replace all data' }))
  expect(await screen.findByRole('status')).toHaveTextContent('Backup restored')
  expect(await db.items.toArray()).toEqual(backup.items)
})
