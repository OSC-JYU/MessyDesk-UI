import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { parsePageXml, pageXmlText } from '@/features/files/pageXml.js'

const PAGE = `<?xml version='1.0' encoding='UTF-8'?>
<PcGts xmlns="http://schema.primaresearch.org/PAGE/gts/pagecontent/2013-07-15">
  <Metadata><Creator>Kansallisarkisto</Creator></Metadata>
  <Page imageFilename="kirja.jpg" imageWidth="1000" imageHeight="2000">
    <TextRegion id="r0"><Coords points="0,0 900,0 900,300 0,300"/>
      <TextLine id="r0l0"><Coords points="10,20 410,20 410,60 10,60"/>
        <TextEquiv><Unicode>Herra &amp; rouva</Unicode></TextEquiv></TextLine>
      <TextLine id="r0l1"><Coords points="10,80 300,80 300,120 10,120"/>
        <TextEquiv><Unicode>toinen¬</Unicode></TextEquiv></TextLine>
      <TextEquiv><Unicode>region text is not a line</Unicode></TextEquiv>
    </TextRegion>
    <TextRegion id="r1"><Coords points="0,400 900,400 900,500 0,500"/></TextRegion>
    <TextRegion id="r2"><Coords points="0,600 900,600 900,700 0,700"/>
      <TextLine id="r2l0"><Coords points="5,610 600,610 600,650 5,650"/>
        <TextEquiv><Unicode>Andra regionen</Unicode></TextEquiv></TextLine>
    </TextRegion>
  </Page>
</PcGts>`

const EMPTY = `<?xml version='1.0' encoding='UTF-8'?>
<PcGts xmlns="http://schema.primaresearch.org/PAGE/gts/pagecontent/2013-07-15">
  <Page imageFilename="blank.png" imageWidth="800" imageHeight="1000"/>
</PcGts>`

describe('parsePageXml', () => {
  it('reads the page size, the regions with lines and each line in order', () => {
    const page = parsePageXml(PAGE)
    expect(page).toMatchObject({ width: 1000, height: 2000, imageFilename: 'kirja.jpg' })
    expect(page.regions.map((r) => r.id)).toEqual(['r0', 'r2'])
    expect(page.lines.map((l) => l.text)).toEqual(['Herra & rouva', 'toinen¬', 'Andra regionen'])
    expect(page.lines[0].box).toEqual({ x: 10, y: 20, width: 400, height: 40 })
    expect(page.lines[0].points).toBe('10,20 410,20 410,60 10,60')
    expect(pageXmlText(page)).toBe('Herra & rouva\ntoinen¬\nAndra regionen')
  })

  it('gives an empty page for a page without lines and for bad input', () => {
    expect(parsePageXml(EMPTY)).toMatchObject({ width: 800, height: 1000, lines: [] })
    expect(parsePageXml('<not xml').lines).toEqual([])
    expect(parsePageXml(null).lines).toEqual([])
  })
})

vi.mock('@/api/files.js', () => ({ getNodeFile: vi.fn() }))
vi.mock('@/api/projects.js', () => ({ getFileAncestors: vi.fn() }))

const { getNodeFile } = await import('@/api/files.js')
const { getFileAncestors } = await import('@/api/projects.js')
const { default: PageXmlDisplay } = await import('@/features/files/displays/PageXmlDisplay.vue')

const file = { '@rid': '#90:1', type: 'page.xml', extension: 'xml', label: 'kirja.page.xml' }

describe('PageXmlDisplay', () => {
  it('shows the text by default, one line per text line', async () => {
    getNodeFile.mockResolvedValue(PAGE)
    getFileAncestors.mockResolvedValue([{ type: 'image', path: 'data/db/p/kirja.jpg' }])
    const wrapper = mount(PageXmlDisplay, { props: { file } })
    await flushPromises()
    expect(wrapper.findAll('.page-xml__line').map((l) => l.text())).toEqual([
      'Herra & rouva',
      'toinen¬',
      'Andra regionen',
    ])
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('3 text lines')
  })

  it('switches to the image with the text drawn on it', async () => {
    getNodeFile.mockResolvedValue(PAGE)
    getFileAncestors.mockResolvedValue([{ type: 'image', path: 'data/db/p/kirja.jpg' }])
    const wrapper = mount(PageXmlDisplay, { props: { file } })
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('On image'))
      .trigger('click')
    expect(wrapper.find('img').exists()).toBe(true)
    // the overlay is drawn once the image has a size
    wrapper.vm.$.setupState.image.overlay = { width: 500, height: 1000 }
    await flushPromises()
    const texts = wrapper.findAll('svg text')
    expect(texts.map((t) => t.text())).toEqual(['Herra & rouva', 'toinen¬', 'Andra regionen'])
    expect(texts[0].attributes('textLength')).toBe('400')
    expect(wrapper.find('svg').attributes('viewBox')).toBe('0 0 1000 2000')
  })

  it('says so when the page has no text, and offers no image view without a source image', async () => {
    getNodeFile.mockResolvedValue(EMPTY)
    getFileAncestors.mockResolvedValue([])
    const wrapper = mount(PageXmlDisplay, { props: { file } })
    await flushPromises()
    expect(wrapper.text()).toContain('No text lines were found on the page.')
    const imageButton = wrapper.findAll('button').find((b) => b.text().includes('On image'))
    expect(imageButton.attributes('disabled')).toBeDefined()
  })
})
