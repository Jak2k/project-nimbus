<script setup lang="ts">
import QrCode from 'qrcode.vue'

defineProps<{
  url: string
}>()

const { height, width } = useWindowSize()

const size = computed(() => {
  const min = Math.min(height.value, width.value)
  return min * 0.5
})
</script>

<template>
  <div>
    <QrCode :value="url" :size="size" render-as="svg" :margin="1" />
  </div>
</template>
