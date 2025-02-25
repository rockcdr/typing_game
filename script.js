// Fetch a large word list (50,000 words)
const words = []; // Placeholder for the word list

// https://github.com/dwyl/english-words/blob/master/words.txt
const words_url = "https://raw.githubusercontent.com/dwyl/english-words/master/words.txt";

// Check game status
function checkStatus() {
  if (!isPlaying && time === 0) {
    alert(`Game Over! Your score is ${score}.`);
    score = 0;
    time = 600;
    scoreDisplay.textContent = score;
    timerDisplay.textContent = time;
  }
}

// Load a large word list (replace with your own file or API)
async function loadWords() {
  try {
    const response = await fetch(words_url); // Replace with the path to your word list
    const text = await response.text();
    const wordList = text.split("\n").filter(word => word.trim().length > 0);

    // Add words in smaller chunks to avoid call stack overflow
    const chunkSize = 1000; // Adjust chunk size as needed
    for (let i = 0; i < wordList.length; i += chunkSize) {
      const chunk = wordList.slice(i, i + chunkSize);
      words.push(...chunk);
    }
  } catch (error) {
    console.error("Failed to load words:", error);
    // Fallback to a small word list
    words.push(...[
      "apple", "banana", "cat", "dog", "elephant",
      "fish", "grape", "hat", "ice", "juice"
    ]);
  }
}

let score = 0;
let time = 600;
let isPlaying = true;
let isPaused = false;
let wordsTyped = 0;
let failures = 0;
let startTime = Date.now();
let speed = 1; // Default speed

// DOM elements
const wordsContainer = document.getElementById("words-container");
const wordInput = document.getElementById("word-input");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const wordsPerSecondDisplay = document.getElementById("words-per-second");
const failuresDisplay = document.getElementById("failures");
const speedInput = document.getElementById("speed");
const pauseBtn = document.getElementById("pause-btn");

// Initialize the game
async function init() {
  await loadWords(); // Load the word list
  isPlaying = true;
  wordInput.addEventListener("input", startMatch);
  speedInput.addEventListener("input", updateSpeed);
  pauseBtn.addEventListener("click", togglePause);
  setInterval(countdown, 1000);
  setInterval(checkStatus, 50);
  setInterval(addWord, 5000); // Add a new word every second
}

// Update falling speed
function updateSpeed() {
  speed = parseInt(speedInput.value, 10);
}

// Toggle pause
function togglePause() {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "Resume" : "Pause";
}

// Add a falling word
function addWord() {
  if (!isPlaying || isPaused || words.length === 0) return;

  // Filter words based on difficulty (start with shorter words)
  const ll = 4;
  const mm = 7;
  const ll_s = 10;
  const mm_s = 20;
  const easyWords = words.filter(word => word.length <= ll);
  const midWords = words.filter(word => word.length > ll && word.length <= mm);
  const hardWords = words.filter(word => word.length > mm);
  const wordPool = score < ll_s ? easyWords : (score < mm_s ? [...easyWords, ...midWords] : [...easyWords, ...midWords, ...hardWords]);

  const word = document.createElement("div");
  word.classList.add("word");
  const w = wordPool[Math.floor(Math.random() * wordPool.length)];
  word.textContent = score < mm_s ? w.toLowerCase() : w;
  word.style.left = `${Math.random() * (600 - 100)}px`; // Random horizontal position
  word.style.top = "0px";
  wordsContainer.appendChild(word);

  // Move the word downward
  const fallInterval = setInterval(() => {
    if (isPaused) return; // Pause the falling animation
    const currentTop = parseFloat(word.style.top);
    if (currentTop >= 400) {
      clearInterval(fallInterval);
      if (word.parentNode === wordsContainer) { // Check if the word is still in the container
        wordsContainer.removeChild(word);
        failures++;
        failuresDisplay.textContent = failures;
      }
    } else {
      word.style.top = `${currentTop + speed}px`; // Adjust speed here
    }
  }, 50);
}

// Start matching the input with the displayed word
function startMatch() {
  if (isPaused) return; // Ignore input if paused
  const typedWord = wordInput.value.trim();
  const wordsOnScreen = document.querySelectorAll(".word");

  wordsOnScreen.forEach((word) => {
    if (word.textContent === typedWord) {
      if (word.parentNode === wordsContainer) { // Check if the word is still in the container
        wordsContainer.removeChild(word);
        wordInput.value = "";
        score++;
        wordsTyped++;
        updateWordsPerSecond();
      }
    }
  });

  scoreDisplay.textContent = score;
}

// Update words per second
function updateWordsPerSecond() {
  const elapsedTime = (Date.now() - startTime) / 1000; // Convert to seconds
  const wordsPerSecond = (wordsTyped / elapsedTime).toFixed(2);
  wordsPerSecondDisplay.textContent = wordsPerSecond;
}

// Countdown timer
function countdown() {
  if (isPaused) return; // Pause the timer
  if (time > 0) {
    time--;
  } else {
    endGame();
  }
  timerDisplay.textContent = time;
}

// End the game
function endGame() {
  isPlaying = false;
  alert(`Game Over! Your score is ${score}. Words/Second: ${wordsPerSecondDisplay.textContent}. Failures: ${failures}`);
  resetGame();
}

// Reset the game
function resetGame() {
  score = 0;
  time = 60;
  wordsTyped = 0;
  failures = 0;
  startTime = Date.now();
  scoreDisplay.textContent = score;
  timerDisplay.textContent = time;
  wordsPerSecondDisplay.textContent = 0;
  failuresDisplay.textContent = failures;
  wordsContainer.innerHTML = "";
  wordInput.value = "";
  isPlaying = true;
  isPaused = false;
  pauseBtn.textContent = "Pause";
}

// Start the game
init();
