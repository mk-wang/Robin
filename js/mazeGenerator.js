// Maze data and state
let maze = [];
let mazeWidth = 2; // Default width
let mazeHeight = 2; // Default height
let playerPosition = { x: 0, y: 0 };
let finishPosition = { x: 7, y: 7 };

// Size constraint constants
const MAZE_MIN_SIZE = 2;
const MAZE_MAX_SIZE = 20;

// Generate maze using recursive backtracking
function generateMaze() {
  maze = [];
  // Initialize maze with walls
  for (let y = 0; y < mazeHeight; y++) {
    maze[y] = [];
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

  // Reset player position to start
  playerPosition = { x: 0, y: 0 };

  // Set finish position to bottom-right corner
  finishPosition = { x: mazeWidth - 1, y: mazeHeight - 1 };

  // Start from top-left corner
  carvePathFrom(0, 0);
  return maze;
}

function carvePathFrom(x, y) {
  maze[y][x].visited = true;

  // Define possible directions
  const directions = [
    { dx: 0, dy: -1, wall: "top", opposite: "bottom" },
    { dx: 1, dy: 0, wall: "right", opposite: "left" },
    { dx: 0, dy: 1, wall: "bottom", opposite: "top" },
    { dx: -1, dy: 0, wall: "left", opposite: "right" },
  ];

  // Shuffle directions
  shuffleArray(directions);

  // Try each direction
  directions.forEach((dir) => {
    const newX = x + dir.dx;
    const newY = y + dir.dy;

    if (isValidCell(newX, newY) && !maze[newY][newX].visited) {
      // Remove walls between cells
      maze[y][x][dir.wall] = false;
      maze[newY][newX][dir.opposite] = false;
      carvePathFrom(newX, newY);
    }
  });
}

// Helper functions
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function isValidCell(x, y) {
  return x >= 0 && x < mazeWidth && y >= 0 && y < mazeHeight;
}

function resizeMaze(width, height) {
  mazeWidth = width;
  mazeHeight = height;
  finishPosition = { x: width - 1, y: height - 1 };
  playerPosition = { x: 0, y: 0 };
  generateMaze();

  // Now we don't need to trigger UI updates directly from here,
  // as the controller will handle that
}

function movePlayer(direction, dx, dy) {
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
      playerPosition.x = newX;
      playerPosition.y = newY;
      return true;
    }
  }
  return false; // Move was invalid
}

function isAtFinish() {
  return (
    playerPosition.x === finishPosition.x &&
    playerPosition.y === finishPosition.y
  );
}

// Export maze data and functions
window.MazeData = {
  getMaze: () => maze,
  getWidth: () => mazeWidth,
  getHeight: () => mazeHeight,
  getPlayerPosition: () => playerPosition,
  getFinishPosition: () => finishPosition,
  generateMaze,
  resizeMaze,
  movePlayer,
  isAtFinish,
  MIN_SIZE: MAZE_MIN_SIZE,
  MAX_SIZE: MAZE_MAX_SIZE,
};
