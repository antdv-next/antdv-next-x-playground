<script setup>
import { theme } from 'antdv-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import App from './App.vue'
import { setupAntdvNextX } from './x.js'
setupAntdvNextX()

const { darkAlgorithm, defaultAlgorithm } = theme
const isDark = ref(document.documentElement.classList.contains('dark'))

const themeConfig = computed(() => ({
  algorithm: isDark.value ? darkAlgorithm : defaultAlgorithm,
}))

let observer
onMounted(() => {
  observer = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('dark')
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
})
onUnmounted(() => observer?.disconnect())
</script>

<template>
  <a-config-provider :theme="themeConfig">
    <ax-provider :theme="themeConfig">
      <App />
    </ax-provider>
  </a-config-provider>
</template>
