import * as THREE from 'three';

export class Player {
    constructor(camera) {
        this.camera = camera;
        this.object = new THREE.Object3D();
        this.object.add(camera);
        this.object.position.y = 1.6;
        
        // Create collision sphere
        this.collisionRadius = 0.5;
        this.collider = new THREE.Sphere(new THREE.Vector3(), this.collisionRadius);
        
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveSpeed = 5;
        this.sprintSpeed = 8;
        this.currentSpeed = this.moveSpeed;
        this.mouseSensitivity = 0.002;
        
        this.pitch = 0;
        this.yaw = 0;
        
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isSprinting = false;
        this.onGround = true; // Start on ground
        
        this.isActive = false;
        
        // Raycaster for ground detection
        this.downRay = new THREE.Raycaster(
            new THREE.Vector3(),
            new THREE.Vector3(0, -1, 0),
            0,
            3
        );
        
        // Jump variables
        this.jumpForce = 12;
        this.gravity = 30;
        this.canJump = true;
        this.jumpCooldown = 0.3;
        this.timeSinceLastJump = 0;
        
        this.createCharacterModel();
        this.setupControls();
    }
    
    createCharacterModel() {
        this.playerModel = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.3);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2c5aa0,
            roughness: 0.7,
            metalness: 0.2
        });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.y = 0.9;
        this.body.castShadow = true;
        
        // Head
        const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffdbac,
            roughness: 0.8,
            metalness: 0.1
        });
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.y = 1.5;
        this.head.castShadow = true;
        
        // Eyes
        const eyeGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.02);
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.1, 0.05, 0.2);
        this.head.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.1, 0.05, 0.2);
        this.head.add(rightEye);
        
        // Mouth
        const mouthGeometry = new THREE.BoxGeometry(0.15, 0.03, 0.02);
        const mouth = new THREE.Mesh(mouthGeometry, eyeMaterial);
        mouth.position.set(0, -0.1, 0.2);
        this.head.add(mouth);
        
        // Arms
        const armGeometry = new THREE.BoxGeometry(0.15, 0.7, 0.15);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2c5aa0,
            roughness: 0.7
        });
        
        this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
        this.leftArm.position.set(-0.4, 0.8, 0);
        this.leftArm.castShadow = true;
        
        this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
        this.rightArm.position.set(0.4, 0.8, 0);
        this.rightArm.castShadow = true;
        
        // Hands
        const handGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
        const handMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
        
        this.leftHand = new THREE.Mesh(handGeometry, handMaterial);
        this.leftHand.position.set(-0.4, 0.4, 0);
        this.leftHand.castShadow = true;
        
        this.rightHand = new THREE.Mesh(handGeometry, handMaterial);
        this.rightHand.position.set(0.4, 0.4, 0);
        this.rightHand.castShadow = true;
        
        // Legs
        const legGeometry = new THREE.BoxGeometry(0.2, 0.7, 0.2);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a3a6b,
            roughness: 0.8
        });
        
        this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.leftLeg.position.set(-0.15, 0.35, 0);
        this.leftLeg.castShadow = true;
        
        this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.rightLeg.position.set(0.15, 0.35, 0);
        this.rightLeg.castShadow = true;
        
        // Feet
        const footGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.3);
        const footMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        
        this.leftFoot = new THREE.Mesh(footGeometry, footMaterial);
        this.leftFoot.position.set(-0.15, 0.05, 0.05);
        this.leftFoot.castShadow = true;
        
        this.rightFoot = new THREE.Mesh(footGeometry, footMaterial);
        this.rightFoot.position.set(0.15, 0.05, 0.05);
        this.rightFoot.castShadow = true;
        
        // Add all parts
        this.playerModel.add(this.body);
        this.playerModel.add(this.head);
        this.playerModel.add(this.leftArm);
        this.playerModel.add(this.rightArm);
        this.playerModel.add(this.leftHand);
        this.playerModel.add(this.rightHand);
        this.playerModel.add(this.leftLeg);
        this.playerModel.add(this.rightLeg);
        this.playerModel.add(this.leftFoot);
        this.playerModel.add(this.rightFoot);
        
        this.playerModel.position.z = -2;
        this.playerModel.position.y = -1.6;
        this.playerModel.position.x = 0.5;
        this.playerModel.rotation.y = Math.PI;
        
        this.camera.add(this.playerModel);
        
        this.walkCycle = 0;
        this.isWalking = false;
        this.armSwingAmount = 0.4;
        this.legSwingAmount = 0.5;
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        document.addEventListener('click', () => {
            if (this.isActive) {
                document.body.requestPointerLock();
            }
        });
    }
    
    onKeyDown(event) {
        if (!this.isActive) return;
        
        switch(event.code) {
            case 'KeyW': 
                this.moveForward = true; 
                break;
            case 'KeyS': 
                this.moveBackward = true; 
                break;
            case 'KeyA': 
                this.moveLeft = true; 
                break;
            case 'KeyD': 
                this.moveRight = true; 
                break;
            case 'ShiftLeft': 
            case 'ShiftRight':
                this.isSprinting = true;
                this.currentSpeed = this.sprintSpeed;
                break;
            case 'Space': 
                this.jump(); 
                break;
        }
    }
    
    onKeyUp(event) {
        switch(event.code) {
            case 'KeyW': 
                this.moveForward = false; 
                break;
            case 'KeyS': 
                this.moveBackward = false; 
                break;
            case 'KeyA': 
                this.moveLeft = false; 
                break;
            case 'KeyD': 
                this.moveRight = false; 
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.isSprinting = false;
                this.currentSpeed = this.moveSpeed;
                break;
        }
    }
    
    onMouseMove(event) {
        if (!this.isActive || document.pointerLockElement !== document.body) return;
        
        // Only rotate horizontally (yaw)
        this.yaw -= event.movementX * this.mouseSensitivity;
        
        // Rotate vertically (pitch) with limits - NO MOVEMENT
        this.pitch -= event.movementY * this.mouseSensitivity;
        this.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.pitch)); // Limit to 60 degrees up/down
        
        // Apply rotations - camera looks up/down, object rotates left/right
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.x = this.pitch;
        this.camera.rotation.y = 0;
        this.object.rotation.y = this.yaw;
    }
    
    jump() {
        if (this.onGround && this.canJump && this.isActive) {
            console.log('JUMP! Force:', this.jumpForce);
            this.velocity.y = this.jumpForce;
            this.onGround = false;
            this.canJump = false;
            this.timeSinceLastJump = 0;
            
            // Jump animation
            this.playerModel.position.y = -1.4;
        }
    }
    
    setCollisionObjects(objects) {
        this.collisionObjects = objects;
        console.log(`Player collision objects set: ${objects.length} objects`);
    }
    
    checkCollisions() {
        if (!this.collisionObjects || this.collisionObjects.length === 0) return;
        
        this.collider.center.copy(this.object.position);
        
        for (const obj of this.collisionObjects) {
            if (!obj.geometry) continue;
            
            if (!obj.geometry.boundingBox) {
                obj.geometry.computeBoundingBox();
            }
            
            const box = obj.geometry.boundingBox.clone();
            box.applyMatrix4(obj.matrixWorld);
            
            const closestPoint = new THREE.Vector3();
            closestPoint.x = Math.max(box.min.x, Math.min(this.collider.center.x, box.max.x));
            closestPoint.y = Math.max(box.min.y, Math.min(this.collider.center.y, box.max.y));
            closestPoint.z = Math.max(box.min.z, Math.min(this.collider.center.z, box.max.z));
            
            const distance = closestPoint.distanceTo(this.collider.center);
            
            if (distance < this.collider.radius) {
                const normal = new THREE.Vector3()
                    .subVectors(this.collider.center, closestPoint)
                    .normalize();
                
                const pushDistance = this.collider.radius - distance;
                this.object.position.addScaledVector(normal, pushDistance);
                
                const velocityInNormal = this.velocity.dot(normal);
                if (velocityInNormal < 0) {
                    this.velocity.addScaledVector(normal, -velocityInNormal);
                }
                
                // If pushing up from below, we're on ground
                if (normal.y > 0.7) {
                    this.onGround = true;
                    this.velocity.y = 0;
                }
            }
        }
    }
    
    checkGroundCollision() {
        // SIMPLE GROUND DETECTION - WORKS FOR ALL LEVELS
        const groundLevel = 0;
        const playerFeetY = this.object.position.y - 1.6;
        
        // If we're at or below ground level
        if (playerFeetY <= groundLevel + 0.1) {
            // Snap to ground
            this.object.position.y = groundLevel + 1.6;
            this.velocity.y = Math.min(this.velocity.y, 0); // Stop falling
            this.onGround = true;
            this.canJump = true;
            
            // Reset jump animation
            this.playerModel.position.y = -1.6;
        } else {
            // In air
            this.onGround = false;
        }
        
        // Debug every 60 frames
        if (Math.random() < 0.016) { // ~1/60
            console.log(`Ground check: PlayerY=${this.object.position.y.toFixed(2)}, Feet=${playerFeetY.toFixed(2)}, onGround=${this.onGround}, velY=${this.velocity.y.toFixed(2)}`);
        }
    }
    
    update(delta) {
        if (!this.isActive) return;
        
        // Update jump cooldown
        this.timeSinceLastJump += delta;
        if (this.timeSinceLastJump > this.jumpCooldown) {
            this.canJump = true;
        }
        
        // Apply gravity if not on ground
        if (!this.onGround) {
            this.velocity.y -= this.gravity * delta;
        }
        
        // Damping for horizontal movement
        this.velocity.x *= 0.9;
        this.velocity.z *= 0.9;
        
        // Update direction
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();
        
        // Calculate movement vectors
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.object.quaternion);
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(this.object.quaternion);
        
        // Apply horizontal movement
        const moveSpeed = this.currentSpeed * delta;
        
        if (this.moveForward || this.moveBackward) {
            const forwardMove = forward.clone().multiplyScalar(this.direction.z * moveSpeed);
            this.object.position.add(forwardMove);
        }
        
        if (this.moveLeft || this.moveRight) {
            const rightMove = right.clone().multiplyScalar(this.direction.x * moveSpeed);
            this.object.position.add(rightMove);
        }
        
        // Apply vertical movement (gravity/jump)
        this.object.position.y += this.velocity.y * delta;
        
        // Check collisions
        this.checkCollisions();
        this.checkGroundCollision();
        
        // Update animation
        this.isWalking = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
        this.updateAnimation(delta);
    }
    
    updateAnimation(delta) {
        if (this.isWalking) {
            const animSpeed = this.isSprinting ? 18 : 12;
            this.walkCycle += delta * animSpeed;
            
            const armSwing = Math.sin(this.walkCycle) * this.armSwingAmount;
            this.leftArm.rotation.x = armSwing;
            this.rightArm.rotation.x = -armSwing;
            
            this.leftHand.rotation.x = armSwing * 0.5;
            this.rightHand.rotation.x = -armSwing * 0.5;
            
            const legSwing = Math.sin(this.walkCycle) * this.legSwingAmount;
            this.leftLeg.rotation.x = legSwing;
            this.rightLeg.rotation.x = -legSwing;
            
            this.leftFoot.rotation.x = legSwing * 0.5;
            this.rightFoot.rotation.x = -legSwing * 0.5;
            
            const headBob = Math.sin(this.walkCycle * 2) * 0.08;
            this.head.position.y = 1.5 + headBob;
            
            const turnTilt = (Number(this.moveRight) - Number(this.moveLeft)) * 0.15;
            this.body.rotation.z = turnTilt;
            this.body.rotation.x = -0.1;
        } else {
            // Reset to idle position
            this.leftArm.rotation.x = 0;
            this.rightArm.rotation.x = 0;
            this.leftHand.rotation.x = 0;
            this.rightHand.rotation.x = 0;
            this.leftLeg.rotation.x = 0;
            this.rightLeg.rotation.x = 0;
            this.leftFoot.rotation.x = 0;
            this.rightFoot.rotation.x = 0;
            this.head.position.y = 1.5;
            this.body.rotation.z = 0;
            this.body.rotation.x = 0;
        }
        
        // Jump animation
        if (!this.onGround) {
            const jumpBob = Math.sin(this.velocity.y * 0.1) * 0.1;
            this.playerModel.position.y = -1.6 + jumpBob;
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
        this.isSprinting = false;
        this.currentSpeed = this.moveSpeed;
        this.onGround = true;
        this.canJump = true;
        this.timeSinceLastJump = this.jumpCooldown;
        
        this.playerModel.visible = true;
        this.playerModel.position.y = -1.6;
        
        console.log('Player reset');
    }
    
    setActive(active) {
        this.isActive = active;
        if (!active) {
            document.exitPointerLock();
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
    
    isMoving() {
        return this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
    }
}