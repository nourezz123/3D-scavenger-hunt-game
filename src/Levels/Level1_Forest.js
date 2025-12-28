import * as THREE from 'three';
import { Collectible } from '../objects/Collectible.js';

export class Level1_Forest {
    constructor(scene, gameManager) {
        this.scene = scene;
        this.gameManager = gameManager;
        this.name = "Level 1 - Enchanted Forest";
        this.totalItems = 5;
        this.itemsCollected = 0;
        this.timeLimit = 60; // 30 seconds
        this.difficulty = 1;
        
        this.collectibles = [];
        this.environmentObjects = [];
        this.lights = [];
        this.boundarySize = 45;
    }
    
    load() {
        this.setupEnvironment();
        this.setupLighting();
        this.createCollectibles();
        this.createBoundaries();
    }
    
    createBoundaries() {
        // Create visible white warning boundaries with death zones
        const boundarySize = this.boundarySize;
        const wallHeight = 20;
        
        // Warning zone material (white)
        const warningMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.7,
            emissive: 0xFFFFFF,
            emissiveIntensity: 0.5,
            side: THREE.DoubleSide
        });
        
        // Create warning walls
        const walls = [
            { pos: [0, wallHeight/2, -boundarySize], size: [boundarySize*2, wallHeight, 0.5] },
            { pos: [0, wallHeight/2, boundarySize], size: [boundarySize*2, wallHeight, 0.5] },
            { pos: [boundarySize, wallHeight/2, 0], size: [0.5, wallHeight, boundarySize*2] },
            { pos: [-boundarySize, wallHeight/2, 0], size: [0.5, wallHeight, boundarySize*2] }
        ];
        
        walls.forEach(wall => {
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(...wall.size),
                warningMaterial
            );
            mesh.position.set(...wall.pos);
            this.scene.add(mesh);
            this.environmentObjects.push(mesh);
        });
    }
    
    checkBoundaryViolation(playerPosition) {
        return Math.abs(playerPosition.x) > this.boundarySize || 
               Math.abs(playerPosition.z) > this.boundarySize;
    }
    
    setupEnvironment() {
        // Sky
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 30, 100);
        
        // Ground with terrain variation
        const groundGeometry = new THREE.PlaneGeometry(100, 100, 20, 20);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x228B22,
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Add terrain height variation
        const vertices = groundGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i + 2] = Math.random() * 2;
        }
        groundGeometry.attributes.position.needsUpdate = true;
        groundGeometry.computeVertexNormals();
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.environmentObjects.push(ground);
        
        // Create forest trees
        this.createTrees();
        
        // Add rocks and bushes
        this.createRocks();
        this.createBushes();
    }
    
    createTrees() {
        const treeCount = 30;
        
        for (let i = 0; i < treeCount; i++) {
            const x = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 80;
            
            // Skip if too close to center (spawn point)
            if (Math.sqrt(x * x + z * z) < 10) continue;
            
            this.createTree(x, z);
        }
    }
    
    createTree(x, z) {
        // Trunk
        const trunkHeight = 4 + Math.random() * 3;
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, trunkHeight, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, trunkHeight / 2, z);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        this.scene.add(trunk);
        this.environmentObjects.push(trunk);
        
        // Foliage (crown)
        const foliageGeometry = new THREE.ConeGeometry(2 + Math.random(), 4, 8);
        const foliageMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x228B22,
            roughness: 0.8
        });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.set(x, trunkHeight + 2, z);
        foliage.castShadow = true;
        foliage.receiveShadow = true;
        this.scene.add(foliage);
        this.environmentObjects.push(foliage);
        
        // Additional foliage layer for fuller look
        const foliage2 = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage2.position.set(x, trunkHeight + 1, z);
        foliage2.scale.set(1.2, 0.8, 1.2);
        foliage2.castShadow = true;
        this.scene.add(foliage2);
        this.environmentObjects.push(foliage2);
    }
    
    createRocks() {
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * 90;
            const z = (Math.random() - 0.5) * 90;
            
            const size = 0.5 + Math.random() * 1.5;
            const rockGeometry = new THREE.DodecahedronGeometry(size, 0);
            const rockMaterial = new THREE.MeshStandardMaterial({
                color: 0x808080,
                roughness: 0.9,
                metalness: 0.1
            });
            
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
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
    }
    
    createBushes() {
        for (let i = 0; i < 25; i++) {
            const x = (Math.random() - 0.5) * 85;
            const z = (Math.random() - 0.5) * 85;
            
            const bushGeometry = new THREE.SphereGeometry(0.5 + Math.random() * 0.5, 8, 8);
            const bushMaterial = new THREE.MeshStandardMaterial({
                color: 0x2F4F2F,
                roughness: 0.85
            });
            
            const bush = new THREE.Mesh(bushGeometry, bushMaterial);
            bush.position.set(x, 0.3, z);
            bush.scale.set(1, 0.7, 1);
            bush.castShadow = true;
            bush.receiveShadow = true;
            this.scene.add(bush);
            this.environmentObjects.push(bush);
        }
    }
    
    setupLighting() {
        // Ambient light for overall brightness
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);
        
        // Main directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        
        // Shadow settings
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        
        this.scene.add(directionalLight);
        this.lights.push(directionalLight);
        
        // Hemisphere light for natural outdoor lighting
        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x228B22, 0.5);
        this.scene.add(hemisphereLight);
        this.lights.push(hemisphereLight);
    }
    
    createCollectibles() {
        // Spread collectibles around the forest
        const spreadRadius = 35;
        
        for (let i = 0; i < this.totalItems; i++) {
            // Distribute in a circle pattern
            const angle = (i / this.totalItems) * Math.PI * 2;
            const radius = 10 + Math.random() * spreadRadius;
            
            const position = new THREE.Vector3(
                Math.cos(angle) * radius,
                1.5, // Height above ground
                Math.sin(angle) * radius
            );
            
            const collectible = new Collectible(position);
            this.scene.add(collectible.mesh);
            this.collectibles.push(collectible);
        }
        
        console.log(`Created ${this.totalItems} collectibles for ${this.name}`);
    }
    
    update(delta) {
        // Update all collectibles (spinning, bobbing animation)
        this.collectibles.forEach(collectible => {
            collectible.update(delta);
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
        // Clean up collectibles
        this.collectibles.forEach(c => {
            this.scene.remove(c.mesh);
            c.dispose();
        });
        
        // Clean up environment objects
        this.environmentObjects.forEach(obj => {
            this.scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
        
        // Remove lights
        this.lights.forEach(light => {
            this.scene.remove(light);
        });
        
        // Clear arrays
        this.collectibles = [];
        this.environmentObjects = [];
        this.lights = [];
        
        console.log(`${this.name} disposed`);
    }
}