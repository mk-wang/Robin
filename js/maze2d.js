// Constants for 2D maze
const DEFAULT_CELL_SIZE = 30;
const DEFAULT_PLAYER_SIZE = 20;
const WALL_WIDTH = 2;

// Initialize with constants
let cellSize = DEFAULT_CELL_SIZE;
let playerSize = DEFAULT_PLAYER_SIZE;

// Render the maze by creating HTML elements
function render2DMaze() {
  const mazeElement = document.getElementById("maze");
  mazeElement.innerHTML = "";

  const maze = MazeData.getMaze();
  const mazeWidth = MazeData.getWidth();
  const mazeHeight = MazeData.getHeight();

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

  // Update player and finish positions
  updatePlayerPosition();
  updateFinishPosition();
}

// Update player position in 2D mode
function updatePlayerPosition() {
  const playerElement = document.getElementById("player");
  const position = MazeData.getPlayerPosition();

  playerElement.style.left = `${
    position.x * cellSize + (cellSize - playerSize) / 2
  }px`;
  playerElement.style.top = `${
    position.y * cellSize + (cellSize - playerSize) / 2
  }px`;
}

// Update finish position in 2D mode
function updateFinishPosition() {
  const finishElement = document.getElementById("finish");
  const position = MazeData.getFinishPosition();

  finishElement.style.left = `${position.x * cellSize}px`;
  finishElement.style.top = `${position.y * cellSize}px`;
}

// Resize maze based on new dimensions with improved size calculation
function resizeMaze2D(width, height) {
  // Calculate appropriate cell size based on screen dimensions
  const maxWidth = Math.min(window.innerWidth * 0.9, 800);
  const maxHeight = window.innerHeight * 0.6;

  cellSize = Math.min(
    Math.floor(maxWidth / width),
    Math.floor(maxHeight / height),
    DEFAULT_CELL_SIZE
  );

  // Ensure minimum cell size for visibility
  cellSize = Math.max(cellSize, 10);

  // Adjust player size proportionally to cell size
  playerSize = Math.min(cellSize * 0.8, DEFAULT_PLAYER_SIZE);

  // Update container dimensions
  const mazeContainer = document.querySelector(".maze-container");
  const mazeElement = document.getElementById("maze");

  const totalWidth = width * cellSize;
  const totalHeight = height * cellSize;

  mazeContainer.style.width = `${totalWidth}px`;
  mazeContainer.style.height = `${totalHeight}px`;
  mazeElement.style.width = `${totalWidth}px`;
  mazeElement.style.height = `${totalHeight}px`;

  // Render the maze with the new dimensions
  render2DMaze();
}

// Initialize 2D mode
function init2DMaze() {
  resizeMaze2D(MazeData.getWidth(), MazeData.getHeight());
}

// Export cellSize for other modules to use
window.Maze2D = {
  getCellSize: () => cellSize,
  updatePlayerPosition,
  updateFinishPosition,
  render2DMaze,
  resizeMaze2D,
  init2DMaze,
};
