import { h } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import NodeShell from './NodeShell.vue'

// Nodes with little content, built on NodeShell.

const text = (value) => (value ? h('pre', value) : null)
const icons = (...names) =>
  h(
    'div',
    { class: 'gnode-icons' },
    names.map((icon) => h('i', { class: `mdi ${icon}`, 'aria-hidden': 'true' })),
  )

function node(render) {
  return {
    props: { data: { type: Object, required: true } },
    setup(props) {
      return () => render(props.data)
    },
  }
}

// Regions of interest drawn on images of a set.
export const RoiSetNode = node((data) =>
  h(NodeShell, { label: data.label, kind: 'roi', icon: 'mdi-selection', crunchable: true }, () => [
    icons('mdi-hand-back-right-outline', 'mdi-shape-rectangle-plus'),
    text(data.description),
  ]),
)

// An outside source (Nextcloud folder, DSpace).
export const SourceNode = node((data) =>
  h(
    NodeShell,
    {
      label: `${data._type || data.type}: ${data.label}`,
      kind: 'source',
      icon: 'mdi-database',
      crunchable: true,
    },
    () => [
      data.metadata ? h('p', `${data.metadata.size} MB in ${data.metadata.count} files`) : null,
      ...(data.paths || []).map((path) => h('img', { src: path, alt: '', class: 'gnode-thumb' })),
      text(data.description),
    ],
  ),
)

export const ZipNode = node((data) =>
  h(
    NodeShell,
    { label: data.label, kind: 'zip', icon: 'mdi-folder-zip-outline', crunchable: true },
    () => [
      icons('mdi-folder-zip-outline'),
      text(data.description),
      data.metadata ? h('p', `${data.metadata.size} MB`) : null,
    ],
  ),
)

// The search index made from a set.
export const SearchSetNode = node((data) =>
  h('div', { class: 'search-set-node', title: data.label || 'Search index' }, [
    h('i', { class: 'mdi mdi-magnify', 'aria-hidden': 'true' }),
    h(Handle, { id: 'a', type: 'target', position: Position.Left }),
    h(Handle, { id: 'b', type: 'source', position: Position.Right }),
  ]),
)
