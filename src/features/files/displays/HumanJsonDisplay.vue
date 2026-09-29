<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import DisplayFrame from './DisplayFrame.vue'
import { useFileContent } from '../useFileContent.js'
import { sourceImageOf } from '../sourceImage.js'
import { fileUrl } from '../fileUrls.js'

// Face detection results (human.json): the source image with numbered face
// boxes, and age, gender and emotions per face.
const props = defineProps({ file: { type: Object, required: true } })
const { state } = useFileContent(() => props.file)
const faces = computed(() => state.content?.face || [])
const canvas = ref(null)
const imageSrc = ref('')

function draw() {
  const el = canvas.value
  if (!el || !imageSrc.value) return
  const ctx = el.getContext('2d')
  const image = new Image()
  image.onload = () => {
    const scale = Math.min(el.width / image.width, el.height / image.height)
    const width = image.width * scale
    const height = image.height * scale
    const x = (el.width - width) / 2
    const y = (el.height - height) / 2
    ctx.clearRect(0, 0, el.width, el.height)
    ctx.drawImage(image, x, y, width, height)
    const accent = getComputedStyle(el).getPropertyValue('--md-color-warning').trim() || 'orange'
    faces.value.forEach((face, index) => {
      const [bx, by, bw, bh] = face.boxRaw || []
      ctx.lineWidth = 2
      ctx.strokeStyle = accent
      ctx.strokeRect(x + bx * width, y + by * height, bw * width, bh * height)
      ctx.fillStyle = accent
      ctx.fillRect(x + bx * width, y + by * height, 20, 20)
      ctx.fillStyle = 'white'
      ctx.font = '16px sans-serif'
      ctx.fillText(String(index), x + bx * width + 5, y + by * height + 16)
    })
  }
  image.src = imageSrc.value
}

async function loadSource() {
  const source = await sourceImageOf(props.file).catch(() => null)
  imageSrc.value = source ? fileUrl(source['@rid']) : ''
  draw()
}

watch(() => props.file['@rid'], loadSource)
watch(faces, draw)
onMounted(loadSource)
</script>

<template>
  <div class="human">
    <canvas ref="canvas" width="1000" height="800" class="human__canvas" />
    <DisplayFrame :loading="state.loading" :error="state.error">
      <p class="human__count">{{ faces.length }} faces</p>
      <v-card v-for="(face, index) in faces" :key="index" rounded="lg" flat class="human__face">
        <v-card-title>Face {{ index }}</v-card-title>
        <v-card-text>
          Gender: {{ face.gender }} · Age: {{ face.age }}
          <div v-for="emotion in face.emotion" :key="emotion.emotion">
            {{ emotion.emotion }}: {{ emotion.score }}
          </div>
        </v-card-text>
      </v-card>
    </DisplayFrame>
  </div>
</template>

<style scoped>
.human {
  display: grid;
  grid-template-columns: 2fr 1fr;
  height: 100%;
}

.human__canvas {
  width: 100%;
  height: auto;
  background: var(--md-color-bg);
}

.human__count {
  font-weight: var(--md-font-weight-bold);
}

.human__face {
  margin-block-end: var(--md-space-3);
  border: 1px solid var(--md-color-border);
}
</style>
