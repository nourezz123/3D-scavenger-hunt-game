import * as THREE from 'three';

export class PlayerModel {
    constructor(camera) {
        this.camera = camera;
        this.model = new THREE.Group();
        this.createModel();
        this.camera.add(this.model);
    }
    
    createModel() {
        // Body
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8),
            new THREE.MeshStandardMaterial({ color: 0x3498db })
        );
        body.position.y = 0.75;
        
        // Head
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0xf1c40f })
        );
        head.position.y = 1.5;
        
        this.model.add(body, head);
        this.model.position.z = -2; // Position behind camera
    }
    
    update(delta, isMoving) {
        // Simple walking animation
        if (isMoving) {
            this.model.rotation.x = Math.sin(Date.now() * 0.01) * 0.1;
        } else {
            this.model.rotation.x = 0;
        }
    }
}