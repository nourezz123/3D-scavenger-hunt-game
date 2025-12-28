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
        
        // Create game manager with all dependencies
        this.gameManager = new GameManager(this.scene, this.camera, this.ui, this.audioManager);
        
        // Initialize UI with game manager reference
        this.ui.initialize(this.gameManager, this.gameManager.player);
        
        // Create camera system (will be initialized after player is created)
        this.cameraSystem = null;
        
        this.clock = new THREE.Clock();
        this.previousTime = 0;
        this.lastLogTime = 0;
        this.logInterval = 2000; // Log every 2 seconds
        
        this.setupEventListeners();
        this.setupGlobalControls();
        this.animate();
        
        console.log('✅ Game initialized successfully!');
        console.log('Click START GAME to begin');
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
        const btnStart = document.getElementById('btn-start');
        const btnContinue = document.getElementById('btn-continue');
        const btnCredits = document.getElementById('btn-credits');
        const btnNext = document.getElementById('btn-next');
        const btnMenu = document.getElementById('btn-menu');
        
        if (btnStart) {
            btnStart.addEventListener('click', () => {
                console.log('START button clicked');
                try {
                    this.audioManager.playButtonClick();
                    this.gameManager.startGame();
                    this.initializeCameraSystem();
                    console.log('Game started successfully');
                } catch (error) {
                    console.error('Error starting game:', error);
                }
            });
        }
        
        if (btnContinue) {
            btnContinue.addEventListener('click', () => {
                console.log('CONTINUE button clicked');
                try {
                    this.audioManager.playButtonClick();
                    this.gameManager.continueGame();
                    this.initializeCameraSystem();
                } catch (error) {
                    console.error('Error continuing game:', error);
                }
            });
        }
        
        if (btnCredits) {
            btnCredits.addEventListener('click', () => {
                console.log('CREDITS button clicked');
                try {
                    this.audioManager.playButtonClick();
                    this.showCredits();
                } catch (error) {
                    console.error('Error showing credits:', error);
                }
            });
        }
        
        if (btnNext) {
            btnNext.addEventListener('click', () => {
                console.log('NEXT button clicked');
                try {
                    this.audioManager.playButtonClick();
                    this.gameManager.nextLevel();
                } catch (error) {
                    console.error('Error loading next level:', error);
                }
            });
        }
        
        if (btnMenu) {
            btnMenu.addEventListener('click', () => {
                console.log('MENU button clicked');
                try {
                    this.audioManager.playButtonClick();
                    this.gameManager.returnToMenu();
                } catch (error) {
                    console.error('Error returning to menu:', error);
                }
            });
        }
        
        // Pause game with ESC
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && this.gameManager.isGameActive) {
                this.gameManager.togglePause();
                e.preventDefault();
            }
            
            // Debug: Toggle wireframe with 'F'
            if (e.code === 'KeyF') {
                this.toggleWireframe();
            }
            
            // Debug: Toggle stats with 'H'
            if (e.code === 'KeyH') {
                this.ui.toggleDebugStats();
            }
            
            // Debug: Log player position with 'P'
            if (e.code === 'KeyP') {
                this.logPlayerPosition();
            }
        });
    }
    
    showCredits() {
        // Create credits overlay
        const creditsOverlay = document.createElement('div');
        creditsOverlay.id = 'credits-overlay';
        creditsOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(10, 14, 39, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;
            opacity: 0;
            transition: opacity 0.5s;
        `;
        
        creditsOverlay.innerHTML = `
            <div style="text-align: center; max-width: 600px; padding: 40px;">
                <h1 style="font-family: 'Orbitron', monospace; font-size: 48px; color: #00ff88; margin-bottom: 40px;">
                    SCAVENGER QUEST
                </h1>
                <h2 style="font-family: 'Rajdhani', sans-serif; font-size: 28px; color: #0099ff; margin-bottom: 30px;">
                    CREDITS
                </h2>
                <div style="font-family: 'Rajdhani', sans-serif; font-size: 20px; color: white; line-height: 2;">
                    <p><strong>Game Designers & Developers</strong></p>
                    <p style="color: #00ff88;">Nour Ezz</p>
                    <p style="color: #00ff88;">Marwan Ayman</p>
                    <p style="color: #00ff88;">Malak Abuelgheit</p>
                    <br>
                    <p><strong>Technology</strong></p>
                    <p style="color: #0099ff;">Three.js</p>
                    <p style="color: #0099ff;">WebGL</p>
                    <p style="color: #0099ff;">JavaScript</p>
                    <br>
                    <p style="font-size: 16px; color: rgba(255,255,255,0.7); margin-top: 40px;">
                        A 3D Multi-Level Scavenger Hunt Game<br>
                        Built with Three.js and Passion
                    </p>
                </div>
                <button id="btn-back-credits" style="
                    margin-top: 40px;
                    padding: 15px 40px;
                    font-family: 'Orbitron', monospace;
                    font-size: 18px;
                    color: white;
                    background: linear-gradient(135deg, #00ff88, #0099ff);
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: transform 0.3s;
                ">BACK TO MENU</button>
            </div>
        `;
        
        document.body.appendChild(creditsOverlay);
        
        // Fade in
        setTimeout(() => {
            creditsOverlay.style.opacity = '1';
        }, 10);
        
        // Back button handler
        const backBtn = document.getElementById('btn-back-credits');
        backBtn.addEventListener('click', () => {
            this.audioManager.playButtonClick();
            creditsOverlay.style.opacity = '0';
            setTimeout(() => {
                if (creditsOverlay.parentNode) {
                    creditsOverlay.parentNode.removeChild(creditsOverlay);
                }
            }, 500);
        });
        
        // Hover effect
        backBtn.addEventListener('mouseenter', () => {
            backBtn.style.transform = 'scale(1.05)';
            backBtn.style.boxShadow = '0 0 30px rgba(0, 255, 136, 0.5)';
        });
        
        backBtn.addEventListener('mouseleave', () => {
            backBtn.style.transform = 'scale(1)';
            backBtn.style.boxShadow = 'none';
        });
        
        // Close with ESC
        const closeCredits = (e) => {
            if (e.code === 'Escape' && creditsOverlay.parentNode) {
                this.audioManager.playButtonClick();
                creditsOverlay.style.opacity = '0';
                setTimeout(() => {
                    if (creditsOverlay.parentNode) {
                        creditsOverlay.parentNode.removeChild(creditsOverlay);
                    }
                }, 500);
                document.removeEventListener('keydown', closeCredits);
            }
        };
        document.addEventListener('keydown', closeCredits);
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
            console.log('✅ Camera system initialized');
        }
    }
    
    toggleWireframe() {
        let wireframeEnabled = false;
        this.scene.traverse((object) => {
            if (object.isMesh && object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(m => {
                        m.wireframe = !m.wireframe;
                        if (m.wireframe) wireframeEnabled = true;
                    });
                } else {
                    object.material.wireframe = !object.material.wireframe;
                    if (object.material.wireframe) wireframeEnabled = true;
                }
            }
        });
        console.log(`Wireframe mode: ${wireframeEnabled ? 'ON' : 'OFF'}`);
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
    
    logPlayerPosition() {
        if (this.gameManager.player) {
            const pos = this.gameManager.player.getPosition();
            console.log(`Player Position: X=${pos.x.toFixed(2)}, Y=${pos.y.toFixed(2)}, Z=${pos.z.toFixed(2)}`);
            
            // Check if on ground
            console.log(`On ground: ${this.gameManager.player.onGround}`);
            
            // Log collision objects count
            if (this.gameManager.currentLevel) {
                console.log(`Collision objects: ${this.gameManager.currentLevel.environmentObjects.length}`);
            }
        }
    }
    
    animate(currentTime = 0) {
        requestAnimationFrame((time) => this.animate(time));
        
        const delta = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime();
        
        // Update game logic
        if (this.gameManager) {
            this.gameManager.update(delta);
        }
        
        // Periodic debug logging
        if (elapsedTime - this.lastLogTime > this.logInterval / 1000) {
            this.lastLogTime = elapsedTime;
            if (this.gameManager.player && this.gameManager.isGameActive) {
                const pos = this.gameManager.player.getPosition();
                console.log(`[${Math.floor(elapsedTime)}s] Player: y=${pos.y.toFixed(2)}, Ground: ${this.gameManager.player.onGround}`);
            }
        }
        
        // Update camera system
        if (this.cameraSystem && this.gameManager && this.gameManager.isGameActive) {
            this.cameraSystem.update(delta);
            
            // Use active camera for rendering
            const activeCamera = this.cameraSystem.getActiveCamera();
            this.renderer.render(this.scene, activeCamera);
            
            // Update UI if needed
            if (this.ui && this.ui.update) {
                this.ui.update();
            }
            
            // Update debug stats
            if (this.ui && this.ui.showDebug) {
                this.ui.updateDebugStats(this.renderer, this.gameManager.player);
            }
        } else {
            // Render with default camera
            this.renderer.render(this.scene, this.camera);
        }
        
        // Update audio
        if (this.gameManager && this.gameManager.player && this.audioManager) {
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
    console.log('🎮 Initializing 3D Scavenger Quest...');
    
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
        const game = new Game();
        window.game = game; // For debugging
        console.log('✅ Game ready! Click START GAME to begin.');
        console.log('Controls:');
        console.log('- W/A/S/D: Move');
        console.log('- Mouse: Look around');
        console.log('- Space: Jump');
        console.log('- Shift: Sprint');
        console.log('- ESC: Pause/Menu');
        console.log('- F: Toggle wireframe');
        console.log('- M: Mute audio');
        console.log('- H: Toggle debug stats');
        console.log('- P: Log player position');
    } catch (error) {
        console.error('❌ Failed to initialize game:', error);
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
            <p style="font-size: 12px; margin-top: 10px;">Check the console (F12) for more details.</p>
        `;
        document.getElementById('game-container').appendChild(errorDiv);
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('⏸️ Game paused - tab inactive');
    } else {
        console.log('▶️ Game resumed - tab active');
    }
});