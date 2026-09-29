import { reactive } from 'vue'
import {
  createFileThumbnail,
  createFileVersion,
  getDocInfo,
  getNodeFileBlob,
  revertFileVersion,
} from '@/api/files.js'
import { cropBlob, normalizeRotation, rotateBlob } from './imageEdit.js'
import { isImage, isReference } from './fileTypes.js'

// Quick edits in the file viewer. `display` is a getter for the display
// component instance (for its crop selection and text editor); `setFile`
// replaces the open file after an edit.
export function useQuickEdit(file, display, setFile) {
  const edit = reactive({
    rotation: 0,
    cropMode: false,
    hasCrop: false,
    textMode: false,
    busy: false,
    version: Date.now(), // cache-buster for the image preview
    message: null,
  })

  let messageTimer = null
  function say(text, type = 'success') {
    edit.message = { text, type }
    clearTimeout(messageTimer)
    messageTimer = setTimeout(() => (edit.message = null), 2600)
  }

  function reset() {
    Object.assign(edit, { rotation: 0, cropMode: false, hasCrop: false, textMode: false })
  }

  // The backend makes the thumbnail in the background; refresh the preview a
  // few times while it does.
  async function refreshPreview() {
    for (let i = 0; i < 6; i++) {
      edit.version = Date.now()
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  async function reload() {
    setFile(await getDocInfo(file()['@rid']))
  }

  async function run(action, done) {
    if (isReference(file())) {
      say('Reference files cannot be edited.', 'error')
      return
    }
    edit.busy = true
    try {
      await action()
      say(done)
    } catch {
      say('The quick edit failed.', 'error')
    } finally {
      edit.busy = false
    }
  }

  async function saveImage() {
    const crop = edit.hasCrop ? display()?.getCropSelection?.() : null
    const degrees = normalizeRotation(edit.rotation)
    if (!crop && !degrees) return say('Nothing to save.', 'error')
    await run(async () => {
      const rid = file()['@rid']
      const original = await getNodeFileBlob(rid)
      const edited = await rotateBlob(await cropBlob(original, crop), degrees)
      await createFileVersion(rid, {
        file: edited,
        filename: file().label || 'edited-image.png',
        operation: crop ? 'crop' : 'rotate',
        params: { degrees, crop },
      })
      await createFileThumbnail(rid)
      await reload()
      reset()
      await refreshPreview()
    }, 'Quick edit saved.')
  }

  const actions = {
    // Remakes the thumbnail and reloads the file.
    async refresh() {
      await createFileThumbnail(file()['@rid']).catch(() => {})
      edit.version = Date.now()
      await reload()
    },
    rotate(degrees) {
      if (edit.cropMode) return say('Finish or cancel the crop before rotating.', 'error')
      edit.rotation = normalizeRotation(edit.rotation + degrees)
    },
    'start-crop'() {
      if (normalizeRotation(edit.rotation))
        return say('Save or undo the rotation before cropping.', 'error')
      edit.cropMode = true
    },
    'clear-crop'() {
      display()?.clearCropSelection?.()
      edit.hasCrop = false
    },
    'cancel-crop'() {
      actions['clear-crop']()
      edit.cropMode = false
    },
    'start-text'() {
      if (isReference(file())) return say('Reference files cannot be edited.', 'error')
      display()?.startEdit?.()
      edit.textMode = true
    },
    'cancel-text'() {
      display()?.cancelEdit?.()
      edit.textMode = false
    },
    save() {
      if (isImage(file())) return saveImage()
      return run(async () => {
        await display()?.saveEdit?.()
        await reload()
        edit.textMode = false
      }, 'Quick edit saved.')
    },
    revert() {
      return run(async () => {
        const rid = file()['@rid']
        if (isImage(file())) {
          await revertFileVersion(rid)
          await createFileThumbnail(rid)
          await reload()
          reset()
          await refreshPreview()
        } else {
          await display()?.revertEdit?.()
          await reload()
          edit.textMode = false
        }
      }, 'Quick edit reverted.')
    },
  }

  return { edit, reset, act: (name, ...args) => actions[name]?.(...args) }
}
