<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: "Wordle For Good",
  },
});
const emit = defineEmits(["openHelp"]);
</script>
<template>
  <header>
    <h1>{{ title }}</h1>
    <a @click="emit('openHelp')" class="helpButton">
      <span>?</span>
    </a>
  </header>
</template>
