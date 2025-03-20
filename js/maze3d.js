// Constants for 3D maze
const CELL_SIZE_3D = 10;
const WALL_HEIGHT = 5;
const WALL_THICKNESS = 1;
const PLAYER_RADIUS = 2;
const PLAYER_HEIGHT = 2;
const FLOOR_OFFSET = -0.5;
const CAMERA_MIN_ANGLE = 0.1;
const CAMERA_MAX_ANGLE = Math.PI / 2 - 0.1;
const CAMERA_MIN_DISTANCE = 10;
const CAMERA_MAX_DISTANCE = 200;
const CAMERA_ZOOM_STEP = 2;
const CAMERA_ANGLE_SENSITIVITY = 0.005;
const PLAYER_BOUNCE_SPEED = 0.005;
const PLAYER_BOUNCE_HEIGHT = 0.2;
const FINISH_POINT_RADIUS = 2;
const FINISH_POINT_HEIGHT = 1;
const STAR_SIZE = 3;
const STAR_POINTS = 10;
const STAR_DEPTH = 0.2;
const STAR_HEIGHT = 5;
const STAR_ROTATION_SPEED = 0.01;
const FLOATING_CONTROLS_SIZE = "60px";
const FLOATING_CONTROLS_MARGIN = "10px";
// New constants for custom fullscreen mode
const CUSTOM_FULLSCREEN_Z_INDEX = 1000;
const CELEBRATION_Z_INDEX = 2000; // New constant for celebration z-index
const FULLSCREEN_POSITION_STYLES = {
  position: "fixed",
  top: "0",
  left: "0",
  width: "100%",
  height: "100%",
  zIndex: CUSTOM_FULLSCREEN_Z_INDEX,
  backgroundColor: "#ffffff",
};

// Light settings
const AMBIENT_LIGHT_INTENSITY = 0.6;
const DIRECTIONAL_LIGHT_INTENSITY = 0.8;
const DIRECTIONAL_LIGHT_POSITION = { x: 0, y: 20, z: 10 };

// Material settings
const WALL_METALNESS = 0.2;
const WALL_ROUGHNESS = 0.8;
const OUTER_WALL_METALNESS = 0.3;
const OUTER_WALL_ROUGHNESS = 0.7;

// Colors
const SKY_COLOR = 0xf0f8ff;
const FLOOR_COLOR = 0x8ed1fc;
const WALL_COLOR = 0x6c5ce7;
const OUTER_WALL_COLOR = 0xee3394;
const PLAYER_COLOR = 0xff6b6b;
const FINISH_COLOR = 0xffd700;
const CONTROLS_BG_COLOR = "rgba(0, 0, 0, 0.3)";
const CONTROLS_HOVER_COLOR = "rgba(0, 0, 0, 0.5)";

let isFullscreen = false;

// Maze 3D rendering using Three.js
let scene, camera, renderer;
let mazeGroup; // Group to contain all maze elements
let playerMesh; // Player mesh in 3D
let finishMesh; // Finish point mesh in 3D
let cameraAngle = Math.PI / 2.5; // Changed to a more top-down angle
let cameraDistance = 70; // Default camera distance
let view = "2d"; // Track current view mode

// Initialize the 3D scene
function init3DMaze() {
  const container = document.getElementById("maze3d");

  // Clear existing content
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY_COLOR);

  // Get current maze dimensions from MazeData
  const mazeWidth = MazeData.getWidth();
  const mazeHeight = MazeData.getHeight();

  // Adjust camera distance based on maze size
  cameraDistance = Math.max(
    70,
    Math.max(mazeWidth, mazeHeight) * CELL_SIZE_3D * 0.8
  );

  // Create camera
  camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );

  // Position camera initially
  updateCameraPosition();

  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Add lighting
  const ambientLight = new THREE.AmbientLight(
    0xffffff,
    AMBIENT_LIGHT_INTENSITY
  );
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(
    0xffffff,
    DIRECTIONAL_LIGHT_INTENSITY
  );
  directionalLight.position.set(
    DIRECTIONAL_LIGHT_POSITION.x,
    DIRECTIONAL_LIGHT_POSITION.y,
    DIRECTIONAL_LIGHT_POSITION.z
  );
  scene.add(directionalLight);

  // Create the maze in 3D
  create3DMaze();

  // 移除了原来的地面创建代码，因为现在地面是在create3DMaze中创建的

  // Add mouse controls
  setupMouseControls();

  // Add event listeners for touch control
  if (isTouchDevice) {
    setupTouchControls();
  }

  // Create fullscreen button
  const fullscreenBtn = document.createElement("button");
  fullscreenBtn.className = "fullscreen-btn";
  fullscreenBtn.innerHTML = "⛶";
  fullscreenBtn.addEventListener("click", toggleFullscreen);
  container.appendChild(fullscreenBtn);

  // Force camera and renderer update after initialization
  handle3DResize();

  // Start animation loop
  animate();
}

// Create the 3D representation of the maze
function create3DMaze() {
  // Create a group to hold all maze elements
  if (mazeGroup) {
    scene.remove(mazeGroup);
  }

  mazeGroup = new THREE.Group();
  scene.add(mazeGroup);

  const maze = MazeData.getMaze();
  const mazeWidth = MazeData.getWidth();
  const mazeHeight = MazeData.getHeight();
  const playerPos = MazeData.getPlayerPosition();
  const finishPos = MazeData.getFinishPosition();

  // 计算迷宫的中心点偏移量，使迷宫居中
  const offsetX = -(mazeWidth * CELL_SIZE_3D) / 2;
  const offsetZ = -(mazeHeight * CELL_SIZE_3D) / 2;

  // Wall materials
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: WALL_COLOR,
    metalness: WALL_METALNESS,
    roughness: WALL_ROUGHNESS,
  });

  // Outer wall material with different color
  const outerWallMaterial = new THREE.MeshStandardMaterial({
    color: OUTER_WALL_COLOR,
    metalness: OUTER_WALL_METALNESS,
    roughness: OUTER_WALL_ROUGHNESS,
  });

  // Create walls using MazeData
  for (let y = 0; y < mazeHeight; y++) {
    for (let x = 0; x < mazeWidth; x++) {
      const cell = maze[y][x];

      // Top wall
      if (cell.top) {
        const wallGeometry = new THREE.BoxGeometry(
          CELL_SIZE_3D,
          WALL_HEIGHT,
          WALL_THICKNESS
        );
        const material = y === 0 ? outerWallMaterial : wallMaterial;
        const wall = new THREE.Mesh(wallGeometry, material);
        wall.position.set(
          x * CELL_SIZE_3D + CELL_SIZE_3D / 2 + offsetX,
          WALL_HEIGHT / 2,
          y * CELL_SIZE_3D + offsetZ
        );
        mazeGroup.add(wall);
      }

      // Left wall
      if (cell.left) {
        const wallGeometry = new THREE.BoxGeometry(
          WALL_THICKNESS,
          WALL_HEIGHT,
          CELL_SIZE_3D
        );
        const material = x === 0 ? outerWallMaterial : wallMaterial;
        const wall = new THREE.Mesh(wallGeometry, material);
        wall.position.set(
          x * CELL_SIZE_3D + offsetX,
          WALL_HEIGHT / 2,
          y * CELL_SIZE_3D + CELL_SIZE_3D / 2 + offsetZ
        );
        mazeGroup.add(wall);
      }

      // Add right wall for the last column
      if (x === mazeWidth - 1 && cell.right) {
        const wallGeometry = new THREE.BoxGeometry(
          WALL_THICKNESS,
          WALL_HEIGHT,
          CELL_SIZE_3D
        );
        const wall = new THREE.Mesh(wallGeometry, outerWallMaterial);
        wall.position.set(
          (x + 1) * CELL_SIZE_3D + offsetX,
          WALL_HEIGHT / 2,
          y * CELL_SIZE_3D + CELL_SIZE_3D / 2 + offsetZ
        );
        mazeGroup.add(wall);
      }

      // Add bottom wall for the last row
      if (y === mazeHeight - 1 && cell.bottom) {
        const wallGeometry = new THREE.BoxGeometry(
          CELL_SIZE_3D,
          WALL_HEIGHT,
          WALL_THICKNESS
        );
        const wall = new THREE.Mesh(wallGeometry, outerWallMaterial);
        wall.position.set(
          x * CELL_SIZE_3D + CELL_SIZE_3D / 2 + offsetX,
          WALL_HEIGHT / 2,
          (y + 1) * CELL_SIZE_3D + offsetZ
        );
        mazeGroup.add(wall);
      }
    }
  }

  // Create player
  const playerGeometry = new THREE.SphereGeometry(PLAYER_RADIUS, 32, 32);
  const playerMaterial = new THREE.MeshStandardMaterial({
    color: PLAYER_COLOR,
  });
  playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
  playerMesh.position.set(
    playerPos.x * CELL_SIZE_3D + CELL_SIZE_3D / 2 + offsetX,
    PLAYER_HEIGHT,
    playerPos.y * CELL_SIZE_3D + CELL_SIZE_3D / 2 + offsetZ
  );
  mazeGroup.add(playerMesh);

  // Create finish point
  const finishGeometry = new THREE.CylinderGeometry(
    FINISH_POINT_RADIUS,
    FINISH_POINT_RADIUS,
    FINISH_POINT_HEIGHT,
    32
  );
  const finishMaterial = new THREE.MeshStandardMaterial({
    color: FINISH_COLOR,
  });
  finishMesh = new THREE.Mesh(finishGeometry, finishMaterial);
  finishMesh.position.set(
    finishPos.x * CELL_SIZE_3D + CELL_SIZE_3D / 2 + offsetX,
    FINISH_POINT_HEIGHT / 2,
    finishPos.y * CELL_SIZE_3D + CELL_SIZE_3D / 2 + offsetZ
  );
  mazeGroup.add(finishMesh);

  // Add a star shape above the finish point
  const starShape = new THREE.Shape();

  // Define star points
  for (let i = 0; i < STAR_POINTS; i++) {
    const radius = i % 2 === 0 ? STAR_SIZE : STAR_SIZE / 2;
    const angle = (Math.PI / 5) * i;
    if (i === 0) {
      starShape.moveTo(radius * Math.cos(angle), radius * Math.sin(angle));
    } else {
      starShape.lineTo(radius * Math.cos(angle), radius * Math.sin(angle));
    }
  }
  starShape.closePath();

  const extrudeSettings = {
    depth: STAR_DEPTH,
    bevelEnabled: false,
  };

  const starGeometry = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
  const starMaterial = new THREE.MeshStandardMaterial({ color: FINISH_COLOR });
  const star = new THREE.Mesh(starGeometry, starMaterial);
  star.position.set(
    finishPos.x * CELL_SIZE_3D + CELL_SIZE_3D / 2 + offsetX,
    STAR_HEIGHT,
    finishPos.y * CELL_SIZE_3D + CELL_SIZE_3D / 2 + offsetZ
  );
  star.rotation.x = -Math.PI / 2;
  mazeGroup.add(star);

  // 创建居中的地面 - 使用BoxGeometry代替PlaneGeometry避免旋转问题
  const floorGeometry = new THREE.BoxGeometry(
    mazeWidth * CELL_SIZE_3D,
    0.5, // 地面厚度
    mazeHeight * CELL_SIZE_3D
  );
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: FLOOR_COLOR,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.set(0, FLOOR_OFFSET, 0);
  // 给地面添加一个标识，以便在动画循环中识别
  floor.userData.isFloor = true;
  mazeGroup.add(floor);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update player position in 3D
  if (playerMesh) {
    const playerPos = MazeData.getPlayerPosition();
    const mazeWidth = MazeData.getWidth();
    const mazeHeight = MazeData.getHeight();

    // 计算偏移量，使迷宫居中
    const offsetX = -(mazeWidth * CELL_SIZE_3D) / 2;
    const offsetZ = -(mazeHeight * CELL_SIZE_3D) / 2;

    playerMesh.position.x =
      playerPos.x * CELL_SIZE_3D + CELL_SIZE_3D / 2 + offsetX;
    playerMesh.position.z =
      playerPos.y * CELL_SIZE_3D + CELL_SIZE_3D / 2 + offsetZ;

    // Add a small bouncing animation to the player
    playerMesh.position.y =
      PLAYER_HEIGHT +
      Math.sin(Date.now() * PLAYER_BOUNCE_SPEED) * PLAYER_BOUNCE_HEIGHT;

    // Check if player has reached the finish point
    if (MazeData.isAtFinish()) {
      // Show celebration directly without relying on 2D function
      playerMesh = null; // Remove player mesh to avoid further updates
      showCelebration();
    }
  }

  // 只旋转星星，不旋转地面
  if (mazeGroup) {
    // 查找星星并旋转它
    mazeGroup.children.forEach((child) => {
      // 通过几何体类型或位置来识别星星
      if (child.geometry instanceof THREE.ExtrudeGeometry) {
        child.rotation.z += STAR_ROTATION_SPEED;
      }
    });
  }

  renderer.render(scene, camera);
}

// Update function to show celebration screen
function showCelebration() {
  // Only show celebration once
  if (document.getElementById("celebration")) {
    document.getElementById("celebration").style.display = "flex";
    return;
  }

  // Create a completely new celebration element
  const celebrationElement = document.createElement("div");
  celebrationElement.id = "celebration";

  // Style the celebration container
  celebrationElement.style.position = "fixed";
  celebrationElement.style.top = "0";
  celebrationElement.style.left = "0";
  celebrationElement.style.width = "100%";
  celebrationElement.style.height = "100%";
  celebrationElement.style.display = "flex";
  celebrationElement.style.flexDirection = "column";
  celebrationElement.style.justifyContent = "center";
  celebrationElement.style.alignItems = "center";
  celebrationElement.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  celebrationElement.style.color = "#fff";
  celebrationElement.style.zIndex = CELEBRATION_Z_INDEX;

  // Create content for the celebration
  const heading = document.createElement("h1");
  heading.textContent = "Congratulations!";
  heading.style.fontSize = "3rem";
  heading.style.marginBottom = "1rem";

  const message = document.createElement("p");
  message.textContent = "You've solved the maze!";
  message.style.fontSize = "1.5rem";
  message.style.marginBottom = "2rem";

  const newGameBtn = document.createElement("button");
  newGameBtn.textContent = "New Game";
  newGameBtn.style.padding = "1rem 2rem";
  newGameBtn.style.fontSize = "1.2rem";
  newGameBtn.style.backgroundColor = "#4CAF50";
  newGameBtn.style.color = "white";
  newGameBtn.style.border = "none";
  newGameBtn.style.borderRadius = "5px";
  newGameBtn.style.cursor = "pointer";
  newGameBtn.addEventListener("click", () => {
    document.body.removeChild(celebrationElement);
    createNewMaze();
  });

  // Append elements to the celebration container
  celebrationElement.appendChild(heading);
  celebrationElement.appendChild(message);
  celebrationElement.appendChild(newGameBtn);

  // Append to document body (not inside the maze container)
  document.body.appendChild(celebrationElement);
}

// Update camera position based on current angle and distance
function updateCameraPosition() {
  // 相机始终看向原点(0,0,0)，这是迷宫的中心
  camera.position.x = 0;
  camera.position.y = Math.sin(cameraAngle) * cameraDistance;
  camera.position.z = Math.cos(cameraAngle) * cameraDistance;

  camera.lookAt(0, 0, 0);
}

// Handle window resize with more robust handling
function handle3DResize() {
  if (camera && renderer) {
    const container = document.getElementById("maze3d");

    // Get dimensions that account for any parent container sizing
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width > 0 && height > 0) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.render(scene, camera);
    }
  }
}

// Setup touch controls for mobile devices
function setupTouchControls() {
  const container = document.getElementById("maze3d");
  let lastTouchY = 0;

  container.addEventListener("touchstart", (e) => {
    lastTouchY = e.touches[0].clientY;
    e.preventDefault();
  });

  container.addEventListener("touchmove", (e) => {
    const currentTouchY = e.touches[0].clientY;
    const deltaY = currentTouchY - lastTouchY;

    cameraAngle = Math.max(
      CAMERA_MIN_ANGLE,
      Math.min(
        CAMERA_MAX_ANGLE,
        cameraAngle - deltaY * CAMERA_ANGLE_SENSITIVITY
      )
    );

    updateCameraPosition();
    lastTouchY = currentTouchY;
    e.preventDefault();
  });
}

// Add mouse controls setup function
function setupMouseControls() {
  const container = document.getElementById("maze3d");
  let isMouseDown = false;
  let lastMouseY = 0;

  container.addEventListener("mousedown", (e) => {
    isMouseDown = true;
    lastMouseY = e.clientY;
  });

  container.addEventListener("mousemove", (e) => {
    if (!isMouseDown) return;

    const deltaY = e.clientY - lastMouseY;

    // Only adjust vertical angle
    cameraAngle = Math.max(
      CAMERA_MIN_ANGLE,
      Math.min(
        CAMERA_MAX_ANGLE,
        cameraAngle - deltaY * CAMERA_ANGLE_SENSITIVITY
      )
    );

    updateCameraPosition();
    lastMouseY = e.clientY;
  });

  container.addEventListener("mouseup", () => {
    isMouseDown = false;
  });

  container.addEventListener("mouseleave", () => {
    isMouseDown = false;
  });

  // Keep zoom functionality
  container.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      cameraDistance = Math.min(
        CAMERA_MAX_DISTANCE,
        cameraDistance + CAMERA_ZOOM_STEP
      );
    } else {
      cameraDistance = Math.max(
        CAMERA_MIN_DISTANCE,
        cameraDistance - CAMERA_ZOOM_STEP
      );
    }
    updateCameraPosition();
  });
}

// Handle keyboard input for camera control and player movement
document.addEventListener("keydown", (e) => {
  if (view !== "3d") return;

  switch (e.key) {
    case "ArrowLeft":
      movePlayer(Direction.LEFT);
      break;
    case "ArrowRight":
      movePlayer(Direction.RIGHT);
      break;
    case "ArrowUp":
      movePlayer(Direction.UP);
      break;
    case "ArrowDown":
      movePlayer(Direction.DOWN);
      break;
    case "+":
    case "=":
      cameraDistance = Math.max(
        CAMERA_MIN_DISTANCE,
        cameraDistance - CAMERA_ZOOM_STEP
      );
      updateCameraPosition();
      break;
    case "-":
      cameraDistance = Math.min(
        CAMERA_MAX_DISTANCE,
        cameraDistance + CAMERA_ZOOM_STEP
      );
      updateCameraPosition();
      break;
  }
});

// Add event listener for window resize
window.addEventListener("resize", handle3DResize);

// Switch to 3D view
function switchTo3DView() {
  view = "3d";
  document.getElementById("maze").style.display = "none";
  document.getElementById("maze3d").style.display = "block";

  // Force a resize to update renderer dimensions
  setTimeout(() => {
    handle3DResize();
  }, 50);
}

// Switch to 2D view
function switchTo2DView() {
  view = "2d";
  document.getElementById("maze3d").style.display = "none";
  document.getElementById("maze").style.display = "block";

  // Make sure the 2D view is up-to-date
  Maze2D.render2DMaze();
}

// Make these functions available to other modules
window.Maze3D = {
  init3DMaze,
  create3DMaze,
  switchTo3DView,
  switchTo2DView,
  handle3DResize,
};

function toggleFullscreen() {
  const maze3dContainer = document.getElementById("maze3d");
  isFullscreen = !isFullscreen;

  if (isFullscreen) {
    // Save the original styles before modifying
    maze3dContainer.dataset.originalPosition =
      maze3dContainer.style.position || "";
    maze3dContainer.dataset.originalTop = maze3dContainer.style.top || "";
    maze3dContainer.dataset.originalLeft = maze3dContainer.style.left || "";
    maze3dContainer.dataset.originalWidth = maze3dContainer.style.width || "";
    maze3dContainer.dataset.originalHeight = maze3dContainer.style.height || "";
    maze3dContainer.dataset.originalZIndex = maze3dContainer.style.zIndex || "";
    maze3dContainer.dataset.originalBgColor =
      maze3dContainer.style.backgroundColor || "";

    // Apply custom fullscreen styles
    maze3dContainer.style.position = FULLSCREEN_POSITION_STYLES.position;
    maze3dContainer.style.top = FULLSCREEN_POSITION_STYLES.top;
    maze3dContainer.style.left = FULLSCREEN_POSITION_STYLES.left;
    maze3dContainer.style.width = FULLSCREEN_POSITION_STYLES.width;
    maze3dContainer.style.height = FULLSCREEN_POSITION_STYLES.height;
    maze3dContainer.style.zIndex = FULLSCREEN_POSITION_STYLES.zIndex;
    maze3dContainer.style.backgroundColor =
      FULLSCREEN_POSITION_STYLES.backgroundColor;

    maze3dContainer.classList.add("fullscreen");

    // Add a close button for better UX in custom fullscreen mode
    if (!document.getElementById("custom-fullscreen-close")) {
      const closeBtn = document.createElement("button");
      closeBtn.id = "custom-fullscreen-close";
      closeBtn.innerHTML = "✕";
      closeBtn.style.position = "absolute";
      closeBtn.style.top = "10px";
      closeBtn.style.right = "10px";
      closeBtn.style.zIndex = (CUSTOM_FULLSCREEN_Z_INDEX + 1).toString();
      closeBtn.style.padding = "10px";
      closeBtn.style.background = CONTROLS_BG_COLOR;
      closeBtn.style.color = "#ffffff";
      closeBtn.style.border = "none";
      closeBtn.style.borderRadius = "5px";
      closeBtn.style.cursor = "pointer";
      closeBtn.addEventListener("click", toggleFullscreen);
      maze3dContainer.appendChild(closeBtn);
    }

    // Check if there's a celebration screen and make sure it's above everything
    const celebrationElement = document.getElementById("celebration");
    if (celebrationElement) {
      // Remove it from its current position and re-add it to the body
      if (celebrationElement.parentNode) {
        celebrationElement.parentNode.removeChild(celebrationElement);
      }

      celebrationElement.style.zIndex = CELEBRATION_Z_INDEX;
      document.body.appendChild(celebrationElement);
    }
  } else {
    // Restore original styles
    maze3dContainer.style.position = maze3dContainer.dataset.originalPosition;
    maze3dContainer.style.top = maze3dContainer.dataset.originalTop;
    maze3dContainer.style.left = maze3dContainer.dataset.originalLeft;
    maze3dContainer.style.width = maze3dContainer.dataset.originalWidth;
    maze3dContainer.style.height = maze3dContainer.dataset.originalHeight;
    maze3dContainer.style.zIndex = maze3dContainer.dataset.originalZIndex;
    maze3dContainer.style.backgroundColor =
      maze3dContainer.dataset.originalBgColor;

    maze3dContainer.classList.remove("fullscreen");

    // Remove the close button if it exists
    const closeBtn = document.getElementById("custom-fullscreen-close");
    if (closeBtn) {
      closeBtn.remove();
    }
  }

  // Force a resize to update renderer dimensions
  setTimeout(handle3DResize, 100);
}
