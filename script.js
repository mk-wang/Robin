document.addEventListener("DOMContentLoaded", () => {
  const mazeElement = document.getElementById("maze");
  const maze3dElement = document.getElementById("maze3d");
  const playerElement = document.getElementById("player");
  const finishElement = document.getElementById("finish");
  const stepsElement = document.getElementById("steps");
  const celebrationElement = document.getElementById("celebration");
  const playAgainButton = document.getElementById("play-again");
  const newGameButton = document.getElementById("new-game");
  const modeSwitchButton = document.getElementById("mode-switch");
  const muteButton = document.getElementById("mute-button");
  const joystickContainer = document.getElementById("joystick-container");
  const joystickThumb = document.getElementById("joystick-thumb");
  const joystickBase = document.getElementById("joystick-base");

  // Game variables
  let maze = [];
  const cellSize = 30;
  let mazeWidth = 8;
  let mazeHeight = 8;
  let playerPosition = { x: 0, y: 0 };
  let finishPosition = { x: mazeWidth - 1, y: mazeHeight - 1 };
  let steps = 0;
  let is3DMode = false;
  let isMuted = false;
  let isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  let scene,
    camera,
    renderer,
    walls = [];

  // Camera control variables
  let cameraRotation = { x: 0, y: 0 };
  let touchStartPosition = { x: 0, y: 0 };
  let isCameraMoving = false;

  // Audio elements
  const moveSound = new Audio(
    "https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3"
  );
  const winSound = new Audio(
    "https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3"
  );
  const wallSound = new Audio(
    "https://assets.mixkit.co/sfx/preview/mixkit-game-show-buzz-in-3090.mp3"
  );
  const switchSound = new Audio(
    "https://assets.mixkit.co/sfx/preview/mixkit-quick-jump-arcade-game-239.mp3"
  );

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

    // If in 3D mode, re-initialize the 3D scene
    if (is3DMode) {
      init3DMaze();
    }
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
    // Update 2D player element position
    if (!is3DMode) {
      playerElement.style.left = `${
        playerPosition.x * cellSize + (cellSize - playerElement.offsetWidth) / 2
      }px`;
      playerElement.style.top = `${
        playerPosition.y * cellSize +
        (cellSize - playerElement.offsetHeight) / 2
      }px`;
    }

    // Update 3D camera position if in 3D mode
    if (is3DMode && camera && renderer) {
      camera.position.x = (playerPosition.x + 0.5) * 10;
      camera.position.z = (playerPosition.y + 0.5) * 10;
      updateCameraDirection();
    }

    // Check if player reached the finish
    checkWinCondition();
  }

  // New function to check win condition
  function checkWinCondition() {
    if (
      playerPosition.x === finishPosition.x &&
      playerPosition.y === finishPosition.y
    ) {
      if (!isMuted) {
        winSound.play();
      }
      setTimeout(() => celebrate(), 300); // Small delay for better visual feedback
    }
  }

  // Move player in specified direction if possible
  function movePlayer(direction) {
    const currentCell = maze[playerPosition.y][playerPosition.x];
    let moved = false;

    if (direction === "up" && !currentCell.top) {
      playerPosition.y--;
      steps++;
      moved = true;
    } else if (direction === "right" && !currentCell.right) {
      playerPosition.x++;
      steps++;
      moved = true;
    } else if (direction === "down" && !currentCell.bottom) {
      playerPosition.y++;
      steps++;
      moved = true;
    } else if (direction === "left" && !currentCell.left) {
      playerPosition.x--;
      steps++;
      moved = true;
    }

    if (moved) {
      if (!isMuted) {
        moveSound.currentTime = 0;
        moveSound.play();
      }
    } else {
      if (!isMuted) {
        wallSound.currentTime = 0;
        wallSound.play();
      }
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

    // Create more balloons for a fuller effect
    for (let i = 0; i < 50; i++) {
      const balloon = document.createElement("div");
      balloon.className = "balloon";
      balloon.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];
      balloon.style.left = `${Math.random() * 100}%`;
      balloon.style.animationDelay = `${Math.random() * 3}s`; // Shorter delay for more immediate effect
      balloon.style.animationDuration = `${8 + Math.random() * 7}s`; // Slightly longer duration
      balloon.style.width = `${20 + Math.random() * 20}px`; // Varied balloon sizes
      balloon.style.height = `${30 + Math.random() * 20}px`;
      balloonsContainer.appendChild(balloon);
    }

    // Ensure the Play Again button is focused for accessibility and visual clarity
    setTimeout(() => {
      playAgainButton.focus();
    }, 500);

    // Play celebration sound with a bit more volume
    if (!isMuted) {
      winSound.volume = 0.8;
      winSound.play();
    }
  }

  // Initialize 3D mode
  function init3DMaze() {
    // Clear previous scene if it exists
    while (maze3dElement.firstChild) {
      maze3dElement.removeChild(maze3dElement.firstChild);
    }

    // Create a scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue background

    // Create a camera
    camera = new THREE.PerspectiveCamera(
      75,
      maze3dElement.offsetWidth / maze3dElement.offsetHeight,
      0.1,
      1000
    );
    camera.position.set(5, 3, 5); // Set initial camera position
    camera.lookAt(
      new THREE.Vector3((mazeWidth * 10) / 2, 0, (mazeHeight * 10) / 2)
    );

    // Reset camera rotation
    cameraRotation = { x: 0, y: 0 };

    // Create a renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(maze3dElement.offsetWidth, maze3dElement.offsetHeight);
    maze3dElement.appendChild(renderer.domElement);

    // Add camera hint for touch devices
    const cameraHint = document.createElement("div");
    cameraHint.id = "camera-hint";
    cameraHint.className = "camera-hint";
    cameraHint.textContent = "Swipe to look around";
    maze3dElement.appendChild(cameraHint);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(
      mazeWidth * 10,
      mazeHeight * 10
    );
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x8bc34a,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    floor.position.set((mazeWidth * 10) / 2 - 5, 0, (mazeHeight * 10) / 2 - 5);
    scene.add(floor);

    // Create maze walls
    const wallGeometry = new THREE.BoxGeometry(10, 5, 1);
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x3f51b5,
      roughness: 0.5,
      metalness: 0.3,
    });

    walls = [];

    // Add walls based on the maze structure
    for (let y = 0; y < mazeHeight; y++) {
      for (let x = 0; x < mazeWidth; x++) {
        const cell = maze[y][x];

        // Top wall
        if (cell.top) {
          const topWall = new THREE.Mesh(wallGeometry, wallMaterial);
          topWall.position.set(x * 10 + 5, 2.5, y * 10);
          topWall.rotation.y = Math.PI / 2;
          scene.add(topWall);
          walls.push(topWall);
        }

        // Left wall
        if (cell.left) {
          const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
          leftWall.position.set(x * 10, 2.5, y * 10 + 5);
          scene.add(leftWall);
          walls.push(leftWall);
        }

        // Right wall at the edge
        if (x === mazeWidth - 1 && cell.right) {
          const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
          rightWall.position.set((x + 1) * 10, 2.5, y * 10 + 5);
          scene.add(rightWall);
          walls.push(rightWall);
        }

        // Bottom wall at the edge
        if (y === mazeHeight - 1 && cell.bottom) {
          const bottomWall = new THREE.Mesh(wallGeometry, wallMaterial);
          bottomWall.position.set(x * 10 + 5, 2.5, (y + 1) * 10);
          bottomWall.rotation.y = Math.PI / 2;
          scene.add(bottomWall);
          walls.push(bottomWall);
        }
      }
    }

    // Add finish marker
    const finishGeometry = new THREE.CylinderGeometry(2, 2, 0.5, 32);
    const finishMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 }); // Gold
    const finishMarker = new THREE.Mesh(finishGeometry, finishMaterial);
    finishMarker.position.set(
      finishPosition.x * 10 + 5,
      0.25,
      finishPosition.y * 10 + 5
    );
    scene.add(finishMarker);

    // Set up camera position
    camera.position.x = (playerPosition.x + 0.5) * 10;
    camera.position.y = 3; // Eye level
    camera.position.z = (playerPosition.y + 0.5) * 10;
    updateCameraDirection();

    // Render the scene
    renderer.render(scene, camera);

    // Set up touch events for camera control
    setupCameraControls();

    // Handle window resize
    window.addEventListener("resize", on3DResize);
  }

  function on3DResize() {
    if (is3DMode && camera && renderer) {
      camera.aspect = maze3dElement.offsetWidth / maze3dElement.offsetHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(maze3dElement.offsetWidth, maze3dElement.offsetHeight);
      renderer.render(scene, camera);
    }
  }

  // Function to update the camera direction based on rotation
  function updateCameraDirection() {
    if (!is3DMode || !camera || !renderer) return;

    // Limit vertical rotation to avoid flipping
    cameraRotation.y = Math.max(
      -Math.PI / 2.5,
      Math.min(Math.PI / 2.5, cameraRotation.y)
    );

    // Calculate direction vector
    const direction = new THREE.Vector3();
    direction.x = Math.sin(cameraRotation.x) * Math.cos(cameraRotation.y);
    direction.y = Math.sin(cameraRotation.y);
    direction.z = Math.cos(cameraRotation.x) * Math.cos(cameraRotation.y);

    // Update camera target
    const playerX = (playerPosition.x + 0.5) * 10;
    const playerY = 3; // Eye level
    const playerZ = (playerPosition.y + 0.5) * 10;

    camera.position.set(playerX, playerY, playerZ);
    camera.lookAt(
      new THREE.Vector3(
        playerX + direction.x * 10,
        playerY + direction.y * 10,
        playerZ + direction.z * 10
      )
    );

    // Render the updated scene
    renderer.render(scene, camera);
  }

  // Set up touch events for camera controls
  function setupCameraControls() {
    const canvas = renderer.domElement;

    // Remove any existing event listeners to prevent duplicates
    canvas.removeEventListener("touchstart", handleTouchStart);
    canvas.removeEventListener("touchmove", handleTouchMove);
    canvas.removeEventListener("touchend", handleTouchEnd);
    canvas.removeEventListener("mousedown", handleMouseDown);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    // Add new event listeners
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
    canvas.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }

  function handleTouchStart(event) {
    if (event.touches.length === 1 && is3DMode) {
      event.preventDefault();
      isCameraMoving = true;
      touchStartPosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    }
  }

  function handleTouchMove(event) {
    if (isCameraMoving && is3DMode && event.touches.length === 1) {
      event.preventDefault();
      const touchX = event.touches[0].clientX;
      const touchY = event.touches[0].clientY;

      // Calculate the difference from the start position
      const deltaX = touchX - touchStartPosition.x;
      const deltaY = touchY - touchStartPosition.y;

      // Update rotation based on touch movement
      // Higher sensitivity for iPad/tablets vs phone
      const sensitivity = 0.005;
      cameraRotation.x -= deltaX * sensitivity;
      cameraRotation.y -= deltaY * sensitivity;

      // Update camera direction
      updateCameraDirection();

      // Update start position for next move
      touchStartPosition = {
        x: touchX,
        y: touchY,
      };
    }
  }

  function handleTouchEnd(event) {
    isCameraMoving = false;
  }

  function handleMouseDown(event) {
    if (is3DMode) {
      isCameraMoving = true;
      touchStartPosition = {
        x: event.clientX,
        y: event.clientY,
      };
    }
  }

  function handleMouseMove(event) {
    if (isCameraMoving && is3DMode) {
      const mouseX = event.clientX;
      const mouseY = event.clientY;

      // Calculate the difference from the start position
      const deltaX = mouseX - touchStartPosition.x;
      const deltaY = mouseY - touchStartPosition.y;

      // Update rotation based on mouse movement
      const sensitivity = 0.005;
      cameraRotation.x -= deltaX * sensitivity;
      cameraRotation.y -= deltaY * sensitivity;

      // Update camera direction
      updateCameraDirection();

      // Update start position for next move
      touchStartPosition = {
        x: mouseX,
        y: mouseY,
      };
    }
  }

  function handleMouseUp() {
    isCameraMoving = false;
  }

  // Toggle between 2D and 3D modes
  function toggleMode() {
    is3DMode = !is3DMode;

    if (!isMuted) {
      switchSound.play();
    }

    if (is3DMode) {
      modeSwitchButton.textContent = "3D Mode";
      maze3dElement.classList.remove("hidden");
      mazeElement.classList.add("hidden");
      playerElement.classList.add("hidden");
      finishElement.classList.add("hidden");

      // Initialize 3D mode if not already done
      init3DMaze();

      // If it's a touch device, show the joystick in 3D mode
      if (isTouchDevice) {
        joystickContainer.classList.remove("hidden");
      }
    } else {
      modeSwitchButton.textContent = "2D Mode";
      maze3dElement.classList.add("hidden");
      mazeElement.classList.remove("hidden");
      playerElement.classList.remove("hidden");
      finishElement.classList.remove("hidden");
      joystickContainer.classList.add("hidden");

      // Stop any ongoing camera movement
      isCameraMoving = false;

      // Clean up event handlers
      cleanupCameraControls();
    }

    // Update player position for the current mode
    updatePlayerPosition();
  }

  // Clean up camera control event listeners when switching to 2D mode
  function cleanupCameraControls() {
    if (!renderer) return;

    const canvas = renderer.domElement;
    canvas.removeEventListener("touchstart", handleTouchStart);
    canvas.removeEventListener("touchmove", handleTouchMove);
    canvas.removeEventListener("touchend", handleTouchEnd);
    canvas.removeEventListener("mousedown", handleMouseDown);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }

  // Toggle sound mute
  function toggleMute() {
    isMuted = !isMuted;
    muteButton.textContent = isMuted ? "🔇" : "🔊";
  }

  // Set up touch joystick for iPad
  function setupJoystick() {
    let isDragging = false;
    let moveDirection = null;
    const baseRect = joystickBase.getBoundingClientRect();
    const baseX = baseRect.left + baseRect.width / 2;
    const baseY = baseRect.top + baseRect.height / 2;

    // Initialize joystick position
    resetJoystick();

    function resetJoystick() {
      joystickThumb.style.transform = "translate(-50%, -50%)";
      moveDirection = null;
    }

    function handleStart(e) {
      e.preventDefault();
      isDragging = true;
      handleMove(e);
    }

    function handleMove(e) {
      if (!isDragging) return;

      // Get touch or mouse position
      const clientX = e.type.includes("touch")
        ? e.touches[0].clientX
        : e.clientX;
      const clientY = e.type.includes("touch")
        ? e.touches[0].clientY
        : e.clientY;

      // Calculate distance from center
      const deltaX = clientX - baseX;
      const deltaY = clientY - baseY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const angle = Math.atan2(deltaY, deltaX);

      // Limit the joystick movement radius
      const maxRadius = baseRect.width / 2;
      const limitedDistance = Math.min(distance, maxRadius);

      // Calculate limited position
      const limitedX = limitedDistance * Math.cos(angle);
      const limitedY = limitedDistance * Math.sin(angle);

      // Move joystick thumb
      joystickThumb.style.transform = `translate(calc(-50% + ${limitedX}px), calc(-50% + ${limitedY}px))`;

      // Determine direction based on angle
      const radToDeg = angle * (180 / Math.PI);

      if (limitedDistance > maxRadius * 0.3) {
        // Add a small deadzone
        if (radToDeg > -45 && radToDeg < 45) moveDirection = "right";
        else if (radToDeg >= 45 && radToDeg < 135) moveDirection = "down";
        else if (radToDeg >= -135 && radToDeg < -45) moveDirection = "up";
        else moveDirection = "left";
      } else {
        moveDirection = null;
      }
    }

    function handleEnd(e) {
      e.preventDefault();
      isDragging = false;
      resetJoystick();
    }

    // Add event listeners for both touch and mouse
    joystickBase.addEventListener("touchstart", handleStart);
    joystickBase.addEventListener("mousedown", handleStart);
    document.addEventListener("touchmove", handleMove);
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("touchend", handleEnd);
    document.addEventListener("mouseup", handleEnd);

    // Process joystick input at fixed intervals
    setInterval(() => {
      if (moveDirection) {
        movePlayer(moveDirection);
      }
    }, 200); // 200ms interval for smooth movement
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
  modeSwitchButton.addEventListener("click", toggleMode);
  muteButton.addEventListener("click", toggleMute);

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
    } else if (e.key === "m") {
      toggleMode();
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

    // Update 3D renderer if in 3D mode
    on3DResize();
  }

  // Check for resize
  window.addEventListener("resize", resizeGame);

  // Initialize finish position immediately to make sure it's not at the start
  finishPosition = { x: mazeWidth - 1, y: mazeHeight - 1 };

  // Make sure celebration is hidden initially - using both methods to ensure it's hidden
  celebrationElement.style.display = "none";
  celebrationElement.classList.add("hidden");

  // Set up joystick for touch devices
  if (isTouchDevice) {
    setupJoystick();
  } else {
    joystickContainer.classList.add("hidden");
  }

  // Detect iPad specifically
  const isIPad =
    /iPad/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // Apply iPad-specific optimizations
  if (isIPad) {
    document.body.classList.add("ipad");
  }

  // Initialize and resize
  resizeGame();
  initGame();
});
