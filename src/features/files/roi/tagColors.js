// Colours of tags for highlighting. Tags made before colours were assigned have a colour name of
// the tag type (for example "blue"), which is not a CSS colour for every name, so they get a
// colour from the palette, chosen from the label.
import { tagPalette } from '@/styles/vuetify-theme.js'

const CSS_COLOR = /^(#[0-9a-fA-F]{6}|rgb\([\d\s,.%]+\))$/

export function colorFromLabel(label) {
  let hash = 0
  for (const char of String(label ?? '')) hash = (hash * 31 + (char.codePointAt(0) || 0)) >>> 0
  return tagPalette[hash % tagPalette.length]
}

export function tagColor(tag) {
  return CSS_COLOR.test(String(tag?.color ?? '')) ? tag.color : colorFromLabel(tag?.label)
}
