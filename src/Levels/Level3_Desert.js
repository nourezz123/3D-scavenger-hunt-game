import * as THREE from 'three';
import { Collectible } from '../objects/Collectible.js';

export class Level3_Desert {
    constructor(scene, gameManager) {
        this.scene = scene;
        this.gameManager = gameManager;
        this.name = "Level 3 - Sandy Oasis";
        this.totalItems = 8;
        this.timeLimit = 140;
        this.itemsCollected = 0;
        
        this.collectibles = [];
        this.environmentObjects = [];
        this.lights = [];
        this.ground = null;
        this.dunes = null;
        this.obstaclePositions = [];
    }
    
    load() {
        this.setupEnvironment();
        this.setupLighting();
        this.createCollectibles();
        this.createBoundaries();
        
        console.log(`✅ ${this.name} loaded with ${this.totalItems} collectibles`);
    }
    
    createBoundaries() {
        const boundarySize = 75;
        const wallHeight = 10;
        const wallThickness = 2;
        
        const boundaryMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0
        });
        
        const walls = [
            { pos: [0, wallHeight/2, -boundarySize], size: [boundarySize*2, wallHeight, wallThickness] },
            { pos: [0, wallHeight/2, boundarySize], size: [boundarySize*2, wallHeight, wallThickness] },
            { pos: [boundarySize, wallHeight/2, 0], size: [wallThickness, wallHeight, boundarySize*2] },
            { pos: [-boundarySize, wallHeight/2, 0], size: [wallThickness, wallHeight, boundarySize*2] }
        ];
        
        walls.forEach(wall => {
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(...wall.size),
                boundaryMaterial
            );
            mesh.position.set(...wall.pos);
            this.scene.add(mesh);
            this.environmentObjects.push(mesh);
        });
        
        this.createBoundaryMarkers(boundarySize);
    }
    
    createBoundaryMarkers(size) {
        const markerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
        const markerMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFD700,
            transparent: true,
            opacity: 0.7
        });
        
        const corners = [
            { x: -size + 5, z: -size + 5 },
            { x: size - 5, z: -size + 5 },
            { x: -size + 5, z: size - 5 },
            { x: size - 5, z: size - 5 }
        ];
        
        corners.forEach(corner => {
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.set(corner.x, 1.5, corner.z);
            this.scene.add(marker);
        });
    }
    
    setupEnvironment() {
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
        
        const groundSize = 150;
        const groundGeometry = new THREE.BoxGeometry(groundSize, 1, groundSize);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0xF4D03F,
            roughness: 0.8,
            metalness: 0.1
        });
        
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.position.set(0, -0.5, 0);
        this.ground.receiveShadow = true;
        this.ground.castShadow = false;
        
        this.ground.userData = {
            isGround: true,
            type: 'ground'
        };
        
        this.scene.add(this.ground);
        this.environmentObjects.push(this.ground);
        
        this.createGentleDunes();
        this.createCentralOasis();
        this.createSimplePyramid(20, 20, 8);
        this.createSimplePyramid(-25, -20, 6);
        this.createOasisPalmTrees();
        this.createRockFormations();
        this.createCactiClusters();
        this.createNavigationPaths();
    }
    
    createGentleDunes() {
        const duneGeometry = new THREE.PlaneGeometry(150, 150, 20, 20);
        const duneMaterial = new THREE.MeshStandardMaterial({
            color: 0xF4D03F,
            roughness: 0.9,
            metalness: 0.05,
            transparent: true,
            opacity: 0.8
        });
        
        const positions = duneGeometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = Math.sin(x * 0.03) * 2 + Math.cos(y * 0.03) * 2;
            positions.setZ(i, z);
        }
        positions.needsUpdate = true;
        duneGeometry.computeVertexNormals();
        
        this.dunes = new THREE.Mesh(duneGeometry, duneMaterial);
        this.dunes.rotation.x = -Math.PI / 2;
        this.dunes.position.y = 0.01;
        this.dunes.receiveShadow = true;
        this.dunes.castShadow = false;
        
        this.dunes.userData = {
            isGround: false,
            type: 'visual'
        };
        
        this.scene.add(this.dunes);
    }
    
    createCentralOasis() {
        const waterGeometry = new THREE.CircleGeometry(15, 32);
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x1E90FF,
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: 0.7
        });
        
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.rotation.x = -Math.PI / 2;
        water.position.y = 0.1;
        this.scene.add(water);
        
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const distance = 10 + Math.random() * 5;
            
            const lilyGeometry = new THREE.CircleGeometry(0.8, 8);
            const lilyMaterial = new THREE.MeshBasicMaterial({
                color: 0x32CD32,
                side: THREE.DoubleSide
            });
            
            const lily = new THREE.Mesh(lilyGeometry, lilyMaterial);
            lily.rotation.x = -Math.PI / 2;
            lily.position.set(
                Math.cos(angle) * distance,
                0.15,
                Math.sin(angle) * distance
            );
            this.scene.add(lily);
        }
    }
    
    createSimplePyramid(x, z, size) {
        const height = size * 0.6;
        const geometry = new THREE.ConeGeometry(size, height, 4);
        const material = new THREE.MeshStandardMaterial({
            color: 0xDAA520,
            roughness: 0.9,
            metalness: 0.2
        });
        
        const pyramid = new THREE.Mesh(geometry, material);
        pyramid.position.set(x, height / 2, z);
        pyramid.castShadow = true;
        pyramid.receiveShadow = true;
        
        pyramid.userData = {
            isGround: false,
            type: 'obstacle',
            position: { x, z },
            size: size
        };
        
        this.scene.add(pyramid);
        this.environmentObjects.push(pyramid);
        this.obstaclePositions.push({ x, z, size });
        
        const entranceGeometry = new THREE.BoxGeometry(size * 0.4, height * 0.5, 0.5);
        const entranceMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 1
        });
        const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
        entrance.position.set(x, height * 0.25, z - size * 0.8);
        entrance.castShadow = true;
        
        entrance.userData = {
            isGround: false,
            type: 'obstacle'
        };
        
        this.scene.add(entrance);
        this.environmentObjects.push(entrance);
    }
    
    createOasisPalmTrees() {
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 25 + Math.random() * 10;
            
            this.createSimplePalmTree(
                Math.cos(angle) * distance,
                Math.sin(angle) * distance
            );
        }
    }
    
    createSimplePalmTree(x, z) {
        let tooClose = false;
        this.obstaclePositions.forEach(obstacle => {
            const distance = Math.sqrt(Math.pow(x - obstacle.x, 2) + Math.pow(z - obstacle.z, 2));
            if (distance < obstacle.size + 8) {
                tooClose = true;
            }
        });
        if (tooClose) return;
        
        const trunkHeight = 4 + Math.random() * 2;
        const trunkGeometry = new THREE.CylinderGeometry(0.25, 0.3, trunkHeight, 6);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, trunkHeight / 2, z);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        
        trunk.userData = {
            isGround: false,
            type: 'tree'
        };
        
        this.scene.add(trunk);
        this.environmentObjects.push(trunk);
        
        const leafMaterial = new THREE.MeshStandardMaterial({
            color: 0x228B22,
            roughness: 0.8,
            side: THREE.DoubleSide
        });
        
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const leafGeometry = new THREE.BoxGeometry(0.2, 2, 0.6);
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            leaf.position.set(
                x + Math.cos(angle) * 1.2,
                trunkHeight + 0.8,
                z + Math.sin(angle) * 1.2
            );
            leaf.rotation.z = Math.cos(angle) * 0.3;
            leaf.rotation.x = Math.sin(angle) * 0.3;
            leaf.castShadow = true;
            
            this.scene.add(leaf);
            this.environmentObjects.push(leaf);
        }
    }
    
    createRockFormations() {
        const rockPositions = [
            { x: -40, z: 35 },
            { x: 45, z: -30 },
            { x: -50, z: -40 },
            { x: 35, z: 45 }
        ];
        
        rockPositions.forEach(pos => {
            const rockCount = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < rockCount; i++) {
                const offsetX = (Math.random() - 0.5) * 4;
                const offsetZ = (Math.random() - 0.5) * 4;
                this.createSimpleRock(pos.x + offsetX, pos.z + offsetZ);
            }
        });
    }
    
    createSimpleRock(x, z) {
        const size = 0.5 + Math.random() * 1;
        const geometry = new THREE.DodecahedronGeometry(size, 0);
        const material = new THREE.MeshStandardMaterial({
            color: 0xC2B280,
            roughness: 0.95
        });
        
        const rock = new THREE.Mesh(geometry, material);
        rock.position.set(x, size * 0.5, z);
        rock.castShadow = true;
        rock.receiveShadow = true;
        
        rock.userData = {
            isGround: false,
            type: 'rock'
        };
        
        this.scene.add(rock);
        this.environmentObjects.push(rock);
    }
    
    createCactiClusters() {
        const cactusClusters = [
            { x: -30, z: 0, count: 3 },
            { x: 30, z: 0, count: 3 },
            { x: 0, z: -40, count: 2 },
            { x: 0, z: 40, count: 2 }
        ];
        
        cactusClusters.forEach(cluster => {
            for (let i = 0; i < cluster.count; i++) {
                const offsetX = (Math.random() - 0.5) * 8;
                const offsetZ = (Math.random() - 0.5) * 8;
                this.createSimpleCactus(cluster.x + offsetX, cluster.z + offsetZ);
            }
        });
    }
    
    createSimpleCactus(x, z) {
        const height = 1.5 + Math.random() * 1;
        const geometry = new THREE.CylinderGeometry(0.2, 0.25, height, 6);
        const material = new THREE.MeshStandardMaterial({
            color: 0x2E8B57,
            roughness: 0.9
        });
        
        const cactus = new THREE.Mesh(geometry, material);
        cactus.position.set(x, height / 2, z);
        cactus.castShadow = true;
        cactus.receiveShadow = true;
        
        cactus.userData = {
            isGround: false,
            type: 'cactus'
        };
        
        this.scene.add(cactus);
        this.environmentObjects.push(cactus);
    }
    
    createNavigationPaths() {
        const pathMaterial = new THREE.LineBasicMaterial({
            color: 0x8B7355,
            transparent: true,
            opacity: 0.3
        });
        
        const path1Points = [];
        path1Points.push(new THREE.Vector3(0, 0.2, 0));
        path1Points.push(new THREE.Vector3(15, 0.2, 15));
        path1Points.push(new THREE.Vector3(20, 0.2, 20));
        
        const path1Geometry = new THREE.BufferGeometry().setFromPoints(path1Points);
        const path1 = new THREE.Line(path1Geometry, pathMaterial);
        this.scene.add(path1);
        
        const path2Points = [];
        path2Points.push(new THREE.Vector3(0, 0.2, 0));
        path2Points.push(new THREE.Vector3(-15, 0.2, -15));
        path2Points.push(new THREE.Vector3(-25, 0.2, -20));
        
        const path2Geometry = new THREE.BufferGeometry().setFromPoints(path2Points);
        const path2 = new THREE.Line(path2Geometry, pathMaterial);
        this.scene.add(path2);
    }
    
    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.8);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xFFFFFF, 1);
        dirLight.position.set(30, 50, 20);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 150;
        dirLight.shadow.camera.left = -50;
        dirLight.shadow.camera.right = 50;
        dirLight.shadow.camera.top = 50;
        dirLight.shadow.camera.bottom = -50;
        this.scene.add(dirLight);
        this.lights.push(dirLight);
        
        const hemiLight = new THREE.HemisphereLight(0xFFFACD, 0xF4D03F, 0.6);
        this.scene.add(hemiLight);
        this.lights.push(hemiLight);
    }
    
    createCollectibles() {
        console.log('Placing collectibles in accessible locations...');
        
        const safeZones = [
            { x: -35, z: -35, radius: 15 },
            { x: 35, z: -35, radius: 15 },
            { x: -35, z: 35, radius: 15 },
            { x: 35, z: 35, radius: 15 },
            { x: 0, z: -25, radius: 10 },
            { x: 0, z: 25, radius: 10 },
            { x: -25, z: 0, radius: 10 },
            { x: 25, z: 0, radius: 10 }
        ];
        
        safeZones.forEach((zone, index) => {
            if (index < this.totalItems) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * zone.radius;
                
                const x = zone.x + Math.cos(angle) * distance;
                const z = zone.z + Math.sin(angle) * distance;
                
                if (Math.abs(x) < 10 && Math.abs(z) < 10) {
                    const newX = x * 1.5;
                    const newZ = z * 1.5;
                    this.createCollectibleAt(newX, newZ, index);
                } else {
                    this.createCollectibleAt(x, z, index);
                }
            }
        });
        
        console.log(`✅ Placed ${this.collectibles.length} collectibles in clear areas`);
    }
    
    createCollectibleAt(x, z, index) {
        const position = new THREE.Vector3(x, 1.5, z);
        const collectible = new Collectible(position, 2);
        collectible.mesh.scale.set(0.8, 0.8, 0.8);
        
        this.scene.add(collectible.mesh);
        this.collectibles.push(collectible);
        
        const platformGeometry = new THREE.CylinderGeometry(0.8, 1, 0.2, 8);
        const platformMaterial = new THREE.MeshBasicMaterial({
            color: 0xDAA520,
            transparent: true,
            opacity: 0.5
        });
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(x, 0.1, z);
        this.scene.add(platform);
        
        console.log(`Collectible ${index + 1}: (${x.toFixed(1)}, ${z.toFixed(1)})`);
    }
    
    update(delta) {
        this.collectibles.forEach(collectible => {
            if (collectible && collectible.update) {
                collectible.update(delta);
            }
        });
    }
    
    checkCollisions(playerPosition) {
        let collectedCount = 0;
        
        this.collectibles.forEach((collectible, index) => {
            if (collectible && collectible.checkCollision && collectible.checkCollision(playerPosition)) {
                if (collectible.collect) {
                    collectible.collect((c) => {
                        this.scene.remove(c.mesh);
                        if (c.dispose) c.dispose();
                    });
                }
                
                this.collectibles[index] = null;
                this.itemsCollected++;
                collectedCount++;
                this.gameManager.onItemCollected();
            }
        });
        
        this.collectibles = this.collectibles.filter(c => c !== null);
        
        return collectedCount;
    }
    
    checkBoundaryViolation(playerPosition) {
        const boundarySize = 75;
        const isOutside = (
            Math.abs(playerPosition.x) > boundarySize ||
            Math.abs(playerPosition.z) > boundarySize
        );
        
        const isFallen = playerPosition.y < -10;
        
        return isOutside || isFallen;
    }
    
    dispose() {
        // Remove collectibles
        this.collectibles.forEach(c => {
            if (c && c.mesh) {
                this.scene.remove(c.mesh);
                if (c.dispose) c.dispose();
            }
        });
        
        // Remove environment objects
        this.environmentObjects.forEach(obj => {
            if (obj && obj.parent) {
                this.scene.remove(obj);
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(material => material.dispose());
                    } else {
                        obj.material.dispose();
                    }
                }
            }
        });
        
        // Remove lights
        this.lights.forEach(light => {
            if (light && light.parent) {
                this.scene.remove(light);
            }
        });
        
        // Remove visual dunes
        if (this.dunes && this.dunes.parent) {
            this.scene.remove(this.dunes);
            if (this.dunes.geometry) this.dunes.geometry.dispose();
            if (this.dunes.material) this.dunes.material.dispose();
        }
        
        // Clean up additional scene elements
        const elementsToRemove = [];
        this.scene.traverse((child) => {
            if (child.isLine || (child.material && child.material.opacity === 0.5)) {
                elementsToRemove.push(child);
            }
        });
        
        elementsToRemove.forEach(child => {
            this.scene.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
        
        // Clear arrays
        this.collectibles = [];
        this.environmentObjects = [];
        this.lights = [];
        this.ground = null;
        this.dunes = null;
        this.obstaclePositions = [];
        
        console.log('Desert level cleaned up');
    }
}