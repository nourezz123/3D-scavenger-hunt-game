import * as THREE from 'three';
import { GameManager } from './game/GameManager.js'; 
import { UIController } from './ui/UIController.js';  
import { CameraSystem } from './game/CameraSystem.js';
import { AudioManager } from './game/AudioManager.js';

class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.scene = new THREE.Scene();
        
        // Create main camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        this.container.appendChild(this.renderer.domElement);
        
        // Add some default lighting to scene
        this.addDefaultLighting();
        
        // Create audio manager
        this.audioManager = new AudioManager();
        
        // Create UI controller
        this.ui = new UIController();
        
        // Create game manager
        this.gameManager = new GameManager(this.scene, this.camera, this.ui, this.audioManager);
        
        // Create camera system (will be initialized after player is created)
        this.cameraSystem = null;
        
        this.clock = new THREE.Clock();
        this.previousTime = 0;
        
        this.setupEventListeners();
        this.setupGlobalControls();
        this.animate();
        
        console.log('Game initialized successfully!');
    }
    
    addDefaultLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        this.scene.add(directionalLight);
    }
    
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Game controls
        document.getElementById('btn-start').addEventListener('click', () => {
            this.audioManager.playButtonClick();
            this.gameManager.startGame();
            this.initializeCameraSystem();
        });
        
        document.getElementById('btn-continue').addEventListener('click', () => {
            this.audioManager.playButtonClick();
            this.gameManager.continueGame();
            this.initializeCameraSystem();
        });
        
        document.getElementById('btn-next').addEventListener('click', () => {
            this.audioManager.playButtonClick();
            this.gameManager.nextLevel();
        });
        
        document.getElementById('btn-menu').addEventListener('click', () => {
            this.audioManager.playButtonClick();
            this.gameManager.returnToMenu();
        });
        
        // Pause game with ESC
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && this.gameManager.isGameActive) {
                this.gameManager.togglePause();
            }
            
            // Debug: Toggle wireframe with 'F'
            if (e.code === 'KeyF') {
                this.toggleWireframe();
            }
            
            // Debug: Toggle stats with 'H'
            if (e.code === 'KeyH') {
                this.ui.toggleDebugStats();
            }
        });
    }
    
    setupGlobalControls() {
        // Fullscreen toggle
        document.addEventListener('keydown', (e) => {
            if (e.code === 'F11' || (e.altKey && e.code === 'Enter')) {
                e.preventDefault();
                this.toggleFullscreen();
            }
        });
        
        // Mute toggle with 'M'
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyM') {
                this.audioManager.toggleMute();
            }
        });
    }
    
    initializeCameraSystem() {
        if (this.gameManager.player && !this.cameraSystem) {
            this.cameraSystem = new CameraSystem(this.camera, this.gameManager.player);
            console.log('Camera system initialized');
        }
    }
    
    toggleWireframe() {
        this.scene.traverse((object) => {
            if (object.isMesh) {
                object.material.wireframe = !object.material.wireframe;
            }
        });
        console.log('Wireframe mode toggled');
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.container.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Update camera system if exists
        if (this.cameraSystem) {
            this.cameraSystem.onWindowResize();
        }
    }
    
    animate(currentTime = 0) {
        requestAnimationFrame((time) => this.animate(time));
        
        const delta = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime();
        
        // Update game logic
        this.gameManager.update(delta);
        
        // Update camera system
        if (this.cameraSystem && this.gameManager.isGameActive) {
            this.cameraSystem.update(delta);
            
            // Use active camera for rendering
            const activeCamera = this.cameraSystem.getActiveCamera();
            this.renderer.render(this.scene, activeCamera);
            
            // Update UI if needed
            if (this.ui.update) {
                this.ui.update();
            }
        } else {
            // Render with default camera
            this.renderer.render(this.scene, this.camera);
        }
        
        // Update audio
        if (this.gameManager.player) {
            this.audioManager.playFootsteps(this.gameManager.player.isMoving());
        }
        
        this.previousTime = currentTime;
    }
}

// Check WebGL support
function isWebGLAvailable() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch(e) {
        return false;
    }
}

// Start the game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    // Check if WebGL is supported
    if (!isWebGLAvailable()) {
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 30px;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            text-align: center;
            z-index: 10000;
        `;
        warning.innerHTML = `
            <h2>WebGL Not Supported</h2>
            <p>Your browser doesn't support WebGL.<br>
            Please use a modern browser like Chrome, Firefox, or Edge.</p>
        `;
        document.getElementById('game-container').appendChild(warning);
        return;
    }
    
    // Start the game
    try {
        new Game();
        console.log('Loading 3D Scavenger Quest...');
    } catch (error) {
        console.error('Failed to initialize game:', error);
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 30px;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            text-align: center;
            z-index: 10000;
        `;
        errorDiv.innerHTML = `
            <h2>Failed to Start Game</h2>
            <p>${error.message}</p>
            <p style="font-size: 12px; margin-top: 10px;">Check the console for more details.</p>
        `;
        document.getElementById('game-container').appendChild(errorDiv);
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Game paused - tab inactive');
    } else {
        console.log('Game resumed - tab active');
    }
});