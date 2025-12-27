import * as THREE from 'three';

export class ParticleSystem {
    constructor(position, color = 0xFFD700, count = 50) {
        this.particles = [];
        this.geometry = new THREE.BufferGeometry();
        this.material = new THREE.PointsMaterial({
            color: color,
            size: 0.1,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.positions = new Float32Array(count * 3);
        this.colors = new Float32Array(count * 3);
        this.sizes = new Float32Array(count);
        this.velocities = [];
        
        // Create particles
        for (let i = 0; i < count; i++) {
            const idx = i * 3;
            
            // Random position around center
            this.positions[idx] = position.x + (Math.random() - 0.5) * 2;
            this.positions[idx + 1] = position.y + (Math.random() - 0.5) * 2;
            this.positions[idx + 2] = position.z + (Math.random() - 0.5) * 2;
            
            // Random color variation
            const r = (color >> 16 & 255) / 255;
            const g = (color >> 8 & 255) / 255;
            const b = (color & 255) / 255;
            
            this.colors[idx] = r + (Math.random() - 0.5) * 0.2;
            this.colors[idx + 1] = g + (Math.random() - 0.5) * 0.2;
            this.colors[idx + 2] = b + (Math.random() - 0.5) * 0.2;
            
            // Random size
            this.sizes[i] = Math.random() * 0.15 + 0.05;
            
            // Random velocity
            this.velocities.push({
                x: (Math.random() - 0.5) * 0.2,
                y: Math.random() * 0.3,
                z: (Math.random() - 0.5) * 0.2,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02
            });
        }
        
        // Set geometry attributes
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
        
        // Create points mesh
        this.points = new THREE.Points(this.geometry, this.material);
        this.points.position.copy(position);
        
        this.active = true;
        this.duration = 2000; // 2 seconds
        this.startTime = Date.now();
    }
    
    update(delta) {
        if (!this.active) return false;
        
        const positions = this.geometry.attributes.position.array;
        const colors = this.geometry.attributes.color.array;
        const sizes = this.geometry.attributes.size.array;
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;
        
        if (progress >= 1) {
            this.active = false;
            return false;
        }
        
        let alive = false;
        
        for (let i = 0; i < this.velocities.length; i++) {
            const idx = i * 3;
            const velocity = this.velocities[i];
            
            if (velocity.life > 0) {
                alive = true;
                
                // Update position
                positions[idx] += velocity.x * delta * 60;
                positions[idx + 1] += velocity.y * delta * 60;
                positions[idx + 2] += velocity.z * delta * 60;
                
                // Apply gravity
                velocity.y -= 0.01 * delta * 60;
                
                // Update life
                velocity.life -= velocity.decay * delta * 60;
                
                // Update size based on life
                sizes[i] = velocity.life * (Math.random() * 0.1 + 0.05);
                
                // Update color based on life
                const fade = velocity.life;
                colors[idx] *= fade;
                colors[idx + 1] *= fade;
                colors[idx + 2] *= fade;
            } else {
                // Reset particle
                velocity.life = 1.0;
                positions[idx] = (Math.random() - 0.5) * 2;
                positions[idx + 1] = (Math.random() - 0.5) * 2;
                positions[idx + 2] = (Math.random() - 0.5) * 2;
                
                // Reset velocity
                velocity.x = (Math.random() - 0.5) * 0.2;
                velocity.y = Math.random() * 0.3;
                velocity.z = (Math.random() - 0.5) * 0.2;
            }
        }
        
        // Mark attributes as needing update
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        this.geometry.attributes.size.needsUpdate = true;
        
        return alive;
    }
    
    // Create different types of particle effects
    static createCollectEffect(position) {
        return new ParticleSystem(position, 0xFFD700, 30);
    }
    
    static createExplosionEffect(position) {
        const system = new ParticleSystem(position, 0xFF4500, 100);
        system.material.size = 0.2;
        system.duration = 1000;
        return system;
    }
    
    static createMagicEffect(position) {
        const system = new ParticleSystem(position, 0x9370DB, 80);
        system.material.size = 0.15;
        return system;
    }
    
    static createRainEffect(position, count = 200) {
        const system = new ParticleSystem(position, 0x87CEEB, count);
        system.material.size = 0.05;
        
        // Make particles fall straight down
        system.velocities.forEach(v => {
            v.x = (Math.random() - 0.5) * 0.05;
            v.y = -Math.random() * 0.5 - 0.3;
            v.z = (Math.random() - 0.5) * 0.05;
            v.decay = 0.01;
        });
        
        return system;
    }
    
    static createFireEffect(position) {
        const system = new ParticleSystem(position, 0xFF8C00, 60);
        system.material.size = 0.25;
        
        // Make particles rise like fire
        system.velocities.forEach(v => {
            v.x = (Math.random() - 0.5) * 0.1;
            v.y = Math.random() * 0.4 + 0.1;
            v.z = (Math.random() - 0.5) * 0.1;
            v.decay = 0.03;
        });
        
        return system;
    }
    
    dispose() {
        this.geometry.dispose();
        this.material.dispose();
        this.active = false;
    }
}