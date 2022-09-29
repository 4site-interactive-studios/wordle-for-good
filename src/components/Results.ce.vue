<script setup lang="ts">
const emit = defineEmits(["share", "close"]);

function share() {
  emit("share");
}

function close() {
  emit("close");
}
</script>

<template>
  <div id="results">
    <div @click="close" class="backdrop">
      <div @click.stop class="wrapper">
        <section>
          <div>THANK YOU PAGE (WIP)</div>
        </section>
        <button @click.stop="share">Share</button>
      </div>
    </div>
  </div>
</template>
