import * as THREE from 'three';
import { Collectible } from '../objects/Collectible.js';

export class Level1_Forest {
    constructor(scene, gameManager) {
        this.scene = scene;
        this.gameManager = gameManager;
        this.name = "Level 1 - Forest";
        this.totalItems = 5;
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
        // Sky
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 10, 100);
        
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(100, 100, 20, 20);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x228B22,
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Add terrain variation
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
        
        // Trees
        for (let i = 0; i < 15; i++) {
            this.createTree(
                (Math.random() - 0.5) * 80,
                (Math.random() - 0.5) * 80
            );
        }
    }
    
    createTree(x, z) {
        // Trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 4, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, 2, z);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        this.scene.add(trunk);
        this.environmentObjects.push(trunk);
        
        // Leaves
        const leavesGeometry = new THREE.SphereGeometry(1.5, 8, 8);
        const leavesMaterial = new THREE.MeshStandardMaterial({
            color: 0x228B22,
            roughness: 0.8
        });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.set(x, 5, z);
        leaves.castShadow = true;
        this.scene.add(leaves);
        this.environmentObjects.push(leaves);
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);
        
        // Directional light (sun)
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(20, 30, 20);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 100;
        dirLight.shadow.camera.left = -50;
        dirLight.shadow.camera.right = 50;
        dirLight.shadow.camera.top = 50;
        dirLight.shadow.camera.bottom = -50;
        this.scene.add(dirLight);
        this.lights.push(dirLight);
        
        // Point lights (ambient torches)
        for (let i = 0; i < 6; i++) {
            const pointLight = new THREE.PointLight(0xFFA500, 1.5, 20);
            const angle = (i / 6) * Math.PI * 2;
            pointLight.position.set(
                Math.cos(angle) * 20,
                3,
                Math.sin(angle) * 20
            );
            pointLight.castShadow = true;
            this.scene.add(pointLight);
            this.lights.push(pointLight);
        }
    }
    
    createCollectibles() {
        const spreadRadius = 30;
        
        for (let i = 0; i < this.totalItems; i++) {
            const angle = (i / this.totalItems) * Math.PI * 2;
            const radius = 10 + Math.random() * spreadRadius;
            const position = new THREE.Vector3(
                Math.cos(angle) * radius,
                1.5,
                Math.sin(angle) * radius
            );
            
            const collectible = new Collectible(position, 1);
            this.scene.add(collectible.mesh);
            this.collectibles.push(collectible);
        }
    }
    
    update(delta) {
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
        // Clean up all objects
        this.collectibles.forEach(c => {
            this.scene.remove(c.mesh);
            c.dispose();
        });
        
        this.environmentObjects.forEach(obj => {
            this.scene.remove(obj);
            obj.geometry?.dispose();
            obj.material?.dispose();
        });
        
        this.lights.forEach(light => {
            this.scene.remove(light);
        });
        
        this.collectibles = [];
        this.environmentObjects = [];
        this.lights = [];
    }
}