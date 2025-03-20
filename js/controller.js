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
let isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

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

  mazeElement.innerHTML = "";
  steps = 0;
  stepsElement.textContent = steps;

  // Use MazeData for maze generation
  MazeData.generateMaze();

  // Update both views
  Maze2D.render2DMaze();

  if (scene) {
    create3DMaze();
  }

  // Hide celebration - ensure it's completely hidden
  celebrationElement.style.display = "none";
  celebrationElement.classList.add("hidden");

  // Clear any existing confetti
  const confettiElements = document.querySelectorAll(".confetti");
  confettiElements.forEach((el) => el.remove());

  // Make direction controls visible after starting a new game
  const dirControls = document.querySelector(".dir-controls");
  if (dirControls) {
    dirControls.style.display = "grid";
    dirControls.style.visibility = "visible";
    dirControls.style.opacity = "1";
    dirControls.classList.remove("ios-hidden");
  }

  // For iOS, ensure controls are visible with additional delay
  if (isIOS) {
    setTimeout(forceShowDirectionControls, 200);
    setTimeout(forceShowDirectionControls, 500); // Additional call for redundancy
  }

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

  // Use MazeData's movePlayer function
  const moveSuccessful = MazeData.movePlayer(direction, dx, dy);

  if (moveSuccessful) {
    // Move is valid
    if (!isMuted) moveSound.play();
    steps++;
    document.getElementById("steps").textContent = steps;

    if (is3DMode) {
      // Update camera position in 3D mode if needed
      updateCameraPosition();
    } else {
      // Update player position in 2D mode
      updatePlayerPosition();
    }

    // Check if player reached the finish
    if (MazeData.isAtFinish()) {
      showCelebration();
    }
  } else {
    // Hit wall
    if (!isMuted) wallSound.play();
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
  hideDuringCelebration();
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

    // When switching to 3D, ensure the 3D view is correctly initialized with current data
    if (scene) {
      // If scene exists, recreate it with current maze dimensions
      create3DMaze();
      updateCameraPosition();
    } else {
      // If no scene, initialize 3D maze fresh
      init3DMaze();
    }

    switchTo3DView();
  } else {
    modeSwitchButton.textContent = "2D Mode";
    playerElement.classList.remove("hidden");
    finishElement.classList.remove("hidden");

    // Update 2D view before showing it
    Maze2D.resizeMaze2D(MazeData.getWidth(), MazeData.getHeight());
    switchTo2DView();
  }

  setTimeout(() => {
    showAfterCelebration();
  }, 300);
}

// Handle mute/unmute
function toggleMute() {
  const muteButton = document.getElementById("mute-button");
  isMuted = !isMuted;
  muteButton.textContent = isMuted ? "🔇" : "🔊";
}

// Update function to show a simplified hint without mode indicators
function setupTouchModeIndicators() {
  if (!isTouchDevice) return;

  // Add a hint about touch controls when 3D mode is first activated
  document.getElementById("mode-switch").addEventListener("click", () => {
    if (is3DMode) {
      // Show hint about multi-finger gesture for camera control
      const maze3d = document.getElementById("maze3d");
      const hint = document.createElement("div");
      hint.className = "camera-hint";
      hint.textContent =
        "Use single finger to move • Use two fingers to adjust camera";
      maze3d.appendChild(hint);

      // Remove hint after 5 seconds
      setTimeout(() => {
        if (hint.parentNode) {
          hint.style.opacity = "0";
          setTimeout(() => hint.remove(), 1000);
        }
      }, 5000);
    }
  });
}

// Setup event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Initialize maze dimensions with MazeData defaults
  const mazeElement = document.getElementById("maze");
  const playAgainButton = document.getElementById("play-again");
  const newGameButton = document.getElementById("new-game");
  const modeSwitchButton = document.getElementById("mode-switch");
  const muteButton = document.getElementById("mute-button");
  const applySettingsButton = document.getElementById("apply-settings");
  const widthInput = document.getElementById("maze-width");
  const heightInput = document.getElementById("maze-height");

  // Set input fields with min, max and default values
  [widthInput, heightInput].forEach((input) => {
    input.min = MazeData.MIN_SIZE;
    input.max = MazeData.MAX_SIZE;
    if (input === widthInput) {
      input.value = MazeData.getWidth();
    } else {
      input.value = MazeData.getHeight();
    }
  });

  // Initialize game and set up event handlers
  initGame();

  // Set initial size once MazeData and Maze2D are initialized
  setTimeout(() => {
    // Get the cell size from Maze2D
    const cellSize = Maze2D.getCellSize();
    mazeElement.style.width = `${MazeData.getWidth() * cellSize}px`;
    mazeElement.style.height = `${MazeData.getHeight() * cellSize}px`;
  }, 100);

  newGameButton.addEventListener("click", initGame);
  playAgainButton.addEventListener("click", () => {
    initGame();

    // Special handling for iOS devices
    if (isIOS) {
      // Force a delay before showing controls on iOS
      setTimeout(() => {
        showAfterCelebration();

        // Additional timeout to ensure controls are visible
        setTimeout(() => {
          const controls = document.querySelector(".dir-controls");
          if (controls) {
            controls.style.display = "grid";
            controls.style.visibility = "visible";
            controls.style.opacity = "1";
          }
        }, 300);
      }, 100);
    } else {
      // Standard behavior for non-iOS
      showAfterCelebration();
    }
  });
  modeSwitchButton.addEventListener("click", switchMode);
  muteButton.addEventListener("click", toggleMute);

  // Settings control
  applySettingsButton.addEventListener("click", () => {
    const newWidth = Math.min(
      Math.max(
        parseInt(widthInput.value) || MazeData.getWidth(),
        MazeData.MIN_SIZE
      ),
      MazeData.MAX_SIZE
    );
    const newHeight = Math.min(
      Math.max(
        parseInt(heightInput.value) || MazeData.getHeight(),
        MazeData.MIN_SIZE
      ),
      MazeData.MAX_SIZE
    );

    widthInput.value = newWidth;
    heightInput.value = newHeight;

    // First resize the maze data
    MazeData.resizeMaze(newWidth, newHeight);

    // Update current view based on mode
    if (is3DMode) {
      // Reset 3D view with new dimensions
      init3DMaze();
    } else {
      // Resize 2D view
      Maze2D.resizeMaze2D(newWidth, newHeight);
    }

    // Reset steps counter
    steps = 0;
    document.getElementById("steps").textContent = steps;
  });

  // iOS specific handling
  if (isIOS) {
    // Add viewport scroll fix for iOS
    window.addEventListener("resize", function () {
      if (document.activeElement.tagName === "INPUT") {
        document.activeElement.scrollIntoView();
      }
    });

    // Prevent iOS bounce scroll effect in fullscreen
    document.body.addEventListener(
      "touchmove",
      function (e) {
        if (document.body.classList.contains("ios-body-fullscreen")) {
          e.preventDefault();
        }
      },
      { passive: false }
    );
  }

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
      handle3DResize();
    } else {
      // Also handle 2D maze resize when in 2D mode
      resizeMaze2D(MazeData.getWidth(), MazeData.getHeight());
    }
  });

  // Set up swipe controls for touch devices
  if (isTouchDevice) {
    setupSwipeControls();

    // Add instructional hint for touch controls
    const controlHint = document.createElement("div");
    controlHint.className = "touch-hint";
    controlHint.textContent = "Swipe to move • Pinch to zoom camera";
    document.querySelector(".maze-container").appendChild(controlHint);

    // Hide the hint after a few seconds
    setTimeout(() => {
      controlHint.classList.add("fade-out");
      setTimeout(() => {
        controlHint.remove();
      }, 1000);
    }, 5000);
  }

  // Set up touch mode indicators for 3D view
  setupTouchModeIndicators();
});

// Add event listeners to the control divs
document.addEventListener("DOMContentLoaded", () => {
  // Direction controls
  const dirControls = document.querySelectorAll(".dir-control");
  dirControls.forEach((control) => {
    control.addEventListener("click", () => {
      if (control.classList.contains("btn-up")) {
        movePlayer(Direction.UP);
      } else if (control.classList.contains("btn-down")) {
        movePlayer(Direction.DOWN);
      } else if (control.classList.contains("btn-left")) {
        movePlayer(Direction.LEFT);
      } else if (control.classList.contains("btn-right")) {
        movePlayer(Direction.RIGHT);
      }
    });
  });
});

// Improved function to hide controls during celebration - with iOS handling
function hideDuringCelebration() {
  const controls = document.querySelector(".dir-controls");
  if (controls) {
    // For iOS, use a different approach to hiding
    if (isIOS) {
      controls.style.visibility = "hidden";
      controls.style.opacity = "0";
    } else {
      controls.style.display = "none";
    }
  }
}

// More robust function to show controls after celebration
function showAfterCelebration() {
  const controls = document.querySelector(".dir-controls");
  if (controls) {
    // First ensure the element is in the DOM with display:grid
    controls.style.display = "grid";

    // Remove any iOS-specific hidden class
    controls.classList.remove("ios-hidden");

    // For iOS we need to explicitly set these properties
    if (isIOS) {
      controls.style.visibility = "visible";
      controls.style.opacity = "1";

      // Force layout recalculation
      void controls.offsetHeight;

      // Additional property to ensure visibility on iOS
      controls.style.pointerEvents = "auto";
    }
  }
}

// Enhanced play again button handler to ensure controls are visible
document.addEventListener("DOMContentLoaded", () => {
  // Initialize maze dimensions with MazeData defaults
  const mazeElement = document.getElementById("maze");
  const playAgainButton = document.getElementById("play-again");
  const newGameButton = document.getElementById("new-game");
  const modeSwitchButton = document.getElementById("mode-switch");
  const muteButton = document.getElementById("mute-button");
  const applySettingsButton = document.getElementById("apply-settings");
  const widthInput = document.getElementById("maze-width");
  const heightInput = document.getElementById("maze-height");

  // Set input fields with min, max and default values
  [widthInput, heightInput].forEach((input) => {
    input.min = MazeData.MIN_SIZE;
    input.max = MazeData.MAX_SIZE;
    if (input === widthInput) {
      input.value = MazeData.getWidth();
    } else {
      input.value = MazeData.getHeight();
    }
  });

  // Initialize game and set up event handlers
  initGame();

  // Set initial size once MazeData and Maze2D are initialized
  setTimeout(() => {
    // Get the cell size from Maze2D
    const cellSize = Maze2D.getCellSize();
    mazeElement.style.width = `${MazeData.getWidth() * cellSize}px`;
    mazeElement.style.height = `${MazeData.getHeight() * cellSize}px`;
  }, 100);

  newGameButton.addEventListener("click", initGame);
  playAgainButton.addEventListener("click", () => {
    initGame();

    // Special handling for iOS devices
    if (isIOS) {
      // Force a delay before showing controls on iOS
      setTimeout(() => {
        showAfterCelebration();

        // Additional timeout to ensure controls are visible
        setTimeout(() => {
          const controls = document.querySelector(".dir-controls");
          if (controls) {
            controls.style.display = "grid";
            controls.style.visibility = "visible";
            controls.style.opacity = "1";
          }
        }, 300);
      }, 100);
    } else {
      // Standard behavior for non-iOS
      showAfterCelebration();
    }
  });
  modeSwitchButton.addEventListener("click", switchMode);
  muteButton.addEventListener("click", toggleMute);

  // Settings control
  applySettingsButton.addEventListener("click", () => {
    const newWidth = Math.min(
      Math.max(
        parseInt(widthInput.value) || MazeData.getWidth(),
        MazeData.MIN_SIZE
      ),
      MazeData.MAX_SIZE
    );
    const newHeight = Math.min(
      Math.max(
        parseInt(heightInput.value) || MazeData.getHeight(),
        MazeData.MIN_SIZE
      ),
      MazeData.MAX_SIZE
    );

    widthInput.value = newWidth;
    heightInput.value = newHeight;

    // First resize the maze data
    MazeData.resizeMaze(newWidth, newHeight);

    // Update current view based on mode
    if (is3DMode) {
      // Reset 3D view with new dimensions
      init3DMaze();
    } else {
      // Resize 2D view
      Maze2D.resizeMaze2D(newWidth, newHeight);
    }

    // Reset steps counter
    steps = 0;
    document.getElementById("steps").textContent = steps;
  });

  // iOS specific handling
  if (isIOS) {
    // Add viewport scroll fix for iOS
    window.addEventListener("resize", function () {
      if (document.activeElement.tagName === "INPUT") {
        document.activeElement.scrollIntoView();
      }
    });

    // Prevent iOS bounce scroll effect in fullscreen
    document.body.addEventListener(
      "touchmove",
      function (e) {
        if (document.body.classList.contains("ios-body-fullscreen")) {
          e.preventDefault();
        }
      },
      { passive: false }
    );
  }

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
      handle3DResize();
    } else {
      // Also handle 2D maze resize when in 2D mode
      resizeMaze2D(MazeData.getWidth(), MazeData.getHeight());
    }
  });

  // Get the play again button
  const playAgainButtonElement = document.getElementById("play-again");

  // Remove any existing event listeners
  playAgainButtonElement.replaceWith(playAgainButtonElement.cloneNode(true));

  // Get the fresh button
  const newPlayAgainButton = document.getElementById("play-again");

  // Add our enhanced event listener
  newPlayAgainButton.addEventListener("click", function (e) {
    console.log("Play Again clicked");

    // Start a new game
    initGame();

    // Force show controls with multiple approaches for redundancy
    setTimeout(() => {
      const controls = document.querySelector(".dir-controls");
      if (controls) {
        controls.style.display = "grid";
        controls.classList.remove("ios-hidden");
        controls.style.visibility = "visible";
        controls.style.opacity = "1";
        controls.style.pointerEvents = "auto";
      }

      // Force a DOM update
      forceShowDirectionControls();

      // Call again after a delay to ensure it works consistently
      setTimeout(forceShowDirectionControls, 300);
    }, 100);
  });
});

// Add a global handler for celebration closing that always shows controls
window.showControlsAfterCelebration = function () {
  console.log("Showing controls after celebration");
  setTimeout(() => {
    const controls = document.querySelector(".dir-controls");
    if (controls) {
      controls.style.display = "grid";
      controls.classList.remove("ios-hidden");
      controls.style.visibility = "visible";
      controls.style.opacity = "1";

      // For iOS devices, add extra properties
      if (isIOS) {
        controls.style.pointerEvents = "auto";

        // Force refresh the controls by temporarily toggling a class
        controls.classList.add("force-visible");
        setTimeout(() => controls.classList.remove("force-visible"), 50);
      }
    }
  }, 50);
};

// Improved force show direction controls function
function forceShowDirectionControls() {
  const controls = document.querySelector(".dir-controls");
  if (controls) {
    // Make it visible first
    controls.style.display = "grid";
    controls.style.visibility = "visible";
    controls.style.opacity = "1";
    controls.classList.remove("ios-hidden");

    // For iOS, add additional properties
    if (isIOS) {
      controls.style.pointerEvents = "auto";
      controls.style.transform = "translateZ(0)";
      controls.style.webkitTransform = "translateZ(0)";

      // Force DOM reflow
      void controls.offsetHeight;
    }
  }
}

// At the end of the file, add a global event listener for iOS fullscreen issues
if (isIOS) {
  // After any touch event, ensure controls are visible
  document.addEventListener("touchend", function () {
    if (document.getElementById("celebration").style.display !== "flex") {
      setTimeout(forceShowDirectionControls, 100);
    }
  });
}

// Add swipe gesture support for 2D mode
function setupSwipeControls() {
  const mazeElement = document.getElementById("maze");
  let startX, startY;
  const SWIPE_THRESHOLD = 30; // Minimum pixels for a swipe
  const SWIPE_COOLDOWN = 300; // Milliseconds to wait between swipes
  let lastSwipeTime = 0;

  // Prevent default touch behavior to avoid scrolling
  mazeElement.addEventListener(
    "touchstart",
    function (e) {
      // Only handle touches in 2D mode
      if (is3DMode) return;

      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      e.preventDefault();
    },
    { passive: false }
  );

  mazeElement.addEventListener(
    "touchmove",
    function (e) {
      // Only handle touches in 2D mode
      if (is3DMode) return;

      if (!startX || !startY) return;
      e.preventDefault();
    },
    { passive: false }
  );

  mazeElement.addEventListener("touchend", function (e) {
    // Only handle touches in 2D mode
    if (is3DMode) return;

    if (!startX || !startY) return;

    const now = Date.now();
    if (now - lastSwipeTime < SWIPE_COOLDOWN) {
      // Skip if we just processed a swipe
      startX = null;
      startY = null;
      return;
    }

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    // Calculate deltas
    const diffX = endX - startX;
    const diffY = endY - startY;

    // Check if this was actually a swipe
    if (
      Math.abs(diffX) < SWIPE_THRESHOLD &&
      Math.abs(diffY) < SWIPE_THRESHOLD
    ) {
      startX = null;
      startY = null;
      return;
    }

    // Determine swipe direction
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (diffX > 0) {
        movePlayer(Direction.RIGHT);
      } else {
        movePlayer(Direction.LEFT);
      }
    } else {
      // Vertical swipe
      if (diffY > 0) {
        movePlayer(Direction.DOWN);
      } else {
        movePlayer(Direction.UP);
      }
    }

    lastSwipeTime = now;
    startX = null;
    startY = null;
  });
}
