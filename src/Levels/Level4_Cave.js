import * as THREE from 'three';
import { Collectible } from '../objects/Collectible.js';

export class Level4_Cave {
    constructor(scene, gameManager) {
        this.scene = scene;
        this.gameManager = gameManager;
        this.name = "Level 4 - Dark Cave";
        this.totalItems = 12;
        this.itemsCollected = 0;
        
        this.collectibles = [];
        this.environmentObjects = [];
        this.lights = [];
        this.torches = []; // Array to hold torch lights for animation
    }
    
    load() {
        this.setupEnvironment();
        this.setupLighting();
        this.createCollectibles();
    }
    
    setupEnvironment() {
        // Darker but visible background
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.Fog(0x1a1a2e, 10, 70);
        
        // Ground with better visibility
        const groundGeometry = new THREE.PlaneGeometry(160, 160, 30, 30);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a3a4a,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const vertices = groundGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i + 2] = Math.random() * 4 - 2;
        }
        groundGeometry.attributes.position.needsUpdate = true;
        groundGeometry.computeVertexNormals();
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.environmentObjects.push(ground);
        
        // Stalagmites
        for (let i = 0; i < 30; i++) {
            this.createStalagmite(
                (Math.random() - 0.5) * 140,
                (Math.random() - 0.5) * 140
            );
        }
        
        // Glowing crystals (more for better visibility)
        for (let i = 0; i < 30; i++) {
            this.createCrystal(
                (Math.random() - 0.5) * 120,
                (Math.random() - 0.5) * 120
            );
        }
        
        // Rock formations
        for (let i = 0; i < 25; i++) {
            this.createRock(
                (Math.random() - 0.5) * 130,
                (Math.random() - 0.5) * 130
            );
        }
        
        // Add torches on walls for ambient lighting
        this.createTorches();
    }
    
    createTorches() {
        // Create ring of torches around the cave
        const torchCount = 12;
        for (let i = 0; i < torchCount; i++) {
            const angle = (i / torchCount) * Math.PI * 2;
            const radius = 60;
            
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Torch post
            const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 6);
            const postMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x3a2a1a,
                roughness: 0.8 
            });
            const post = new THREE.Mesh(postGeometry, postMaterial);
            post.position.set(x, 1, z);
            post.castShadow = true;
            this.scene.add(post);
            this.environmentObjects.push(post);
            
            // Torch flame (sphere)
            const flameGeometry = new THREE.SphereGeometry(0.3, 8, 8);
            const flameMaterial = new THREE.MeshStandardMaterial({
                color: 0xff6600,
                emissive: 0xff4400,
                emissiveIntensity: 2
            });
            const flame = new THREE.Mesh(flameGeometry, flameMaterial);
            flame.position.set(x, 2.5, z);
            this.scene.add(flame);
            this.environmentObjects.push(flame);
            
            // Point light for torch
            const torchLight = new THREE.PointLight(0xff6600, 3, 25);
            torchLight.position.set(x, 2.5, z);
            torchLight.castShadow = true;
            this.scene.add(torchLight);
            this.lights.push(torchLight);
            this.torches.push({ light: torchLight, flame: flame, baseIntensity: 3 });
        }
    }
    
    createStalagmite(x, z) {
        const height = 2 + Math.random() * 4;
        const geometry = new THREE.ConeGeometry(0.4, height, 6);
        const material = new THREE.MeshStandardMaterial({
            color: 0x5a5a5a,
            roughness: 0.9
        });
        
        const stalagmite = new THREE.Mesh(geometry, material);
        stalagmite.position.set(x, height / 2, z);
        stalagmite.castShadow = true;
        stalagmite.receiveShadow = true;
        this.scene.add(stalagmite);
        this.environmentObjects.push(stalagmite);
    }
    
    createCrystal(x, z) {
        const size = 0.8 + Math.random() * 1.2;
        const geometry = new THREE.OctahedronGeometry(size, 0);
        
        // Variety of crystal colors for visual interest
        const colors = [0x00BFFF, 0x00FFFF, 0x4169E1, 0x87CEEB];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 1.2,
            roughness: 0.2,
            metalness: 0.8
        });
        
        const crystal = new THREE.Mesh(geometry, material);
        crystal.position.set(x, size, z);
        crystal.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        crystal.castShadow = true;
        this.scene.add(crystal);
        this.environmentObjects.push(crystal);
        
        // Add point light for glow (brighter)
        const light = new THREE.PointLight(color, 2, 12);
        light.position.copy(crystal.position);
        this.scene.add(light);
        this.lights.push(light);
    }
    
    createRock(x, z) {
        const size = 1 + Math.random() * 2;
        const geometry = new THREE.DodecahedronGeometry(size, 0);
        const material = new THREE.MeshStandardMaterial({
            color: 0x4a4a4a,
            roughness: 0.95
        });
        
        const rock = new THREE.Mesh(geometry, material);
        rock.position.set(x, size * 0.5, z);
        rock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        rock.castShadow = true;
        rock.receiveShadow = true;
        this.scene.add(rock);
        this.environmentObjects.push(rock);
    }
    
    setupLighting() {
        // Increased ambient light for better visibility
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);
        
        // Directional light (like moonlight through cave opening)
        const dirLight = new THREE.DirectionalLight(0x6699ff, 0.4);
        dirLight.position.set(10, 30, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 100;
        dirLight.shadow.camera.left = -80;
        dirLight.shadow.camera.right = 80;
        dirLight.shadow.camera.top = 80;
        dirLight.shadow.camera.bottom = -80;
        this.scene.add(dirLight);
        this.lights.push(dirLight);
        
        // Additional mysterious glowing lights (increased intensity)
        for (let i = 0; i < 20; i++) {
            const pointLight = new THREE.PointLight(0x00BFFF, 4, 25);
            const angle = (i / 20) * Math.PI * 2;
            const radius = 35 + Math.random() * 25;
            pointLight.position.set(
                Math.cos(angle) * radius,
                2 + Math.random() * 4,
                Math.sin(angle) * radius
            );
            pointLight.castShadow = true;
            this.scene.add(pointLight);
            this.lights.push(pointLight);
        }
        
        // Add hemisphere light for better ambient lighting
        const hemiLight = new THREE.HemisphereLight(0x4488ff, 0x002244, 0.3);
        this.scene.add(hemiLight);
        this.lights.push(hemiLight);
    }
    
    createCollectibles() {
        const spreadRadius = 60;
        
        for (let i = 0; i < this.totalItems; i++) {
            const angle = (i / this.totalItems) * Math.PI * 2;
            const radius = 25 + Math.random() * spreadRadius;
            const position = new THREE.Vector3(
                Math.cos(angle) * radius,
                2,
                Math.sin(angle) * radius
            );
            
            // Brighter collectibles in dark cave
            const collectible = new Collectible(position, 3);
            this.scene.add(collectible.mesh);
            this.collectibles.push(collectible);
        }
    }
    
    update(delta) {
        this.collectibles.forEach(collectible => collectible.update(delta));
        
        const time = Date.now() * 0.001;
        
        // Animate glowing crystals
        this.environmentObjects.forEach((obj, index) => {
            if (obj.material && obj.material.emissive) {
                obj.material.emissiveIntensity = 0.8 + Math.sin(time + index) * 0.4;
                obj.rotation.y += 0.005;
            }
        });
        
        // Flicker cave lights for atmosphere
        this.lights.forEach((light, index) => {
            if (light.isPointLight && light.color.b > 0.8) {
                light.intensity = 3 + Math.sin(time * 3 + index) * 1;
            }
        });
        
        // Animate torch flames
        this.torches.forEach((torch, index) => {
            const flicker = Math.sin(time * 8 + index) * 0.3 + Math.random() * 0.2;
            torch.light.intensity = torch.baseIntensity + flicker;
            
            // Flame movement
            torch.flame.position.y = 2.5 + Math.sin(time * 5 + index) * 0.1;
            torch.flame.scale.setScalar(1 + Math.sin(time * 10 + index) * 0.1);
        });
    }
    
    checkCollisions(playerPosition) {
        this.collectibles.forEach(collectible => {
            if (collectible.checkCollision(playerPosition)) {
                collectible.collect((c) => {
                    this.scene.remove(c.mesh);
                    c.dispose();
                });
                
                this.itemsCollected++;
                this.gameManager.onItemCollected();
            }
        });
    }
    
    dispose() {
        this.collectibles.forEach(c => {
            this.scene.remove(c.mesh);
            c.dispose();
        });
        
        this.environmentObjects.forEach(obj => {
            this.scene.remove(obj);
            obj.geometry?.dispose();
            obj.material?.dispose();
        });
        
        this.lights.forEach(light => this.scene.remove(light));
        
        this.collectibles = [];
        this.environmentObjects = [];
        this.lights = [];
        this.torches = [];
    }
}