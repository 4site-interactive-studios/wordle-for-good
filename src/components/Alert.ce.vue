<script setup lang="ts">
import { ref } from "vue";

defineExpose({ showAlert });

const isAlertActive = ref(false);
const alertMessage = ref("");

function showAlert(message: string, duration = 1000) {
  isAlertActive.value = true;
  alertMessage.value = message;
  if (!duration) return;

  setTimeout(() => {
    isAlertActive.value = false;
  }, duration);
}
</script>

<template>
  <Transition>
    <div v-if="isAlertActive" class="alert-container">
      <span class="alert">{{ alertMessage }}</span>
    </div>
  </Transition>
</template>
