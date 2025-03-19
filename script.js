document.addEventListener("DOMContentLoaded", () => {
  const mazeElement = document.getElementById("maze");
  const playerElement = document.getElementById("player");
  const finishElement = document.getElementById("finish");
  const stepsElement = document.getElementById("steps");
  const celebrationElement = document.getElementById("celebration");
  const playAgainButton = document.getElementById("play-again");
  const newGameButton = document.getElementById("new-game");

  // Game variables
  let maze = [];
  const cellSize = 30;
  let mazeWidth = 8;
  let mazeHeight = 8;
  let playerPosition = { x: 0, y: 0 };
  let finishPosition = { x: mazeWidth - 1, y: mazeHeight - 1 };
  let steps = 0;

  // Set initial size of maze container
  mazeElement.style.width = `${mazeWidth * cellSize}px`;
  mazeElement.style.height = `${mazeHeight * cellSize}px`;

  // Immediately hide the celebration element when the page loads
  celebrationElement.style.display = "none";
  celebrationElement.classList.add("hidden");

  // Initialize the game
  function initGame() {
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
    finishElement.style.left = `${finishPosition.x * cellSize}px`;
    finishElement.style.top = `${finishPosition.y * cellSize}px`;

    // Hide celebration - ensure it's completely hidden
    celebrationElement.style.display = "none";
    celebrationElement.classList.add("hidden");
  }

  // Generate a random maze using a simple algorithm
  function generateMaze() {
    // Initialize the grid with walls
    maze = new Array(mazeHeight);
    for (let y = 0; y < mazeHeight; y++) {
      maze[y] = new Array(mazeWidth);
      for (let x = 0; x < mazeWidth; x++) {
        maze[y][x] = {
          top: true,
          right: true,
          bottom: true,
          left: true,
          visited: false,
        };
      }
    }

    // Run DFS maze generation
    dfsMaze(0, 0);

    // Remove these lines to close the entrance and exit
    // maze[0][0].top = false;
    // maze[mazeHeight - 1][mazeWidth - 1].bottom = false;

    // Render the maze
    renderMaze();
  }

  // DFS algorithm for maze generation
  function dfsMaze(x, y) {
    maze[y][x].visited = true;

    // Define possible directions to move (randomized)
    const directions = shuffle([
      { dx: 0, dy: -1, wall: "top", opposite: "bottom" }, // up
      { dx: 1, dy: 0, wall: "right", opposite: "left" }, // right
      { dx: 0, dy: 1, wall: "bottom", opposite: "top" }, // down
      { dx: -1, dy: 0, wall: "left", opposite: "right" }, // left
    ]);

    // Try each direction
    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;

      // Check if the new position is within the maze bounds
      if (nx >= 0 && nx < mazeWidth && ny >= 0 && ny < mazeHeight) {
        if (!maze[ny][nx].visited) {
          // Remove walls between current cell and next cell
          maze[y][x][dir.wall] = false;
          maze[ny][nx][dir.opposite] = false;

          // Recursively visit the next cell
          dfsMaze(nx, ny);
        }
      }
    }
  }

  // Shuffle an array (Fisher-Yates algorithm)
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Render the maze by creating HTML elements
  function renderMaze() {
    for (let y = 0; y < mazeHeight; y++) {
      for (let x = 0; x < mazeWidth; x++) {
        const cell = maze[y][x];

        if (cell.top) {
          const wall = document.createElement("div");
          wall.className = "wall";
          wall.style.width = `${cellSize}px`;
          wall.style.height = "2px";
          wall.style.left = `${x * cellSize}px`;
          wall.style.top = `${y * cellSize}px`;
          mazeElement.appendChild(wall);
        }

        if (cell.left) {
          const wall = document.createElement("div");
          wall.className = "wall";
          wall.style.width = "2px";
          wall.style.height = `${cellSize}px`;
          wall.style.left = `${x * cellSize}px`;
          wall.style.top = `${y * cellSize}px`;
          mazeElement.appendChild(wall);
        }

        if (x === mazeWidth - 1 && cell.right) {
          const wall = document.createElement("div");
          wall.className = "wall";
          wall.style.width = "2px";
          wall.style.height = `${cellSize}px`;
          wall.style.left = `${(x + 1) * cellSize}px`;
          wall.style.top = `${y * cellSize}px`;
          mazeElement.appendChild(wall);
        }

        if (y === mazeHeight - 1 && cell.bottom) {
          const wall = document.createElement("div");
          wall.className = "wall";
          wall.style.width = `${cellSize}px`;
          wall.style.height = "2px";
          wall.style.left = `${x * cellSize}px`;
          wall.style.top = `${(y + 1) * cellSize}px`;
          mazeElement.appendChild(wall);
        }
      }
    }
  }

  // Update player position on the screen
  function updatePlayerPosition() {
    playerElement.style.left = `${
      playerPosition.x * cellSize + (cellSize - playerElement.offsetWidth) / 2
    }px`;
    playerElement.style.top = `${
      playerPosition.y * cellSize + (cellSize - playerElement.offsetHeight) / 2
    }px`;

    // Check if player reached the finish
    checkWinCondition();
  }

  // New function to check win condition
  function checkWinCondition() {
    if (
      playerPosition.x === finishPosition.x &&
      playerPosition.y === finishPosition.y
    ) {
      setTimeout(() => celebrate(), 300); // Small delay for better visual feedback
    }
  }

  // Move player in specified direction if possible
  function movePlayer(direction) {
    const currentCell = maze[playerPosition.y][playerPosition.x];

    if (direction === "up" && !currentCell.top) {
      playerPosition.y--;
      steps++;
    } else if (direction === "right" && !currentCell.right) {
      playerPosition.x++;
      steps++;
    } else if (direction === "down" && !currentCell.bottom) {
      playerPosition.y++;
      steps++;
    } else if (direction === "left" && !currentCell.left) {
      playerPosition.x--;
      steps++;
    }

    stepsElement.textContent = steps;
    updatePlayerPosition();
  }

  // Show celebration animation when player wins
  function celebrate() {
    celebrationElement.style.display = ""; // Reset display to its default value
    celebrationElement.classList.remove("hidden");

    const balloonsContainer = document.querySelector(".balloons");
    balloonsContainer.innerHTML = "";

    // Create colorful balloons
    const colors = [
      "#ff6b6b",
      "#6c5ce7",
      "#fdcb6e",
      "#00b894",
      "#e84393",
      "#00cec9",
    ];

    for (let i = 0; i < 30; i++) {
      const balloon = document.createElement("div");
      balloon.className = "balloon";
      balloon.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];
      balloon.style.left = `${Math.random() * 100}%`;
      balloon.style.animationDelay = `${Math.random() * 5}s`;
      balloon.style.animationDuration = `${5 + Math.random() * 10}s`;
      balloonsContainer.appendChild(balloon);
    }
  }

  // Set up control button event listeners
  document
    .getElementById("up")
    .addEventListener("click", () => movePlayer("up"));
  document
    .getElementById("right")
    .addEventListener("click", () => movePlayer("right"));
  document
    .getElementById("down")
    .addEventListener("click", () => movePlayer("down"));
  document
    .getElementById("left")
    .addEventListener("click", () => movePlayer("left"));

  // Set up keyboard controls
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" || e.key === "w") {
      movePlayer("up");
    } else if (e.key === "ArrowRight" || e.key === "d") {
      movePlayer("right");
    } else if (e.key === "ArrowDown" || e.key === "s") {
      movePlayer("down");
    } else if (e.key === "ArrowLeft" || e.key === "a") {
      movePlayer("left");
    }
  });

  // Play again button
  playAgainButton.addEventListener("click", initGame);

  // New game button
  newGameButton.addEventListener("click", initGame);

  // Scale maze based on window size
  function resizeGame() {
    const size = Math.min(window.innerWidth * 0.8, 600);
    mazeElement.parentElement.style.width = `${size}px`;
    mazeElement.parentElement.style.height = `${size}px`;
  }

  // Check for resize
  window.addEventListener("resize", resizeGame);

  // Initialize finish position immediately to make sure it's not at the start
  finishPosition = { x: mazeWidth - 1, y: mazeHeight - 1 };

  // Make sure celebration is hidden initially - using both methods to ensure it's hidden
  celebrationElement.style.display = "none";
  celebrationElement.classList.add("hidden");

  // Initialize and resize
  resizeGame();
  initGame();
});
