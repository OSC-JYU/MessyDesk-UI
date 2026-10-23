// Wording and small rules of the tag admin view.

const norm = (rid) => String(rid || '').replace('#', '')
export const sameRid = (a, b) => Boolean(a) && norm(a) === norm(b)

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`
const fileCount = (count) => plural(count, 'file')

// The creator column is only useful when someone other than the signed-in user made tags.
export function showCreators(items, myRid) {
  return (items || []).some((tag) => tag.creator && !sameRid(tag.creator.rid, myRid))
}

// Desks of the usage that are not the current one (all of them in the global view).
export function otherDesks(usage, deskRid) {
  return (usage?.desks || []).filter((desk) => !sameRid(desk.rid, deskRid))
}

const deskList = (desks) =>
  desks.map((desk) => `${desk.label || desk.rid} (${fileCount(desk.files || 0)})`).join(', ')

// The dialog text of an admin action from the tag's usage: { title, lines, confirmText, danger }.
// `action` is 'rename', 'remove' (from this desk) or 'delete' (everywhere).
export function actionText(action, tag, usage, deskRid) {
  const label = usage?.label || tag?.label
  const others = otherDesks(usage, deskRid)
  const here = (usage?.desks || []).find((desk) => sameRid(desk.rid, deskRid))
  const lines = []

  if (action === 'rename') {
    lines.push(`"${label}" is used on ${fileCount(usage?.files || 0)}.`)
    if (others.length) {
      lines.push(
        `Renaming changes the tag in every desk that has it, including: ${deskList(others)}.`,
      )
    } else {
      lines.push('The tag is renamed on all the files that have it.')
    }
    return { title: 'Rename tag', lines, confirmText: 'Rename', danger: false }
  }

  if (action === 'remove') {
    lines.push(
      `"${label}" is removed from this desk, and its links on ${fileCount(here?.files || 0)} of this desk are deleted.`,
    )
    lines.push(
      others.length
        ? `The tag stays in: ${deskList(others)}.`
        : 'No other desk has this tag, so the tag itself is deleted too.',
    )
    return { title: 'Remove tag from this desk', lines, confirmText: 'Remove', danger: true }
  }

  lines.push(
    `"${label}" and its links on ${fileCount(usage?.files || 0)} are removed from every desk${
      (usage?.desks || []).length ? `: ${deskList(usage.desks)}` : ''
    }.`,
  )
  lines.push('This cannot be undone.')
  return { title: 'Delete tag everywhere', lines, confirmText: 'Delete everywhere', danger: true }
}

// Why a tag type cannot be deleted ('' when it can): 'Tag' is used by machine tags, and a type
// with tags must be emptied first.
export function typeDeleteBlock(type) {
  if (type?.protected) return 'Used by machine tags'
  const count = Number(type?.count || 0)
  return count > 0 ? `Delete its ${plural(count, 'tag')} first` : ''
}

// The type a new tag starts with: 'Tag' when the user has it, otherwise the first type.
export function defaultType(types) {
  const list = types || []
  return (list.find((t) => t.type === 'Tag') || list[0])?.type || null
}
