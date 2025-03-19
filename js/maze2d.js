// Constants for 2D maze
const DEFAULT_MAZE_WIDTH = 8;
const DEFAULT_MAZE_HEIGHT = 8;
const DEFAULT_CELL_SIZE = 30;
const DEFAULT_PLAYER_SIZE = 20;
const WALL_WIDTH = 2;
const START_POSITION = { x: 0, y: 0 };

// Initialize with constants
let mazeWidth = DEFAULT_MAZE_WIDTH;
let mazeHeight = DEFAULT_MAZE_HEIGHT;
let cellSize = DEFAULT_CELL_SIZE;
let playerSize = DEFAULT_PLAYER_SIZE;
let playerPosition = { ...START_POSITION };
let finishPosition = { x: mazeWidth - 1, y: mazeHeight - 1 };

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
  const mazeElement = document.getElementById("maze");
  mazeElement.innerHTML = "";

  for (let y = 0; y < mazeHeight; y++) {
    for (let x = 0; x < mazeWidth; x++) {
      const cell = maze[y][x];

      if (cell.top) {
        const wall = document.createElement("div");
        wall.className = "wall";
        wall.style.width = `${cellSize}px`;
        wall.style.height = `${WALL_WIDTH}px`;
        wall.style.left = `${x * cellSize}px`;
        wall.style.top = `${y * cellSize}px`;
        mazeElement.appendChild(wall);
      }

      if (cell.left) {
        const wall = document.createElement("div");
        wall.className = "wall";
        wall.style.width = `${WALL_WIDTH}px`;
        wall.style.height = `${cellSize}px`;
        wall.style.left = `${x * cellSize}px`;
        wall.style.top = `${y * cellSize}px`;
        mazeElement.appendChild(wall);
      }

      if (x === mazeWidth - 1 && cell.right) {
        const wall = document.createElement("div");
        wall.className = "wall";
        wall.style.width = `${WALL_WIDTH}px`;
        wall.style.height = `${cellSize}px`;
        wall.style.left = `${(x + 1) * cellSize}px`;
        wall.style.top = `${y * cellSize}px`;
        mazeElement.appendChild(wall);
      }

      if (y === mazeHeight - 1 && cell.bottom) {
        const wall = document.createElement("div");
        wall.className = "wall";
        wall.style.width = `${cellSize}px`;
        wall.style.height = `${WALL_WIDTH}px`;
        wall.style.left = `${x * cellSize}px`;
        wall.style.top = `${(y + 1) * cellSize}px`;
        mazeElement.appendChild(wall);
      }
    }
  }
}

// Update player position in 2D mode
function updatePlayerPosition() {
  const playerElement = document.getElementById("player");
  playerElement.style.left = `${
    playerPosition.x * cellSize + (cellSize - playerSize) / 2
  }px`;
  playerElement.style.top = `${
    playerPosition.y * cellSize + (cellSize - playerSize) / 2
  }px`;
}
