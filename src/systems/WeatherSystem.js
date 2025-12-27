import * as THREE from 'three';
import { ParticleSystem } from '../objects/ParticleSystem.js';

export class WeatherSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.weather = 'clear'; // clear, rain, snow, fog, storm
        this.intensity = 0; // 0-1
        this.transitionSpeed = 0.01;
        
        // Particle systems
        this.rainParticles = null;
        this.snowParticles = null;
        
        // Fog
        this.fog = null;
        
        // Lightning
        this.lightning = null;
        this.lightningTimer = 0;
        this.lightningInterval = 3000; // ms
        
        // Wind
        this.windStrength = 0;
        this.windDirection = new THREE.Vector3(1, 0, 0);
        
        // Audio
        this.rainAudio = null;
        this.thunderAudio = null;
        
        console.log('Weather system initialized');
    }
    
    setWeather(type, intensity = 0.5) {
        const oldWeather = this.weather;
        this.weather = type;
        this.intensity = THREE.MathUtils.clamp(intensity, 0, 1);
        
        console.log(`Weather changed: ${oldWeather} -> ${type} (intensity: ${intensity})`);
        
        // Clear previous weather effects
        this.clearEffects();
        
        // Setup new weather effects
        switch(type) {
            case 'rain':
                this.setupRain();
                break;
            case 'snow':
                this.setupSnow();
                break;
            case 'fog':
                this.setupFog();
                break;
            case 'storm':
                this.setupStorm();
                break;
            case 'clear':
            default:
                this.setupClear();
                break;
        }
        
        // Dispatch weather change event
        const event = new CustomEvent('weatherchange', {
            detail: { weather: type, intensity: this.intensity }
        });
        window.dispatchEvent(event);
    }
    
    setupRain() {
        // Create rain particle system
        const rainPosition = this.camera.position.clone();
        rainPosition.y += 20;
        
        this.rainParticles = ParticleSystem.createRainEffect(rainPosition, Math.floor(300 * this.intensity));
        this.scene.add(this.rainParticles.points);
        
        // Add fog for atmosphere
        this.fog = new THREE.Fog(0x87CEEB, 50, 100);
        this.scene.fog = this.fog;
        
        // Set wind
        this.windStrength = 0.2 * this.intensity;
        
        // Update scene background for rainy atmosphere
        this.scene.background = new THREE.Color(0x4A5F7A);
    }
    
    setupSnow() {
        // Create snow particle system
        const snowPosition = this.camera.position.clone();
        snowPosition.y += 20;
        
        this.snowParticles = new ParticleSystem(snowPosition, 0xFFFFFF, Math.floor(200 * this.intensity));
        this.snowParticles.material.size = 0.1;
        
        // Make snow fall slowly and swirl
        this.snowParticles.velocities.forEach(v => {
            v.x = (Math.random() - 0.5) * 0.05;
            v.y = -Math.random() * 0.1 - 0.05;
            v.z = (Math.random() - 0.5) * 0.05;
            v.decay = 0.005;
        });
        
        this.scene.add(this.snowParticles.points);
        
        // Add fog for atmosphere
        this.fog = new THREE.Fog(0xE0F7FF, 30, 80);
        this.scene.fog = this.fog;
        
        // Update scene background
        this.scene.background = new THREE.Color(0xA0B0C0);
    }
    
    setupFog() {
        // Create dense fog
        this.fog = new THREE.Fog(0x808080, 10, 50 * (1 + this.intensity));
        this.scene.fog = this.fog;
        
        // Update scene background
        this.scene.background = new THREE.Color(0x708090);
    }
    
    setupStorm() {
        // Heavy rain
        this.setupRain();
        this.intensity = Math.max(this.intensity, 0.7);
        
        // Add lightning
        this.lightning = new THREE.PointLight(0xFFFFFF, 0);
        this.scene.add(this.lightning);
        
        // Set stronger wind
        this.windStrength = 0.5 * this.intensity;
        
        // Darker atmosphere
        this.scene.background = new THREE.Color(0x2C3E50);
        if (this.fog) {
            this.fog.color = new THREE.Color(0x2C3E50);
        }
        
        // Start lightning timer
        this.lightningTimer = 0;
    }
    
    setupClear() {
        // Clear all effects
        this.scene.fog = null;
        this.scene.background = null;
        this.windStrength = 0;
    }
    
    clearEffects() {
        // Remove particle systems
        if (this.rainParticles) {
            this.scene.remove(this.rainParticles.points);
            this.rainParticles.dispose();
            this.rainParticles = null;
        }
        
        if (this.snowParticles) {
            this.scene.remove(this.snowParticles.points);
            this.snowParticles.dispose();
            this.snowParticles = null;
        }
        
        // Remove lightning
        if (this.lightning) {
            this.scene.remove(this.lightning);
            this.lightning = null;
        }
        
        // Clear fog
        this.scene.fog = null;
    }
    
    update(delta) {
        // Update weather effects based on current type
        switch(this.weather) {
            case 'rain':
                this.updateRain(delta);
                break;
            case 'snow':
                this.updateSnow(delta);
                break;
            case 'storm':
                this.updateStorm(delta);
                break;
        }
        
        // Update particle positions to follow camera
        this.updateParticlePositions();
    }
    
    updateRain(delta) {
        if (this.rainParticles) {
            // Update rain particle system
            this.rainParticles.update(delta);
            
            // Apply wind to rain
            this.rainParticles.velocities.forEach(v => {
                v.x += this.windDirection.x * this.windStrength * delta;
                v.z += this.windDirection.z * this.windStrength * delta;
            });
            
            // Update fog based on intensity
            if (this.fog) {
                this.fog.near = 30 * (1 - this.intensity * 0.5);
                this.fog.far = 70 + this.intensity * 50;
            }
        }
    }
    
    updateSnow(delta) {
        if (this.snowParticles) {
            // Update snow particle system
            this.snowParticles.update(delta);
            
            // Make snow swirl with wind
            this.snowParticles.velocities.forEach(v => {
                v.x += Math.sin(Date.now() * 0.001 + v.y) * 0.01 * this.windStrength;
                v.z += Math.cos(Date.now() * 0.001 + v.y) * 0.01 * this.windStrength;
            });
            
            // Update fog
            if (this.fog) {
                this.fog.near = 20;
                this.fog.far = 60 + this.intensity * 40;
            }
        }
    }
    
    updateStorm(delta) {
        // Update rain
        this.updateRain(delta);
        
        // Update lightning
        this.updateLightning(delta);
    }
    
    updateLightning(delta) {
        if (!this.lightning) return;
        
        this.lightningTimer += delta * 1000;
        
        if (this.lightningTimer >= this.lightningInterval) {
            // Create lightning flash
            this.createLightningFlash();
            
            // Randomize next lightning interval
            this.lightningInterval = 2000 + Math.random() * 4000;
            this.lightningTimer = 0;
        }
        
        // Fade lightning light
        if (this.lightning.intensity > 0) {
            this.lightning.intensity -= delta * 5;
        }
    }
    
    createLightningFlash() {
        if (!this.lightning) return;
        
        // Random position near player
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 100;
        
        this.lightning.position.set(
            this.camera.position.x + Math.cos(angle) * distance,
            30 + Math.random() * 20,
            this.camera.position.z + Math.sin(angle) * distance
        );
        
        // Bright flash
        this.lightning.intensity = 5 + Math.random() * 5;
        
        // Quick decay
        setTimeout(() => {
            if (this.lightning) {
                this.lightning.intensity = 0;
            }
        }, 100);
        
        // Random thunder sound timing
        setTimeout(() => {
            this.playThunderSound();
        }, 200 + Math.random() * 1000);
    }
    
    updateParticlePositions() {
        // Make particle systems follow camera
        const cameraPos = this.camera.position;
        
        if (this.rainParticles) {
            this.rainParticles.points.position.x = cameraPos.x;
            this.rainParticles.points.position.z = cameraPos.z;
            this.rainParticles.points.position.y = cameraPos.y + 20;
        }
        
        if (this.snowParticles) {
            this.snowParticles.points.position.x = cameraPos.x;
            this.snowParticles.points.position.z = cameraPos.z;
            this.snowParticles.points.position.y = cameraPos.y + 20;
        }
    }
    
    playThunderSound() {
        // In a real implementation, you would play an audio file
        console.log('⚡ Thunder!');
        
        // Dispatch event for audio system
        const event = new CustomEvent('thunder');
        window.dispatchEvent(event);
    }
    
    setWind(strength, direction) {
        this.windStrength = THREE.MathUtils.clamp(strength, 0, 1);
        this.windDirection = direction.normalize();
    }
    
    getWeatherInfo() {
        return {
            type: this.weather,
            intensity: this.intensity,
            windStrength: this.windStrength,
            windDirection: this.windDirection
        };
    }
    
    dispose() {
        this.clearEffects();
    }
}