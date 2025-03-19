// Maze 3D rendering using Three.js
let scene, camera, renderer;
let mazeGroup; // Group to contain all maze elements
let playerMesh; // Player mesh in 3D
let finishMesh; // Finish point mesh in 3D
let cameraAngle = Math.PI / 2.5; // Changed to a more top-down angle
let cameraDistance = 50; // Default camera distance
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
  scene.background = new THREE.Color(0xf0f8ff); // Light blue sky color

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
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(0, 20, 10);
  scene.add(directionalLight);

  // Create the maze in 3D
  create3DMaze();

  // Create floor
  const floorGeometry = new THREE.PlaneGeometry(
    mazeWidth * 10 + 10,
    mazeHeight * 10 + 10
  );
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x8ed1fc,
    side: THREE.DoubleSide,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = Math.PI / 2;
  floor.position.set((mazeWidth * 10) / 2 - 5, -0.5, (mazeHeight * 10) / 2 - 5);
  scene.add(floor);

  // Add mouse controls
  setupMouseControls();

  // Add event listeners for touch control
  if (isTouchDevice) {
    setupTouchControls();
  }

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

  // Wall materials
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x6c5ce7,
    metalness: 0.2,
    roughness: 0.8,
  });

  // Outer wall material with different color
  const outerWallMaterial = new THREE.MeshStandardMaterial({
    color: 0xff3394, // 使用不同的颜色
    metalness: 0.3,
    roughness: 0.7,
  });

  // Create walls
  for (let y = 0; y < mazeHeight; y++) {
    for (let x = 0; x < mazeWidth; x++) {
      const cell = maze[y][x];

      // Top wall
      if (cell.top) {
        const wallGeometry = new THREE.BoxGeometry(10, 5, 1);
        const material = y === 0 ? outerWallMaterial : wallMaterial;
        const wall = new THREE.Mesh(wallGeometry, material);
        wall.position.set(x * 10 + 5, 2.5, y * 10);
        mazeGroup.add(wall);
      }

      // Left wall
      if (cell.left) {
        const wallGeometry = new THREE.BoxGeometry(1, 5, 10);
        const material = x === 0 ? outerWallMaterial : wallMaterial;
        const wall = new THREE.Mesh(wallGeometry, material);
        wall.position.set(x * 10, 2.5, y * 10 + 5);
        mazeGroup.add(wall);
      }

      // Add right wall for the last column
      if (x === mazeWidth - 1 && cell.right) {
        const wallGeometry = new THREE.BoxGeometry(1, 5, 10);
        const wall = new THREE.Mesh(wallGeometry, outerWallMaterial);
        wall.position.set((x + 1) * 10, 2.5, y * 10 + 5);
        mazeGroup.add(wall);
      }

      // Add bottom wall for the last row
      if (y === mazeHeight - 1 && cell.bottom) {
        const wallGeometry = new THREE.BoxGeometry(10, 5, 1);
        const wall = new THREE.Mesh(wallGeometry, outerWallMaterial);
        wall.position.set(x * 10 + 5, 2.5, (y + 1) * 10);
        mazeGroup.add(wall);
      }
    }
  }

  // Create player
  const playerGeometry = new THREE.SphereGeometry(2, 32, 32);
  const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
  playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
  playerMesh.position.set(
    playerPosition.x * 10 + 5,
    2,
    playerPosition.y * 10 + 5
  );
  mazeGroup.add(playerMesh);

  // Create finish point
  const finishGeometry = new THREE.CylinderGeometry(2, 2, 1, 32);
  const finishMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 });
  finishMesh = new THREE.Mesh(finishGeometry, finishMaterial);
  finishMesh.position.set(
    finishPosition.x * 10 + 5,
    0.5,
    finishPosition.y * 10 + 5
  );
  mazeGroup.add(finishMesh);

  // Add a star shape above the finish point
  const starShape = new THREE.Shape();
  const size = 3;

  // Define star points
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? size : size / 2;
    const angle = (Math.PI / 5) * i;
    if (i === 0) {
      starShape.moveTo(radius * Math.cos(angle), radius * Math.sin(angle));
    } else {
      starShape.lineTo(radius * Math.cos(angle), radius * Math.sin(angle));
    }
  }
  starShape.closePath();

  const extrudeSettings = {
    depth: 0.2,
    bevelEnabled: false,
  };

  const starGeometry = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
  const starMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 });
  const star = new THREE.Mesh(starGeometry, starMaterial);
  star.position.set(finishPosition.x * 10 + 5, 5, finishPosition.y * 10 + 5);
  star.rotation.x = -Math.PI / 2;
  mazeGroup.add(star);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update player position in 3D
  if (playerMesh) {
    playerMesh.position.x = playerPosition.x * 10 + 5;
    playerMesh.position.z = playerPosition.y * 10 + 5;

    // Add a small bouncing animation to the player
    playerMesh.position.y = 2 + Math.sin(Date.now() * 0.005) * 0.2;

    // Update camera position to follow player without changing the viewing angle
    updateCameraPosition();

    // Check if player has reached the finish point
    if (
      playerPosition.x === finishPosition.x &&
      playerPosition.y === finishPosition.y
    ) {
      // Show celebration directly without relying on 2D function
      playerMesh = null; // Remove player mesh to avoid further updates
      showCelebration();
    }
  }

  // Make the finish star rotate
  if (mazeGroup && mazeGroup.children.length > 0) {
    const star = mazeGroup.children[mazeGroup.children.length - 1];
    if (star) {
      star.rotation.z += 0.01;
    }
  }

  renderer.render(scene, camera);
}

// Update function to show celebration screen
function showCelebration() {
  // Only show celebration once
  if (document.getElementById("celebration").style.display === "flex") return;

  // Use the unified celebration function from controller.js
  createCelebration();
}

// Update camera position based on current angle and distance
function updateCameraPosition() {
  const centerX = (mazeWidth * 10) / 2;
  const centerZ = (mazeHeight * 10) / 2;

  // Always position camera at the center of maze
  camera.position.x = centerX;
  camera.position.y = Math.sin(cameraAngle) * cameraDistance;
  camera.position.z = centerZ + Math.cos(cameraAngle) * cameraDistance;

  camera.lookAt(centerX, 0, centerZ);
}

// Handle window resize
function handle3DResize() {
  if (camera && renderer) {
    const container = document.getElementById("maze3d");
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
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
      0.1,
      Math.min(Math.PI / 2 - 0.1, cameraAngle - deltaY * 0.01)
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
      0.1,
      Math.min(Math.PI / 2 - 0.1, cameraAngle - deltaY * 0.005)
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
      cameraDistance = Math.min(100, cameraDistance + 2);
    } else {
      cameraDistance = Math.max(10, cameraDistance - 2);
    }
    updateCameraPosition();
  });
}

// Handle keyboard input for camera control and player movement
document.addEventListener("keydown", (e) => {
  if (view !== "3d") return;

  switch (e.key) {
    case "ArrowLeft":
      movePlayer("left");
      break;
    case "ArrowRight":
      movePlayer("right");
      break;
    case "ArrowUp":
      movePlayer("up");
      break;
    case "ArrowDown":
      movePlayer("down");
      break;
    case "+":
    case "=":
      cameraDistance = Math.max(10, cameraDistance - 5);
      updateCameraPosition();
      break;
    case "-":
      cameraDistance = Math.min(100, cameraDistance + 5);
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

  // Initialize 3D maze if not already done
  if (!scene) {
    init3DMaze();
  } else {
    // Update the camera and maze if already initialized
    updateCameraPosition();
    create3DMaze();
  }

  // Make sure to update the player position in 3D
  if (playerMesh) {
    playerMesh.position.x = playerPosition.x * 10 + 5;
    playerMesh.position.z = playerPosition.y * 10 + 5;
  }
}

// Add this function to support switching to 2D view
function switchTo2DView() {
  view = "2d";
  document.getElementById("maze3d").style.display = "none";
  document.getElementById("maze").style.display = "block";

  // Ensure the 2D view is synchronized with the 3D position
  renderMaze();
  updatePlayerPosition();
}
