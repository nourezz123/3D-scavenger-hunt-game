import * as THREE from 'three';

export class CameraSystem {
    constructor(mainCamera, player) {
        this.mainCamera = mainCamera;
        this.player = player;
        this.currentMode = 'firstPerson';
        this.cameraDistance = 5;
        this.cameraHeight = 3;
        
        this.setupCameras();
        this.setupControls();
        
        console.log(`Camera System: Started in ${this.currentMode} mode`);
    }
    
    setupCameras() {
        this.cameras = {
            'firstPerson': this.mainCamera,
            'thirdPerson': this.createThirdPersonCamera(),
            'topDown': this.createTopDownCamera(),
            'cinematic': this.createCinematicCamera(),
            'freeLook': this.createFreeLookCamera()
        };
        
        // Initial camera positions
        this.updateCameraPositions();
    }
    
    createThirdPersonCamera() {
        const camera = new THREE.PerspectiveCamera(
            60, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        return camera;
    }
    
    createTopDownCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        const camera = new THREE.OrthographicCamera(
            -30 * aspect, 30 * aspect, 30, -30, 1, 1000
        );
        camera.position.set(0, 50, 0);
        camera.lookAt(0, 0, 0);
        camera.zoom = 0.8;
        camera.updateProjectionMatrix();
        return camera;
    }
    
    createCinematicCamera() {
        const camera = new THREE.PerspectiveCamera(
            45, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        return camera;
    }
    
    createFreeLookCamera() {
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.set(10, 5, 10);
        camera.lookAt(0, 0, 0);
        return camera;
    }
    
    setupControls() {
        // Camera switching with 'C'
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyC' && !e.repeat) {
                this.switchCamera();
            }
            
            // Adjust camera distance with scroll wheel
            if (e.code === 'KeyV') {
                this.toggleCameraSettings();
            }
        });
        
        // Mouse wheel for zoom in third person
        document.addEventListener('wheel', (e) => {
            if (this.currentMode === 'thirdPerson' || this.currentMode === 'cinematic') {
                e.preventDefault();
                this.adjustCameraDistance(e.deltaY > 0 ? -1 : 1);
            }
        }, { passive: false });
    }
    
    switchCamera() {
        const modes = ['firstPerson', 'thirdPerson', 'topDown', 'cinematic', 'freeLook'];
        const currentIndex = modes.indexOf(this.currentMode);
        this.currentMode = modes[(currentIndex + 1) % modes.length];
        
        console.log(`Camera switched to: ${this.currentMode}`);
        
        // Show notification
        this.showCameraNotification();
        
        return this.getActiveCamera();
    }
    
    showCameraNotification() {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.textContent = `Camera: ${this.currentMode.replace(/([A-Z])/g, ' $1')}`;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.7);
            color: #00ff88;
            padding: 10px 20px;
            border-radius: 5px;
            font-family: 'Orbitron', monospace;
            font-size: 14px;
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        
        document.body.appendChild(notification);
        
        // Fade in and out
        setTimeout(() => notification.style.opacity = '1', 10);
        setTimeout(() => notification.style.opacity = '0', 1000);
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 1300);
    }
    
    adjustCameraDistance(delta) {
        if (this.currentMode === 'thirdPerson' || this.currentMode === 'cinematic') {
            this.cameraDistance = THREE.MathUtils.clamp(
                this.cameraDistance + delta * 0.5,
                2,
                20
            );
            
            this.cameraHeight = THREE.MathUtils.clamp(
                this.cameraHeight + delta * 0.2,
                1,
                10
            );
        }
    }
    
    toggleCameraSettings() {
        // Toggle between different third-person presets
        const presets = [
            { distance: 5, height: 3 },
            { distance: 8, height: 4 },
            { distance: 12, height: 6 }
        ];
        
        const currentPreset = presets.findIndex(p => 
            Math.abs(p.distance - this.cameraDistance) < 0.1 &&
            Math.abs(p.height - this.cameraHeight) < 0.1
        );
        
        const nextPreset = (currentPreset + 1) % presets.length;
        this.cameraDistance = presets[nextPreset].distance;
        this.cameraHeight = presets[nextPreset].height;
    }
    
    getActiveCamera() {
        return this.cameras[this.currentMode];
    }
    
    updateCameraPositions() {
        if (!this.player) return;
        
        const playerPos = this.player.getPosition();
        const playerRotation = this.player.getRotation ? this.player.getRotation() : { y: 0 };
        
        switch(this.currentMode) {
            case 'thirdPerson':
                const angle = playerRotation.y;
                const cam = this.cameras.thirdPerson;
                
                cam.position.set(
                    playerPos.x + Math.sin(angle) * this.cameraDistance,
                    playerPos.y + this.cameraHeight,
                    playerPos.z + Math.cos(angle) * this.cameraDistance
                );
                cam.lookAt(playerPos.x, playerPos.y + 1, playerPos.z);
                break;
                
            case 'cinematic':
                const time = Date.now() * 0.001;
                this.cameras.cinematic.position.set(
                    playerPos.x + Math.cos(time * 0.5) * this.cameraDistance,
                    playerPos.y + this.cameraHeight,
                    playerPos.z + Math.sin(time * 0.5) * this.cameraDistance
                );
                this.cameras.cinematic.lookAt(playerPos);
                break;
                
            case 'topDown':
                this.cameras.topDown.position.set(playerPos.x, 50, playerPos.z);
                this.cameras.topDown.lookAt(playerPos);
                break;
                
            case 'freeLook':
                // Free look camera orbits around player
                const freeTime = Date.now() * 0.0005;
                this.cameras.freeLook.position.set(
                    playerPos.x + Math.cos(freeTime) * 15,
                    playerPos.y + 8,
                    playerPos.z + Math.sin(freeTime) * 15
                );
                this.cameras.freeLook.lookAt(playerPos);
                break;
        }
    }
    
    update(delta) {
        this.updateCameraPositions();
    }
    
    onWindowResize() {
        // Update all cameras on window resize
        Object.values(this.cameras).forEach(camera => {
            if (camera.isPerspectiveCamera) {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
            } else if (camera.isOrthographicCamera) {
                const aspect = window.innerWidth / window.innerHeight;
                camera.left = -30 * aspect;
                camera.right = 30 * aspect;
                camera.updateProjectionMatrix();
            }
        });
    }
}