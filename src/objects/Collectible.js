import * as THREE from 'three';

export class Collectible {
    constructor(position, emissiveIntensity = 1) {
        this.geometry = new THREE.SphereGeometry(0.4, 16, 16);
        this.material = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            emissive: 0xFFD700,
            emissiveIntensity: emissiveIntensity,
            metalness: 0.8,
            roughness: 0.2
        });
        
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.copy(position);
        this.mesh.castShadow = true;
        
        // Particle ring
        const ringGeometry = new THREE.RingGeometry(0.5, 0.6, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFD700,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        this.ring = new THREE.Mesh(ringGeometry, ringMaterial);
        this.ring.rotation.x = Math.PI / 2;
        this.mesh.add(this.ring);
        
        this.rotationSpeed = 0.02 + Math.random() * 0.02;
        this.bobSpeed = 0.001 + Math.random() * 0.001;
        this.bobAmount = 0.3;
        this.startY = position.y;
        this.collected = false;
        this.time = Math.random() * 1000;
    }
    
    update(delta) {
        if (this.collected) return;
        
        this.time += delta;
        this.mesh.rotation.y += this.rotationSpeed;
        this.mesh.position.y = this.startY + Math.sin(this.time * 2) * this.bobAmount;
        
        if (this.ring) {
            this.ring.rotation.z += 0.02;
            this.ring.scale.setScalar(1 + Math.sin(this.time * 3) * 0.1);
        }
    }
    
    collect(onComplete) {
        if (this.collected) return;
        this.collected = true;
        
        this.material.transparent = true;
        const startScale = this.mesh.scale.clone();
        const animDuration = 500;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / animDuration;
            
            if (progress < 1) {
                this.mesh.scale.setScalar(startScale.x * (1 + progress));
                this.material.opacity = 1 - progress;
                requestAnimationFrame(animate);
            } else {
                if (onComplete) onComplete(this);
            }
        };
        
        animate();
    }
    
    checkCollision(playerPosition, radius = 2) {
        if (this.collected) return false;
        return this.mesh.position.distanceTo(playerPosition) < radius;
    }
    
    dispose() {
        this.geometry.dispose();
        this.material.dispose();
        if (this.ring) {
            this.ring.geometry.dispose();
            this.ring.material.dispose();
        }
    }
}