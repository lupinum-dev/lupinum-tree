import { renderToString } from '@vue/server-renderer'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import Sidebar from '../src/components/ui/sidebar/Sidebar.vue'
import SidebarProvider from '../src/components/ui/sidebar/SidebarProvider.vue'

const SidebarHarness = defineComponent({
  setup() {
    return () =>
      h(
        SidebarProvider,
        { defaultOpen: true },
        {
          default: () => h(Sidebar, null, { default: () => 'Navigation' }),
        },
      )
  },
})

describe('sidebar hydration', () => {
  afterEach(() => {
    document.body.replaceChildren()
    vi.restoreAllMocks()
  })

  it('hydrates desktop server markup before adapting to a mobile viewport', async () => {
    const serverHtml = await renderToString(createSSRApp(SidebarHarness))
    document.body.innerHTML = `<div id="app">${serverHtml}</div>`
    const mobileMediaQuery: MediaQueryList = {
      matches: true,
      media: '(max-width: 768px)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
    vi.spyOn(window, 'matchMedia').mockReturnValue(mobileMediaQuery)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const app = createSSRApp(SidebarHarness)
    app.mount('#app')
    await nextTick()

    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining('Hydration completed but contains mismatches'),
    )
    app.unmount()
  })
})
