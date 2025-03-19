// Size constraint constants
const MAZE_MIN_SIZE = 2;
const MAZE_MAX_SIZE = 20;
const MAZE_DEFAULT_SIZE = 8;

// Game constants
const CONFETTI_COUNT = 100;
const BALLOON_COUNT = 15;
const CONFETTI_MIN_SIZE = 5;
const CONFETTI_MAX_SIZE = 15;
const CONFETTI_MIN_OPACITY = 0.5;
const CONFETTI_MAX_OPACITY = 1.0;
const CONFETTI_CLEANUP_DELAY = 5000;
const CONFETTI_FADE_DELAY = 1000;
const CELEBRATION_CONFETTI_DELAY = 300;

// Animation timing constants
const BALLOON_MIN_DURATION = 8;
const BALLOON_MAX_DURATION = 13;
const BALLOON_MIN_DELAY = 0;
const BALLOON_MAX_DELAY = 3;

// Colors arrays
const BALLOON_COLORS = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeead"];
const CONFETTI_COLORS = [
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ffff00",
  "#ff00ff",
  "#00ffff",
  "#ff8800",
  "#88ff00",
];

// Audio URLs
const AUDIO_URLS = {
  MOVE:
    "https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3",
  WIN: "https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3",
  WALL:
    "https://assets.mixkit.co/sfx/preview/mixkit-game-show-buzz-in-3090.mp3",
  SWITCH:
    "https://assets.mixkit.co/sfx/preview/mixkit-quick-jump-arcade-game-239.mp3",
};

// Game control and user input handling
let steps = 0;
let isMuted = false;
let isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

const default3D = true;
let is3DMode = false;
let gameInited = false;

// Audio elements
const moveSound = new Audio(AUDIO_URLS.MOVE);
const winSound = new Audio(AUDIO_URLS.WIN);
const wallSound = new Audio(AUDIO_URLS.WALL);
const switchSound = new Audio(AUDIO_URLS.SWITCH);

// Add direction enum
const Direction = {
  LEFT: "left",
  RIGHT: "right",
  UP: "up",
  DOWN: "down",
};

// Initialize the game
function initGame() {
  const mazeElement = document.getElementById("maze");
  const celebrationElement = document.getElementById("celebration");
  const stepsElement = document.getElementById("steps");

  // Clear existing maze
  mazeElement.innerHTML = "";
  steps = 0;
  stepsElement.textContent = steps;

  // Generate maze
  generateMaze();

  // Set player position (start at top left)
  playerPosition = { x: 0, y: 0 };
  updatePlayerPosition();

  // Set finish position (bottom right)
  finishPosition = { x: mazeWidth - 1, y: mazeHeight - 1 };
  const finishElement = document.getElementById("finish");
  finishElement.style.left = `${finishPosition.x * cellSize}px`;
  finishElement.style.top = `${finishPosition.y * cellSize}px`;

  // Hide celebration - ensure it's completely hidden
  celebrationElement.style.display = "none";
  celebrationElement.classList.add("hidden");

  // Clear any existing confetti
  const confettiElements = document.querySelectorAll(".confetti");
  confettiElements.forEach((el) => el.remove());

  if (!gameInited && default3D && !is3DMode) {
    switchMode();
  }
  gameInited = true;
}

// Handle player movement
function movePlayer(direction) {
  let dx = 0,
    dy = 0;

  switch (direction) {
    case Direction.LEFT:
      dx = -1;
      break;
    case Direction.RIGHT:
      dx = 1;
      break;
    case Direction.UP:
      dy = -1;
      break;
    case Direction.DOWN:
      dy = 1;
      break;
  }

  const newX = playerPosition.x + dx;
  const newY = playerPosition.y + dy;

  // Check if the new position is within bounds
  if (newX >= 0 && newX < mazeWidth && newY >= 0 && newY < mazeHeight) {
    // Check if there's a wall in the way
    const currentCell = maze[playerPosition.y][playerPosition.x];
    if (
      (dx === 1 && !currentCell.right) ||
      (dx === -1 && !currentCell.left) ||
      (dy === 1 && !currentCell.bottom) ||
      (dy === -1 && !currentCell.top)
    ) {
      // Move is valid
      if (!isMuted) moveSound.play();
      playerPosition.x = newX;
      playerPosition.y = newY;
      steps++;
      document.getElementById("steps").textContent = steps;

      if (is3DMode) {
        // Update camera position in 3D mode
        camera.position.x = (playerPosition.x + 0.5) * 10;
        camera.position.z = (playerPosition.y + 0.5) * 10;
        updateCameraPosition(); // Changed from updateCameraDirection()
      } else {
        // Update player position in 2D mode
        updatePlayerPosition();
      }

      // Check if player reached the finish
      if (
        playerPosition.x === finishPosition.x &&
        playerPosition.y === finishPosition.y
      ) {
        showCelebration();
      }
    } else {
      // Hit wall
      if (!isMuted) wallSound.play();
    }
  }
}

// Unified celebration function for both 2D and 3D modes
function createCelebration() {
  const celebrationElement = document.getElementById("celebration");

  // Make sure any existing confetti is removed first
  const oldConfetti = document.querySelectorAll(".confetti");
  oldConfetti.forEach((el) => el.remove());

  // First display the celebration container
  celebrationElement.style.display = "flex";
  celebrationElement.classList.remove("hidden");
  if (!isMuted) winSound.play();

  // Create balloons
  const balloonsContainer = celebrationElement.querySelector(".balloons");
  balloonsContainer.innerHTML = "";
  const balloonColors = BALLOON_COLORS;

  for (let i = 0; i < BALLOON_COUNT; i++) {
    const balloon = document.createElement("div");
    balloon.className = "balloon";
    balloon.style.backgroundColor =
      balloonColors[Math.floor(Math.random() * balloonColors.length)];
    balloon.style.left = Math.random() * 100 + "%";
    balloon.style.animationDelay = Math.random() * BALLOON_MAX_DELAY + "s";
    balloon.style.animationDuration =
      Math.random() * BALLOON_MAX_DURATION + BALLOON_MIN_DURATION + "s";
    balloonsContainer.appendChild(balloon);
  }

  // Create confetti with a slight delay to ensure DOM is ready
  setTimeout(() => {
    const colors = CONFETTI_COLORS;

    // Create container for confetti if it doesn't exist
    let confettiContainer = document.getElementById("confetti-container");
    if (!confettiContainer) {
      confettiContainer = document.createElement("div");
      confettiContainer.id = "confetti-container";
      confettiContainer.style.position = "absolute";
      confettiContainer.style.top = "0";
      confettiContainer.style.left = "0";
      confettiContainer.style.width = "100%";
      confettiContainer.style.height = "100%";
      confettiContainer.style.pointerEvents = "none";
      confettiContainer.style.zIndex = "5";
      celebrationElement.appendChild(confettiContainer);
    } else {
      confettiContainer.innerHTML = "";
    }

    // Create confetti pieces
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti";
      confetti.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * 100 + "%";
      confetti.style.width =
        Math.random() * CONFETTI_MAX_SIZE + CONFETTI_MIN_SIZE + "px";
      confetti.style.height =
        Math.random() * CONFETTI_MAX_SIZE + CONFETTI_MIN_SIZE + "px";
      confetti.style.opacity =
        Math.random() * CONFETTI_MAX_OPACITY + CONFETTI_MIN_OPACITY;
      confetti.style.animationDelay = Math.random() * 2 + "s";
      confetti.style.animationDuration = Math.random() * 3 + 2 + "s";

      // Apply random rotations
      const rotation = Math.random() * 360;
      confetti.style.transform = `rotate(${rotation}deg)`;

      confettiContainer.appendChild(confetti);
    }

    // Clean up confetti after animation
    setTimeout(() => {
      const confettiElements = document.querySelectorAll(".confetti");
      confettiElements.forEach((el) => {
        // Fade out before removing
        el.style.transition = "opacity 1s ease-out";
        el.style.opacity = "0";

        setTimeout(() => el.remove(), CONFETTI_FADE_DELAY);
      });
    }, CONFETTI_CLEANUP_DELAY);
  }, CELEBRATION_CONFETTI_DELAY); // Delay confetti slightly after celebration appears
}

// Show celebration when player wins - now uses the unified function
function showCelebration() {
  createCelebration();
}

// Handle mode switch between 2D and 3D
function switchMode() {
  const maze3dElement = document.getElementById("maze3d");
  const mazeElement = document.getElementById("maze");
  const playerElement = document.getElementById("player");
  const finishElement = document.getElementById("finish");
  const modeSwitchButton = document.getElementById("mode-switch");

  is3DMode = !is3DMode;
  if (!isMuted && gameInited) switchSound.play();

  if (is3DMode) {
    modeSwitchButton.textContent = "3D Mode";
    playerElement.classList.add("hidden");
    finishElement.classList.add("hidden");
    switchTo3DView();
  } else {
    modeSwitchButton.textContent = "2D Mode";
    playerElement.classList.remove("hidden");
    finishElement.classList.remove("hidden");
    switchTo2DView();
  }
}

// Handle mute/unmute
function toggleMute() {
  const muteButton = document.getElementById("mute-button");
  isMuted = !isMuted;
  muteButton.textContent = isMuted ? "🔇" : "🔊";
}

// Setup event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Initialize maze dimensions
  mazeWidth = MAZE_DEFAULT_SIZE; // Using existing variable from maze2d.js
  mazeHeight = MAZE_DEFAULT_SIZE; // Using existing variable from maze2d.js

  const mazeElement = document.getElementById("maze");
  const playAgainButton = document.getElementById("play-again");
  const newGameButton = document.getElementById("new-game");
  const modeSwitchButton = document.getElementById("mode-switch");
  const muteButton = document.getElementById("mute-button");
  const applySettingsButton = document.getElementById("apply-settings");
  const widthInput = document.getElementById("maze-width");
  const heightInput = document.getElementById("maze-height");

  // 设置输入框的最小值、最大值和默认值
  [widthInput, heightInput].forEach((input) => {
    input.min = MAZE_MIN_SIZE;
    input.max = MAZE_MAX_SIZE;
    input.value = MAZE_DEFAULT_SIZE;
  });

  // Set initial size of maze container
  mazeElement.style.width = `${mazeWidth * cellSize}px`;
  mazeElement.style.height = `${mazeHeight * cellSize}px`;

  // Initialize the game
  initGame();

  newGameButton.addEventListener("click", initGame);
  playAgainButton.addEventListener("click", initGame);
  modeSwitchButton.addEventListener("click", switchMode);
  muteButton.addEventListener("click", toggleMute);

  // Settings control
  applySettingsButton.addEventListener("click", () => {
    const newWidth = Math.min(
      Math.max(parseInt(widthInput.value) || MAZE_DEFAULT_SIZE, MAZE_MIN_SIZE),
      MAZE_MAX_SIZE
    );
    const newHeight = Math.min(
      Math.max(parseInt(heightInput.value) || MAZE_DEFAULT_SIZE, MAZE_MIN_SIZE),
      MAZE_MAX_SIZE
    );

    widthInput.value = newWidth;
    heightInput.value = newHeight;

    resizeMaze(newWidth, newHeight);
    if (is3DMode) {
      init3DMaze();
    }
  });

  // Keyboard controls
  document.addEventListener("keydown", (e) => {
    if (is3DMode) {
      // Let maze3d.js handle the movement in 3D mode
      return;
    }

    switch (e.key) {
      case "ArrowUp":
      case "w":
      case "W":
        movePlayer(Direction.UP);
        break;
      case "ArrowDown":
      case "s":
      case "S":
        movePlayer(Direction.DOWN);
        break;
      case "ArrowLeft":
      case "a":
      case "A":
        movePlayer(Direction.LEFT);
        break;
      case "ArrowRight":
      case "d":
      case "D":
        movePlayer(Direction.RIGHT);
        break;
    }
  });

  // Handle window resize
  window.addEventListener("resize", () => {
    if (is3DMode) {
      on3DResize();
    }
  });
});

function createFloatingControls(container) {
  let dirControls = document.createElement("div");
  dirControls.className = "floating-controls";
  dirControls.style.display = "none";

  const directions = [
    Direction.UP,
    Direction.DOWN,
    Direction.LEFT,
    Direction.RIGHT,
  ];
  directions.forEach((dir) => {
    const button = document.createElement("button");
    button.className = `control-btn ${dir}`;
    button.innerHTML = `<span class="arrow-${dir}"></span>`;
    button.addEventListener("click", () => movePlayer(dir));
    dirControls.appendChild(button);
  });

  document.getElementById(container).appendChild(dirControls);
  return dirControls;
}
