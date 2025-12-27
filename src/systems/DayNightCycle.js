import * as THREE from 'three';

export class DayNightCycle {
    constructor(scene) {
        this.scene = scene;
        this.time = 0; // 0-1, where 0.5 is noon
        this.speed = 0.0001;
        this.isDay = true;
        
        // Create lights
        this.sun = new THREE.DirectionalLight(0xFFFFFF, 1.5);
        this.sun.position.set(100, 100, 50);
        this.sun.castShadow = true;
        this.sun.shadow.mapSize.width = 2048;
        this.sun.shadow.mapSize.height = 2048;
        this.sun.shadow.camera.near = 0.5;
        this.sun.shadow.camera.far = 500;
        this.sun.shadow.camera.left = -100;
        this.sun.shadow.camera.right = 100;
        this.sun.shadow.camera.top = 100;
        this.sun.shadow.camera.bottom = -100;
        
        this.moon = new THREE.DirectionalLight(0x6666FF, 0.3);
        this.moon.castShadow = true;
        
        // Ambient light that changes with time
        this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        
        // Add lights to scene
        this.scene.add(this.sun);
        this.scene.add(this.moon);
        this.scene.add(this.ambientLight);
        
        // Create sky gradient
        this.createSky();
        
        // Stars for night
        this.createStars();
        
        console.log('Day/Night cycle initialized');
    }
    
    createSky() {
        // Create sky sphere
        const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
        this.skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                sunPosition: { value: new THREE.Vector3() },
                time: { value: 0 },
                topColor: { value: new THREE.Color(0x87CEEB) },
                horizonColor: { value: new THREE.Color(0xE0F7FF) },
                bottomColor: { value: new THREE.Color(0xFFFFFF) },
                nightColor: { value: new THREE.Color(0x0A0E27) }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 sunPosition;
                uniform float time;
                uniform vec3 topColor;
                uniform vec3 horizonColor;
                uniform vec3 bottomColor;
                uniform vec3 nightColor;
                varying vec3 vWorldPosition;
                
                void main() {
                    float h = normalize(vWorldPosition).y;
                    float t = smoothstep(-0.5, 0.5, time);
                    
                    // Day gradient
                    vec3 dayColor = mix(bottomColor, horizonColor, smoothstep(-0.2, 0.2, h));
                    dayColor = mix(dayColor, topColor, smoothstep(0.0, 1.0, h));
                    
                    // Night gradient
                    vec3 nightSky = mix(nightColor * 0.5, nightColor, smoothstep(-0.2, 0.5, h));
                    
                    // Blend between day and night
                    vec3 color = mix(nightSky, dayColor, t);
                    
                    // Add sun glow
                    vec3 sunDir = normalize(sunPosition);
                    vec3 viewDir = normalize(vWorldPosition);
                    float sunDot = dot(sunDir, viewDir);
                    float sunGlow = smoothstep(0.998, 1.0, sunDot) * t;
                    color += vec3(1.0, 0.8, 0.6) * sunGlow * 2.0;
                    
                    // Add horizon glow at sunset/sunrise
                    float horizonGlow = smoothstep(0.0, 0.1, h) * (1.0 - abs(time - 0.25) * 4.0);
                    color += vec3(1.0, 0.5, 0.2) * horizonGlow * 0.5;
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            side: THREE.BackSide
        });
        
        this.sky = new THREE.Mesh(skyGeometry, this.skyMaterial);
        this.scene.add(this.sky);
    }
    
    createStars() {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 2000;
        const positions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount * 3; i += 3) {
            // Random position on sphere
            const radius = 490 + Math.random() * 10;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            
            positions[i] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = radius * Math.cos(phi);
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.5,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.stars);
    }
    
    update(delta) {
        // Update time
        this.time += this.speed * delta * 60;
        if (this.time > 1) this.time = 0;
        
        // Calculate sun and moon positions
        const angle = this.time * Math.PI * 2;
        const radius = 200;
        
        // Sun moves in a circle
        this.sun.position.x = Math.cos(angle) * radius;
        this.sun.position.y = Math.sin(angle) * radius + 50;
        this.sun.position.z = Math.sin(angle * 0.5) * radius;
        
        // Moon is opposite the sun
        this.moon.position.x = -this.sun.position.x;
        this.moon.position.y = -this.sun.position.y;
        this.moon.position.z = -this.sun.position.z;
        
        // Update light intensities based on time
        const sunHeight = this.sun.position.y / radius;
        const sunIntensity = Math.max(0, Math.min(1, sunHeight * 2));
        const moonIntensity = Math.max(0, Math.min(0.3, -sunHeight * 0.6));
        
        this.sun.intensity = sunIntensity * 1.5;
        this.moon.intensity = moonIntensity;
        
        // Update ambient light
        this.ambientLight.intensity = 0.2 + sunIntensity * 0.3;
        
        // Update sky material
        if (this.skyMaterial.uniforms) {
            this.skyMaterial.uniforms.time.value = this.time;
            this.skyMaterial.uniforms.sunPosition.value.copy(this.sun.position);
        }
        
        // Update star visibility
        const starVisibility = Math.max(0, Math.min(1, -sunHeight * 2));
        this.stars.visible = starVisibility > 0.1;
        this.stars.material.opacity = starVisibility * 0.8;
        
        // Check if it's day or night
        const wasDay = this.isDay;
        this.isDay = sunHeight > 0;
        
        // Trigger events on day/night change
        if (wasDay !== this.isDay) {
            this.onDayNightChange(this.isDay);
        }
        
        // Rotate stars slowly
        this.stars.rotation.y += delta * 0.01;
    }
    
    onDayNightChange(isDay) {
        const event = new CustomEvent('daynightchange', {
            detail: { isDay: isDay, time: this.time }
        });
        window.dispatchEvent(event);
        
        console.log(isDay ? '☀️ Day begins' : '🌙 Night begins');
    }
    
    setTime(time) {
        this.time = THREE.MathUtils.clamp(time, 0, 1);
    }
    
    setSpeed(speed) {
        this.speed = speed;
    }
    
    getTimeOfDay() {
        if (this.time < 0.25) return 'night';
        if (this.time < 0.3) return 'dawn';
        if (this.time < 0.7) return 'day';
        if (this.time < 0.75) return 'dusk';
        return 'night';
    }
    
    // Helper to get color based on time
    getSkyColor() {
        const time = this.time;
        if (time < 0.25 || time > 0.75) return 0x0A0E27; // Night
        if (time < 0.3) return 0xFF8C69; // Dawn
        if (time < 0.7) return 0x87CEEB; // Day
        return 0x4A5F7A; // Dusk
    }
    
    dispose() {
        this.scene.remove(this.sun);
        this.scene.remove(this.moon);
        this.scene.remove(this.ambientLight);
        this.scene.remove(this.sky);
        this.scene.remove(this.stars);
        
        this.sun.dispose();
        this.moon.dispose();
        this.ambientLight.dispose();
        this.sky.geometry.dispose();
        this.sky.material.dispose();
        this.stars.geometry.dispose();
        this.stars.material.dispose();
    }
}