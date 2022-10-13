<script setup lang="ts">
import Keyboard from "./components/Keyboard.ce.vue";
import Gameboard from "./components/Gameboard.ce.vue";
import Header from "./components/Header.ce.vue";
import Alert from "./components/Alert.ce.vue";
import {
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  onUnmounted,
  ref,
} from "vue";
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
  successSelector: {
    type: String,
  },
  failureSelector: {
    type: String,
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

const getSelector = (selector: string | undefined): HTMLElement => {
  const element = selector ? document.querySelector(selector) : null;
  if (element) {
    return element as HTMLElement;
  }
  // If the selector was not provided, let's try to guess it
  // Move up the DOM tree and adjacent element
  let parent = document.querySelector("wordle-for-good")
    ?.parentElement as Element;
  // If parent has no siblings, move up the DOM tree until we find the next adjacent element
  while (
    parent &&
    parent?.parentElement?.tagName !== "BODY" &&
    !parent?.nextElementSibling
  ) {
    // If so, return the next sibling
    parent = parent?.parentElement as HTMLElement;
  }
  return (
    (parent?.nextElementSibling as HTMLElement) ||
    (parent?.previousElementSibling as HTMLElement) ||
    parent
  );
};

const gameboard = ref();
const keyboard = ref();
const alert = ref();
const targetWord = ref(decodeWord(props.word));

const keyboardEvents = props.keyboardEvents === "true";

const bgColor = ref(props.bgColor);
const textColor = ref(props.textColor);
const height = ref(props.height);

const successSelector = getSelector(props.successSelector);
const failureSelector = props.failureSelector
  ? getSelector(props.failureSelector)
  : successSelector;

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

const isGameFinished = ref(false);
const gameResults = ref(null);
const gameShareTiles = ref(null);

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
    return openResults(false);
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
  if (keyboard) keyboard.value.stopInteraction();
}

function openResults(youWin = true, duration = 2500) {
  setTimeout(() => {
    if (keyboardEvents) {
      gameResults.value = gameboard.value.getResults();
      gameShareTiles.value = gameboard.value.getShareTiles();
      isGameFinished.value = true;
      if (youWin && successSelector) {
        successSelector.dataset.wordleForGood = "win";
        showSection(successSelector);
      } else if (!youWin && failureSelector) {
        failureSelector.dataset.wordleForGood = "lose";
        showSection(failureSelector);
      }
    }
  }, duration);
}

function shareResults() {
  const results = gameResults.value || "";

  if (navigator.share) return navigator.share({ text: results });

  alert.value.showAlert("Copied results to clipboard", 2500);
  navigator.clipboard.writeText(results);
}

function showSection(section: HTMLElement) {
  if (!section) return;
  section.innerHTML = section.innerHTML.replaceAll(
    "[[WFG-TILES]]",
    `<pre>${gameShareTiles.value}</pre>`
  );
  section.innerHTML = section.innerHTML.replaceAll(
    "[[WFG-WORD]]",
    targetWord.value.toUpperCase()
  );

  const shareLinks = section.querySelectorAll("[data-wfd-share]");
  shareLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      shareResults();
    });
  });

  // Animate with JS
  setTimeout(() => {
    section.style.overflow = "visible";
    section.style.maxHeight = "10000px";
    section.style.opacity = "1";
    section.style.display = "block";
  }, 1000);
}

function hideSection(section: HTMLElement) {
  // Animate with JS
  section.style.transition = "max-height 0.5s ease-in-out";
  section.style.overflow = "hidden";
  section.style.maxHeight = "0px";
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
  // Animate and hide the success & failure selectors
  if (successSelector && keyboardEvents) hideSection(successSelector);
  if (failureSelector && keyboardEvents) hideSection(failureSelector);
});

onMounted(() => {
  startInteraction();
});

onBeforeUnmount(() => {
  if (keyboardEvents) {
    stopInteraction();
  }
});
</script>

<template>
  <div id="wordleForGood">
    <Header v-if="title" :title="title" />
    <Alert ref="alert" />
    <Transition name="slide-up" mode="out-in" appear>
      <div class="game-wrapper" v-if="!isGameFinished">
        <Gameboard ref="gameboard" />
        <Keyboard
          @keyClick="pressKey"
          @enterClick="submitGuess"
          @deleteClick="deleteKey"
          ref="keyboard"
        />
      </div>
    </Transition>
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
