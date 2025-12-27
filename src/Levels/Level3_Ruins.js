import * as THREE from 'three';
import { Collectible } from '../objects/Collectible.js';

export class Level3_Ruins {
    constructor(scene, gameManager) {
        this.scene = scene;
        this.gameManager = gameManager;
        this.name = "Level 3 - Temple Ruins";
        this.totalItems = 10;
        this.itemsCollected = 0;
        
        this.collectibles = [];
        this.environmentObjects = [];
        this.lights = [];
    }
    
    load() {
        this.setupEnvironment();
        this.setupLighting();
        this.createCollectibles();
    }
    
    setupEnvironment() {
        this.scene.background = new THREE.Color(0x708090);
        this.scene.fog = new THREE.Fog(0x708090, 10, 100);
        
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(140, 140, 20, 20);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x696969,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const vertices = groundGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i + 2] = Math.random() * 3;
        }
        groundGeometry.attributes.position.needsUpdate = true;
        groundGeometry.computeVertexNormals();
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.environmentObjects.push(ground);
        
        // Pillars
        for (let i = 0; i < 20; i++) {
            this.createPillar(
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100
            );
        }
        
        // Ruins walls
        for (let i = 0; i < 10; i++) {
            this.createWall(
                (Math.random() - 0.5) * 80,
                (Math.random() - 0.5) * 80
            );
        }
        
        // Stone blocks
        for (let i = 0; i < 15; i++) {
            this.createStoneBlock(
                (Math.random() - 0.5) * 90,
                (Math.random() - 0.5) * 90
            );
        }
    }
    
    createPillar(x, z) {
        const height = 4 + Math.random() * 3;
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, height, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.7,
            metalness: 0.3
        });
        
        const pillar = new THREE.Mesh(geometry, material);
        pillar.position.set(x, height / 2, z);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        this.scene.add(pillar);
        this.environmentObjects.push(pillar);
        
        // Capital (top decoration)
        const capGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.8);
        const cap = new THREE.Mesh(capGeometry, material);
        cap.position.set(x, height + 0.15, z);
        cap.castShadow = true;
        this.scene.add(cap);
        this.environmentObjects.push(cap);
    }
    
    createWall(x, z) {
        const geometry = new THREE.BoxGeometry(6, 3, 0.5);
        const material = new THREE.MeshStandardMaterial({
            color: 0x696969,
            roughness: 0.8
        });
        
        const wall = new THREE.Mesh(geometry, material);
        wall.position.set(x, 1.5, z);
        wall.rotation.y = Math.random() * Math.PI;
        wall.castShadow = true;
        wall.receiveShadow = true;
        this.scene.add(wall);
        this.environmentObjects.push(wall);
    }
    
    createStoneBlock(x, z) {
        const size = 1 + Math.random();
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshStandardMaterial({
            color: 0x696969,
            roughness: 0.9
        });
        
        const block = new THREE.Mesh(geometry, material);
        block.position.set(x, size / 2, z);
        block.rotation.set(
            Math.random() * 0.3,
            Math.random() * Math.PI,
            Math.random() * 0.3
        );
        block.castShadow = true;
        block.receiveShadow = true;
        this.scene.add(block);
        this.environmentObjects.push(block);
    }
    
    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
        dirLight.position.set(20, 30, 20);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 100;
        dirLight.shadow.camera.left = -70;
        dirLight.shadow.camera.right = 70;
        dirLight.shadow.camera.top = 70;
        dirLight.shadow.camera.bottom = -70;
        this.scene.add(dirLight);
        this.lights.push(dirLight);
        
        // Mystical lights
        for (let i = 0; i < 10; i++) {
            const pointLight = new THREE.PointLight(0x9370DB, 2, 15);
            const angle = (i / 10) * Math.PI * 2;
            pointLight.position.set(
                Math.cos(angle) * 30,
                2,
                Math.sin(angle) * 30
            );
            pointLight.castShadow = true;
            this.scene.add(pointLight);
            this.lights.push(pointLight);
        }
    }
    
    createCollectibles() {
        const spreadRadius = 50;
        
        for (let i = 0; i < this.totalItems; i++) {
            const angle = (i / this.totalItems) * Math.PI * 2;
            const radius = 20 + Math.random() * spreadRadius;
            const position = new THREE.Vector3(
                Math.cos(angle) * radius,
                2,
                Math.sin(angle) * radius
            );
            
            const collectible = new Collectible(position, 1.5);
            this.scene.add(collectible.mesh);
            this.collectibles.push(collectible);
        }
    }
    
    update(delta) {
        this.collectibles.forEach(collectible => collectible.update(delta));
        
        // Animate mystical lights
        this.lights.forEach((light, index) => {
            if (light.isPointLight && light.color.r > 0.5) {
                light.intensity = 1.5 + Math.sin(Date.now() * 0.001 + index) * 0.5;
            }
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
    }
}