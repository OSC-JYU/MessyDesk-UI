import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

vi.mock('@/api/session.js', () => ({
  saveSettings: vi.fn(async (patch) => ({
    theme: 'light',
    cookie: 'classic',
    motion: 'on',
    ...patch,
  })),
}))

import { saveSettings } from '@/api/session.js'
import { settings, setSettings, saveSetting } from '@/stores/settings.js'
import SettingsPage from '@/features/settings/SettingsPage.vue'

beforeEach(() => {
  saveSettings.mockClear()
  setSettings({ theme: 'light', cookie: 'classic', motion: 'on' })
})

describe('settings store', () => {
  it('takes only known settings and caches them', () => {
    setSettings({ theme: 'dark', cookie: 'neon', motion: 'off', font: 'comic' })
    expect({ ...settings }).toEqual({ theme: 'dark', cookie: 'classic', motion: 'off' })
    expect(JSON.parse(localStorage.getItem('md-settings'))).toEqual({
      theme: 'dark',
      cookie: 'classic',
      motion: 'off',
    })
  })

  it('saves a change and keeps what the backend returns', async () => {
    await saveSetting('cookie', 'matcha')
    expect(saveSettings).toHaveBeenCalledWith({ cookie: 'matcha' })
    expect(settings.cookie).toBe('matcha')
  })

  it('undoes the change when saving fails', async () => {
    saveSettings.mockRejectedValueOnce({ status: 500, message: 'down' })
    await expect(saveSetting('theme', 'dark')).rejects.toMatchObject({ status: 500 })
    expect(settings.theme).toBe('light')
  })
})

describe('SettingsPage', () => {
  it('shows the three themes and the cookie flavours with the current ones checked', () => {
    const page = mount(SettingsPage)
    const themes = page.findAll('input[name="theme"]')
    expect(themes.map((i) => i.attributes('value'))).toEqual([
      'light',
      'dark',
      'system',
      'navy',
      'navy-dark',
      'slate',
      'warm',
      'warm-dark',
    ])
    expect(themes[0].element.checked).toBe(true)
    expect(page.text()).toContain('Follow the system')
    const cookies = page.findAll('input[name="cookie"]')
    expect(cookies).toHaveLength(5)
    expect(page.find('[data-cookie="matcha"] .crunch-icon').exists()).toBe(true)
    // The system card previews both Fjord themes; the others preview themselves.
    expect(page.findAll('.settings-option')[2].findAll('[data-theme]')).toHaveLength(2)
    expect(page.text()).toContain('Reading room dark')
    for (const attr of ['light', 'dark', 'slate', 'warm', 'warm-dark']) {
      expect(page.find(`.settings-option [data-theme="${attr}"]`).exists()).toBe(true)
    }
  })

  it('saves a choice and says so', async () => {
    const page = mount(SettingsPage)
    await page.get('input[value="strawberry"]').trigger('change')
    await flushPromises()
    expect(saveSettings).toHaveBeenCalledWith({ cookie: 'strawberry' })
    expect(settings.cookie).toBe('strawberry')
    expect(page.get('[role="status"]').text()).toContain('Saved')
  })

  it('shows an error when the save fails', async () => {
    saveSettings.mockRejectedValueOnce({ status: 500, message: 'Database is down' })
    const page = mount(SettingsPage)
    await page.get('input[value="dark"]').trigger('change')
    await flushPromises()
    expect(page.text()).toContain('Database is down')
    expect(settings.theme).toBe('light')
  })
})

describe('motion setting', () => {
  it('offers animations on or off and saves the choice', async () => {
    const page = mount(SettingsPage)
    const motion = page.findAll('input[name="motion"]')
    expect(motion.map((i) => i.attributes('value'))).toEqual(['on', 'off'])
    await page.get('input[name="motion"][value="off"]').trigger('change')
    await flushPromises()
    expect(saveSettings).toHaveBeenCalledWith({ motion: 'off' })
    expect(settings.motion).toBe('off')
  })
})
