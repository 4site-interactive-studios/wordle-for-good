<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: "Wordle For Good",
  },
});
</script>
<template>
  <header>{{ title }}</header>
</template>
