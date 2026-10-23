import { describe, it, expect } from 'vitest'
import {
  EMPTY_DESK_ID,
  isThumbnailUpdate,
  layoutLeftToRight,
  mergeNodeFields,
  nodesFromAddEvent,
  toFlowGraph,
  toFlowNode,
} from '@/features/project/graphModel.js'
import {
  isImageLike,
  isRoiJson,
  isSetLike,
  opensAsFile,
  relatives,
  roiSourceFromPath,
  roiSourceNode,
} from '@/features/project/nodeKinds.js'
import { nodeTypeFor } from '@/features/project/nodes/index.js'

describe('graphModel', () => {
  it('turns API nodes into Vue Flow nodes', () => {
    const node = toFlowNode({
      data: {
        id: '#148:0',
        name: 'Search index',
        type: 'SetProcess',
        _type: 'SetProcess',
        service: 'Solr',
        image: '/api/x',
      },
    })
    expect(node).toMatchObject({ id: '#148:0', type: 'setprocess' })
    expect(node.data).toMatchObject({
      label: 'Search index',
      type: 'setprocess',
      _type: 'setprocess',
      service: 'Solr',
      image: '/api/x',
    })
  })

  it('names search sets and keeps positions', () => {
    const node = toFlowNode({
      data: { id: '#1', type: 'search', _type: 'Set' },
      position: { x: 1, y: 2 },
    })
    expect(node).toMatchObject({ type: 'search-set', position: { x: 1, y: 2 } })
    expect(node.data.label).toBe('Search Index')
  })

  it('draws unknown file types with the file node', () => {
    expect(toFlowNode({ data: { id: '#1', type: 'weird.json', name: 'x' } }).type).toBe('file')
    expect(toFlowNode({ data: { id: '#1', type: 'text', name: 'x' } }).type).toBe('text')
    expect(nodeTypeFor('roi-set')).toBe('roi-set')
  })

  it('shows an empty-desk node for an empty desk', () => {
    expect(toFlowGraph({ nodes: [], edges: [] }).nodes[0].id).toBe(EMPTY_DESK_ID)
  })

  it('lays the graph out left to right', () => {
    const nodes = layoutLeftToRight(
      [{ id: 'a' }, { id: 'b' }],
      [{ id: 'e', source: 'a', target: 'b' }],
    )
    expect(nodes[1].position.x).toBeGreaterThan(nodes[0].position.x)
  })

  it('merges only the fields an update may change', () => {
    const target = { label: 'old', secret: 1 }
    expect(mergeNodeFields(target, { label: 'new', secret: 2 })).toBe(true)
    expect(target).toEqual({ label: 'new', secret: 1 })
    expect(mergeNodeFields(target, { other: 1 })).toBe(false)
    expect(isThumbnailUpdate({ image: 'x' })).toBe(true)
    expect(isThumbnailUpdate({ label: 'x' })).toBe(false)
  })

  it('builds the nodes and edges of an "add" event', () => {
    const added = nodesFromAddEvent(
      {
        type: 'process',
        node: { '@rid': '#5:0', '@type': 'SetProcess', label: 'OCR' },
        input: '#1:0',
        output: { '@rid': '#6:0', '@type': 'Set', label: 'OCR output' },
      },
      () => ({ x: 0, y: 0 }),
    )
    expect(added.id).toBe('#5:0')
    expect(added.nodes.map((n) => [n.id, n.type])).toEqual([
      ['#5:0', 'process'],
      ['#6:0', 'set'],
    ])
    expect(added.nodes[0].data.status).toBe('waiting')
    expect(added.nodes[1].data.status).toBe('running')
    expect(added.edges.map((e) => [e.source, e.target])).toEqual([
      ['#1:0', '#5:0'],
      ['#5:0', '#6:0'],
    ])
  })
})

describe('nodeKinds', () => {
  const image = { id: 'i', type: 'image', data: { '@type': 'File', type: 'image' } }
  const text = { id: 't', type: 'text', data: { '@type': 'File', type: 'text' } }
  const set = { id: 's', type: 'set', data: { '@type': 'Set', type: 'set' } }
  const roi = { id: 'r', type: 'roi-set', data: { type: 'roi-set' } }
  const process = { id: 'p', type: 'process', data: { type: 'process' } }

  it('classifies nodes', () => {
    expect(isImageLike(image)).toBe(true)
    expect(isImageLike({ data: { '@type': 'File', label: 'scan.TIF' } })).toBe(true)
    expect(isSetLike(set)).toBe(true)
    expect(isRoiJson({ type: 'roi.json' })).toBe(true)
    expect(opensAsFile(text)).toBe(true)
    expect(opensAsFile(set)).toBe(false)
    expect(opensAsFile({ type: 'zip', data: { type: 'zip' } })).toBe(false)
  })

  it('finds what an ROI set was made from', () => {
    const parents = { r: [process], p: [set], s: [image] }
    const incomers = (n) => parents[n.id] || []
    expect(roiSourceNode(roi, incomers)).toBe(image)
    expect(roiSourceNode(roi, (n) => ({ r: [process], p: [set] })[n.id] || [])).toBe(set)
  })

  it('finds the source image in an ROI path', () => {
    expect(
      roiSourceFromPath([
        { '@rid': '#1', '@type': 'File', type: 'roi.json' },
        { '@rid': '#2', '@type': 'File', type: 'text' },
        { '@rid': '#3', '@type': 'File', type: 'image' },
      ]),
    ).toBe('#3')
    expect(roiSourceFromPath([])).toBeNull()
  })

  it('collects all relatives in one direction', () => {
    const children = { a: [{ id: 'b' }], b: [{ id: 'c' }, { id: 'a' }] }
    expect(relatives({ id: 'a' }, (n) => children[n.id] || []).map((n) => n.id)).toEqual([
      'b',
      'c',
      'a',
    ])
  })
})
