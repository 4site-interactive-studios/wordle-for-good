<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: "Wordle For Good",
  },
});
</script>
<template>
  <header>
    <h1>{{ title }}</h1>
  </header>
</template>
