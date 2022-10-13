<script setup lang="ts">
import { ref } from "vue";
const props = defineProps({
  title: {
    type: String,
  },
});
defineExpose({
  nextTile,
  getActiveTiles,
  getResults,
  getShareTiles,
  shakeTiles,
  danceTiles,
  getRemainingTiles,
});

const gameboard = ref();
const DANCE_ANIMATION_DURATION = 500;

function nextTile() {
  return gameboard.value.querySelector(":not([data-letter])");
}

function getActiveTiles() {
  return gameboard.value.querySelectorAll("[data-state='active']");
}

function getRemainingTiles() {
  return gameboard.value.querySelectorAll(":not([data-letter])");
}

function getShareTiles() {
  const tiles = gameboard.value.querySelectorAll(
    ".tile[data-state='wrong'], .tile[data-state='wrong-location'], .tile[data-state='correct']"
  );
  const resultsArray = [];

  for (const tile of tiles) {
    if (tile.dataset.state === "wrong") resultsArray.push("⬛️");
    if (tile.dataset.state === "wrong-location") resultsArray.push("🟨");
    if (tile.dataset.state === "correct") resultsArray.push("🟩");
  }

  let results = "";

  for (let i = 0; i < resultsArray.length / 5; i++) {
    results += `${resultsArray[0 + i * 5]}${resultsArray[1 + i * 5]}${
      resultsArray[2 + i * 5]
    }${resultsArray[3 + i * 5]}${resultsArray[4 + i * 5]}
`;
  }
  return results;
}

function getResults() {
  const tiles = gameboard.value.querySelectorAll(
    ".tile[data-state='wrong'], .tile[data-state='wrong-location'], .tile[data-state='correct']"
  );

  const title = props.title || "Wordle For Good";

  const resultsArray = [];

  for (const tile of tiles) {
    if (tile.dataset.state === "wrong") resultsArray.push("⬛️");
    if (tile.dataset.state === "wrong-location") resultsArray.push("🟨");
    if (tile.dataset.state === "correct") resultsArray.push("🟩");
  }

  let results = "";

  for (let i = 0; i < resultsArray.length / 5; i++) {
    results += `${resultsArray[0 + i * 5]}${resultsArray[1 + i * 5]}${
      resultsArray[2 + i * 5]
    }${resultsArray[3 + i * 5]}${resultsArray[4 + i * 5]}
`;
  }

  let lose = false;

  for (const tile of resultsArray.slice(-5)) {
    if (tile !== "🟩") lose = true;
  }

  return `${title} ${lose ? "X" : resultsArray.length / 5}/6

${results}
${window.location.href}
`.trim();
}

function shakeTiles(tiles: HTMLDivElement[]) {
  tiles.forEach((tile) => {
    tile.classList.add("shake");
  });
}

function danceTiles(tiles: HTMLDivElement[]) {
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance");
    }, (index * DANCE_ANIMATION_DURATION) / 5);
  });
}

function stopAnimation(e: AnimationEvent) {
  const tile = e.target as HTMLDivElement;
  tile.classList.remove("shake");
  tile.classList.remove("dance");
}
</script>

<template>
  <div id="gameboard">
    <div class="wrapper">
      <div ref="gameboard" class="gameboard">
        <div
          v-for="tile in 30"
          @animationend="stopAnimation"
          class="tile"
          :key="tile"
        ></div>
      </div>
    </div>
  </div>
</template>
