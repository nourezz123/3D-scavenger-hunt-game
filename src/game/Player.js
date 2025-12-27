import * as THREE from 'three';

export class Player {
    constructor(camera) {
        this.camera = camera;
        this.object = new THREE.Object3D();
        this.object.add(camera);
        this.object.position.y = 1.6;
        
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveSpeed = 15;
        this.mouseSensitivity = 0.002;
        
        this.pitch = 0;
        this.yaw = 0;
        
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        
        this.isActive = false;
        
        // Create visible player model
        this.createPlayerModel();
        
        this.setupControls();
    }
    
    createPlayerModel() {
        // Create a group for the player model
        this.playerModel = new THREE.Group();
        
        // Body (cylinder)
        const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.25, 1.2, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3498db,
            roughness: 0.8,
            metalness: 0.2
        });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.y = 0.6;
        this.body.castShadow = true;
        
        // Head (sphere)
        const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xf1c40f,
            roughness: 0.7,
            metalness: 0.3
        });
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.y = 1.4;
        this.head.castShadow = true;
        
        // Arms
        const armGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3498db,
            roughness: 0.8
        });
        
        this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
        this.leftArm.position.set(-0.35, 0.8, 0);
        this.leftArm.rotation.z = Math.PI / 6;
        this.leftArm.castShadow = true;
        
        this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
        this.rightArm.position.set(0.35, 0.8, 0);
        this.rightArm.rotation.z = -Math.PI / 6;
        this.rightArm.castShadow = true;
        
        // Legs
        const legGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.7, 6);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2980b9,
            roughness: 0.8
        });
        
        this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.leftLeg.position.set(-0.15, 0.35, 0);
        this.leftLeg.castShadow = true;
        
        this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.rightLeg.position.set(0.15, 0.35, 0);
        this.rightLeg.castShadow = true;
        
        // Add all parts to the model group
        this.playerModel.add(this.body);
        this.playerModel.add(this.head);
        this.playerModel.add(this.leftArm);
        this.playerModel.add(this.rightArm);
        this.playerModel.add(this.leftLeg);
        this.playerModel.add(this.rightLeg);
        
        // Position the model slightly behind the camera for first-person view
        this.playerModel.position.z = -0.5;
        this.playerModel.position.y = -0.5;
        
        // Add model to camera so it moves with the view
        this.camera.add(this.playerModel);
        
        // Animation properties
        this.walkCycle = 0;
        this.isWalking = false;
        this.armSwingAmount = 0.3;
        this.legSwingAmount = 0.4;
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        // Add camera switch with 'C' key
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyC') {
                this.switchCameraView();
            }
        });
        
        document.addEventListener('click', () => {
            if (this.isActive) {
                document.body.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            // Handle pointer lock changes if needed
        });
    }
    
    onKeyDown(event) {
        if (!this.isActive) return;
        
        switch(event.code) {
            case 'KeyW': this.moveForward = true; break;
            case 'KeyS': this.moveBackward = true; break;
            case 'KeyA': this.moveLeft = true; break;
            case 'KeyD': this.moveRight = true; break;
            case 'ShiftLeft': this.moveSpeed = 25; break; // Sprint
            case 'Space': this.jump(); break;
        }
    }
    
    onKeyUp(event) {
        switch(event.code) {
            case 'KeyW': this.moveForward = false; break;
            case 'KeyS': this.moveBackward = false; break;
            case 'KeyA': this.moveLeft = false; break;
            case 'KeyD': this.moveRight = false; break;
            case 'ShiftLeft': this.moveSpeed = 15; break; // Normal speed
        }
    }
    
    onMouseMove(event) {
        if (!this.isActive || document.pointerLockElement !== document.body) return;
        
        this.yaw -= event.movementX * this.mouseSensitivity;
        this.pitch -= event.movementY * this.mouseSensitivity;
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
        
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = 0;
        this.camera.rotation.x = this.pitch;
        this.object.rotation.y = this.yaw;
    }
    
    jump() {
        // Simple jump mechanic
        if (Math.abs(this.velocity.y) < 0.1) {
            this.velocity.y = 8;
        }
    }
    
    update(delta) {
        if (!this.isActive) return;
        
        // Apply gravity
        this.velocity.y -= 20 * delta;
        
        // Damping for horizontal movement
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        
        // Update direction based on input
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();
        
        // Apply movement based on input
        if (this.moveForward || this.moveBackward) {
            this.velocity.z -= this.direction.z * this.moveSpeed * delta;
        }
        if (this.moveLeft || this.moveRight) {
            this.velocity.x -= this.direction.x * this.moveSpeed * delta;
        }
        
        // Calculate movement vectors based on player rotation
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.object.quaternion);
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(this.object.quaternion);
        
        // Apply movement
        this.object.position.addScaledVector(forward, -this.velocity.z);
        this.object.position.addScaledVector(right, -this.velocity.x);
        this.object.position.y += this.velocity.y * delta;
        
        // Simple ground collision
        if (this.object.position.y < 1.6) {
            this.object.position.y = 1.6;
            this.velocity.y = 0;
        }
        
        // Update walking animation
        this.isWalking = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
        this.updateAnimation(delta);
    }
    
    updateAnimation(delta) {
        if (this.isWalking) {
            this.walkCycle += delta * 10;
            
            // Arm swing animation
            const armAngle = Math.sin(this.walkCycle) * this.armSwingAmount;
            this.leftArm.rotation.z = Math.PI / 6 + armAngle;
            this.rightArm.rotation.z = -Math.PI / 6 - armAngle;
            
            // Leg swing animation
            const legAngle = Math.sin(this.walkCycle) * this.legSwingAmount;
            this.leftLeg.rotation.z = legAngle;
            this.rightLeg.rotation.z = -legAngle;
            
            // Head bob
            const headBob = Math.sin(this.walkCycle * 2) * 0.05;
            this.head.position.y = 1.4 + headBob;
            
            // Body tilt when turning
            const turnTilt = (Number(this.moveRight) - Number(this.moveLeft)) * 0.1;
            this.body.rotation.z = turnTilt;
        } else {
            // Reset to idle position
            this.leftArm.rotation.z = Math.PI / 6;
            this.rightArm.rotation.z = -Math.PI / 6;
            this.leftLeg.rotation.z = 0;
            this.rightLeg.rotation.z = 0;
            this.head.position.y = 1.4;
            this.body.rotation.z = 0;
        }
    }
    
    switchCameraView() {
        // Switch between first-person and third-person views
        if (this.playerModel.position.z === -0.5) {
            // Switch to third-person
            this.playerModel.position.z = -3;
            this.playerModel.position.y = -1;
            this.playerModel.visible = true;
            console.log('Switched to Third-Person view');
        } else {
            // Switch to first-person
            this.playerModel.position.z = -0.5;
            this.playerModel.position.y = -0.5;
            console.log('Switched to First-Person view');
        }
    }
    
    reset() {
        this.object.position.set(0, 1.6, 0);
        this.pitch = 0;
        this.yaw = 0;
        this.camera.rotation.set(0, 0, 0);
        this.object.rotation.set(0, 0, 0);
        this.velocity.set(0, 0, 0);
        this.walkCycle = 0;
        
        // Reset model to first-person view
        this.playerModel.position.z = -0.5;
        this.playerModel.position.y = -0.5;
        this.playerModel.visible = true;
    }
    
    setActive(active) {
        this.isActive = active;
        if (!active) {
            document.exitPointerLock();
            // Hide player model in menu
            this.playerModel.visible = false;
        } else {
            this.playerModel.visible = true;
        }
    }
    
    getPosition() {
        return this.object.position;
    }
    
    getRotation() {
        return this.object.rotation;
    }
    
    // Helper method to check if player is moving
    isMoving() {
        return this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
    }
}