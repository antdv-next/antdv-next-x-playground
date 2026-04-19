<script setup lang="ts">
import { version as xVersion } from '@antdv-next/x'
import { ref } from 'vue'

const inputValue = ref('')
const latestMessage = ref('')

const handleChange = (value: string) => {
  inputValue.value = value
}

const handleSubmit = (message: string) => {
  latestMessage.value = message
  inputValue.value = ''
}
</script>

<template>
  <a-flex vertical gap="middle">
    <a-typography-title :level="3" :style="{ marginBottom: 0 }">
      antdv-next/x Playground
    </a-typography-title>
    <a-typography-text type="secondary">
      当前版本：@antdv-next/x {{ xVersion }}
    </a-typography-text>

    <ax-sender
      :value="inputValue"
      placeholder="试试输入内容并发送"
      @change="handleChange"
      @submit="handleSubmit"
    />

    <a-alert
      v-if="latestMessage"
      type="success"
      show-icon
      :message="`最近一次发送：${latestMessage}`"
    />
  </a-flex>
</template>
