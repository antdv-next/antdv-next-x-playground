<script setup lang="ts">
import { version as xVersion } from '@antdv-next/x'
import { version as antdvVersion } from 'antdv-next'
import { ref, version as vueVersion } from 'vue'

const msg = ref('Hello World!')
</script>

<template>
  <h1>{{ msg }}</h1>
  <a-input v-model:value="msg" />

  <p>@antdv-next/x {{ xVersion }} + antdv-next {{ antdvVersion }}</p>
  <p>Vue {{ vueVersion }}</p>
</template>
