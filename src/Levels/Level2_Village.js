import * as THREE from 'three';
import { Collectible } from '../objects/Collectible.js';

export class Level2_Village {
    constructor(scene, gameManager) {
        this.scene = scene;
        this.gameManager = gameManager;
        this.name = "Level 2 - Village";
        this.totalItems = 8;
        this.itemsCollected = 0;
        this.timeLimit = 70; // 45 seconds
        this.difficulty = 2;
        
        this.collectibles = [];
        this.environmentObjects = [];
        this.lights = [];
        this.boundarySize = 55;
    }
    
    load() {
        this.setupEnvironment();
        this.setupLighting();
        this.createCollectibles();
        this.createBoundaries();
    }
    
    createBoundaries() {
        // Visible white warning boundaries
        const boundarySize = this.boundarySize;
        const wallHeight = 20;
        
        const warningMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.7,
            emissive: 0xFFFFFF,
            emissiveIntensity: 0.5,
            side: THREE.DoubleSide
        });
        
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
        this.scene.background = new THREE.Color(0xB0C4DE);
        this.scene.fog = new THREE.Fog(0xB0C4DE, 30, 120);
        
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(120, 120, 20, 20);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x9b7653,
            roughness: 0.85,
            metalness: 0.1
        });
        
        const vertices = groundGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i + 2] = Math.random() * 1.5;
        }
        groundGeometry.attributes.position.needsUpdate = true;
        groundGeometry.computeVertexNormals();
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.environmentObjects.push(ground);
        
        // Buildings
        for (let i = 0; i < 12; i++) {
            this.createBuilding(
                (Math.random() - 0.5) * 90,
                (Math.random() - 0.5) * 90
            );
        }
        
        // Wells/decorations
        for (let i = 0; i < 5; i++) {
            this.createWell(
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50
            );
        }
    }
    
    createBuilding(x, z) {
        const width = 3 + Math.random() * 2;
        const height = 4 + Math.random() * 2;
        const depth = 3 + Math.random() * 2;
        
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: 0xa67c52,
            roughness: 0.85
        });
        
        const building = new THREE.Mesh(geometry, material);
        building.position.set(x, height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        this.scene.add(building);
        this.environmentObjects.push(building);
        
        // Roof
        const roofGeometry = new THREE.ConeGeometry(width * 0.7, 2, 4);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x6b4423,
            roughness: 0.9
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(x, height + 1, z);
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        this.scene.add(roof);
        this.environmentObjects.push(roof);
    }
    
    createWell(x, z) {
        const geometry = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0x505050,
            roughness: 0.8
        });
        
        const well = new THREE.Mesh(geometry, material);
        well.position.set(x, 0.75, z);
        well.castShadow = true;
        well.receiveShadow = true;
        this.scene.add(well);
        this.environmentObjects.push(well);
    }
    
    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
        dirLight.position.set(20, 30, 20);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 100;
        dirLight.shadow.camera.left = -60;
        dirLight.shadow.camera.right = 60;
        dirLight.shadow.camera.top = 60;
        dirLight.shadow.camera.bottom = -60;
        this.scene.add(dirLight);
        this.lights.push(dirLight);
        
        const hemiLight = new THREE.HemisphereLight(0xB0C4DE, 0x9b7653, 0.6);
        this.scene.add(hemiLight);
        this.lights.push(hemiLight);
    }
    
    createCollectibles() {
        const spreadRadius = 45;
        
        for (let i = 0; i < this.totalItems; i++) {
            const angle = (i / this.totalItems) * Math.PI * 2;
            const radius = 15 + Math.random() * spreadRadius;
            const position = new THREE.Vector3(
                Math.cos(angle) * radius,
                1.5,
                Math.sin(angle) * radius
            );
            
            const collectible = new Collectible(position, 1.5);
            this.scene.add(collectible.mesh);
            this.collectibles.push(collectible);
        }
    }
    
    update(delta) {
        this.collectibles.forEach(collectible => collectible.update(delta));
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