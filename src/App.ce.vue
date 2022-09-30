<script setup lang="ts">
import Keyboard from "./components/Keyboard.ce.vue";
import Gameboard from "./components/Gameboard.ce.vue";
import Header from "./components/Header.ce.vue";
import Alert from "./components/Alert.ce.vue";
import Results from "./components/Results.ce.vue";
import { onBeforeMount, onMounted, onUnmounted, ref } from "vue";
import { dictionary } from "./data/index";
import { pSBC } from "./utils/pSBC";

const props = defineProps({
  keyboardEvents: {
    type: String,
    default: "true",
  },
  title: {
    type: String,
  },
  word: {
    type: String,
    required: true,
  },
  bgColor: {
    type: String,
    default: "#333",
  },
  textColor: {
    type: String,
    default: "#fff",
  },
  tileBorderColor: {
    type: String,
    default: "#888",
  },
  tileBgColor: {
    type: String,
    default: "transparent",
  },
  tileTextColor: {
    type: String,
    default: "#fff",
  },
  keyBgColor: {
    type: String,
    default: "#818283",
  },
  keyTextColor: {
    type: String,
    default: "#fff",
  },
  keyTextSize: {
    type: String,
    default: "1.3rem",
  },
  height: {
    type: String,
    default: "690px",
  },
});

const decodeWord = (word: string) => {
  return word
    .split("-")
    .map((letter) => {
      if (letter === " ") return " ";
      return String.fromCharCode(parseInt(letter));
    })
    .join("");
};

const gameboard = ref();
const keyboard = ref();
const alert = ref();
const targetWord = ref(decodeWord(props.word));
const showResults = ref(false);

const keyboardEvents = props.keyboardEvents === "true";

const bgColor = ref(props.bgColor);
const textColor = ref(props.textColor);
const height = ref(props.height);

const tileBorderColor = ref(props.tileBorderColor);
// const tileBorderActiveColor = ref(pSBC(0.2, tileBorderColor.value));
const tileBorderActiveColor = ref(
  pSBC(0.5, tileBorderColor.value, bgColor.value)
);
const tileBgColor = ref(props.tileBgColor);
const tileBgActiveColor = ref(pSBC(-0.5, tileBgColor.value, bgColor.value));
const tileTextColor = ref(props.tileTextColor);

const keyBgColor = ref(props.keyBgColor);
const keyTextColor = ref(props.keyTextColor);
const keyTextSize = ref(props.keyTextSize);

const WORD_LENGTH = 5;
const FLIP_ANIMATION_DURATION = 500;

function handleKeyPress(e: KeyboardEvent) {
  if (e.key === "Enter") return submitGuess();
  if (e.key === "Backspace") return deleteKey();
  if (e.key.match(/^[a-zA-Z]$/)) return pressKey(e.key);
}

function pressKey(key: string) {
  if (gameboard.value.getActiveTiles().length >= WORD_LENGTH) return;

  const nextTile = gameboard.value.nextTile();
  nextTile.dataset.letter = key.toLowerCase();
  nextTile.textContent = key.toUpperCase();
  nextTile.dataset.state = "active";
}

async function submitGuess() {
  const activeTiles = [...gameboard.value.getActiveTiles()];
  if (activeTiles.length !== WORD_LENGTH) {
    alert.value.showAlert("Not enough letters");
    return gameboard.value.shakeTiles(activeTiles);
  }

  const guess = activeTiles.reduce((word, tile) => {
    return word + tile.dataset.letter;
  }, "");

  if (!dictionary.includes(guess)) {
    alert.value.showAlert("Not in word list");
    return gameboard.value.shakeTiles(activeTiles);
  }

  stopInteraction();
  activeTiles.forEach((...params: [HTMLDivElement, number, HTMLDivElement[]]) =>
    flipTile(...params, guess)
  );
}

function deleteKey() {
  const activeTiles = gameboard.value.getActiveTiles();
  const lastTile = activeTiles[activeTiles.length - 1];
  if (!lastTile) return;

  lastTile.textContent = "";
  delete lastTile.dataset.letter;
  delete lastTile.dataset.state;
}

function flipTile(
  tile: HTMLDivElement,
  index: number,
  array: HTMLDivElement[],
  guess: string
) {
  const letter = tile.dataset.letter || "";
  const key = keyboard.value.getKey(letter);

  setTimeout(() => {
    tile.classList.add("flip");
  }, (index * FLIP_ANIMATION_DURATION) / 2);

  tile.addEventListener(
    "transitionend",
    () => {
      tile.classList.remove("flip");
      if (targetWord.value[index] === letter) {
        tile.dataset.state = "correct";
        key.classList.add("correct");
      } else if (targetWord.value.includes(letter)) {
        tile.dataset.state = "wrong-location";
        key.classList.add("wrong-location");
      } else {
        tile.dataset.state = "wrong";
        key.classList.add("wrong");
      }

      if (index === array.length - 1) {
        tile.addEventListener(
          "transitionend",
          () => {
            startInteraction();
            checkWinLose(guess, array);
          },
          { once: true }
        );
      }
    },
    { once: true }
  );
}

function checkWinLose(guess: string, tiles: HTMLDivElement[]) {
  if (guess === targetWord.value) {
    stopInteraction();
    alert.value.showAlert("You win", 2500);
    gameboard.value.danceTiles(tiles);
    return openResults();
  }

  const remainingTiles = gameboard.value.getRemainingTiles();

  if (remainingTiles.length === 0) {
    stopInteraction();
    alert.value.showAlert(targetWord.value.toUpperCase(), null);
    return openResults();
  }
}

function startInteraction() {
  if (keyboardEvents) {
    window.addEventListener("keydown", handleKeyPress);
  }
  keyboard.value.startInteraction();
}

function stopInteraction() {
  if (keyboardEvents) {
    window.removeEventListener("keydown", handleKeyPress);
  }
  keyboard.value.stopInteraction();
}

function openResults(duration = 2500) {
  setTimeout(() => {
    showResults.value = true;
  }, duration);
}

function closeResults() {
  showResults.value = false;
}

function shareResults() {
  const results = gameboard.value.getResults();

  if (navigator.share) return navigator.share({ text: results });

  alert.value.showAlert("Copied results to clipboard", 2500);
  navigator.clipboard.writeText(results);
}

function isMobile() {
  return /Mobi/i.test(navigator.userAgent);
}

onBeforeMount(() => {
  // Check if the target word is a 5 letter word
  if (targetWord.value.length !== 5) {
    console.error("Target word must be 5 letters long. Got", targetWord.value);
  }
  // Check if the target word is on the word list
  if (dictionary.includes(targetWord.value) === false) {
    dictionary.push(targetWord.value);
  }
  console.log(bgColor.value);
});

onMounted(() => {
  startInteraction();
});

onUnmounted(() => {
  if (keyboardEvents) {
    stopInteraction();
  }
});
</script>

<template>
  <div id="wordleForGood">
    <Header v-if="!isMobile() && title" :title="title" />
    <div class="game-wrapper">
      <Alert ref="alert" />
      <Results v-if="showResults" @share="shareResults" @close="closeResults" />
      <Gameboard :title="title" ref="gameboard" />
      <Keyboard
        @keyClick="pressKey"
        @enterClick="submitGuess"
        @deleteClick="deleteKey"
        ref="keyboard"
      />
    </div>
  </div>
</template>
<style lang="scss">
@import "./styles/main.scss";
:root {
  --background: v-bind(bgColor);
  --text: v-bind(textColor);
  --height: v-bind(height);
  --tileBorderColor: v-bind(tileBorderColor);
  --tileBorderActiveColor: v-bind(tileBorderActiveColor);
  --tileBgColor: v-bind(tileBgColor);
  --tileBgActiveColor: v-bind(tileBgActiveColor);
  --tileTextColor: v-bind(tileTextColor);
  --keyBgColor: v-bind(keyBgColor);
  --keyTextColor: v-bind(keyTextColor);
  --keyTextSize: v-bind(keyTextSize);
}
</style>
