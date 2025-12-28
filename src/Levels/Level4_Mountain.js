import * as THREE from 'three';
import { Collectible } from '../objects/Collectible.js';

export class Level4_Mountain {
    constructor(scene, gameManager) {
        this.scene = scene;
        this.gameManager = gameManager;
        this.name = "Level 4 - Frostpeak Mountains";
        this.totalItems = 12;
        this.timeLimit = 180;
        this.itemsCollected = 0;
        
        this.collectibles = [];
        this.environmentObjects = [];
        this.lights = [];
        this.ground = null;
        this.mountain = null;
        this.iceBridges = [];
        
        this.checkpoints = [];
    }
    
    load() {
        this.setupEnvironment();
        this.setupLighting();
        this.createCollectibles();
        this.createBoundaries();
        this.createCheckpoints();
        
        console.log(`❄️ ${this.name} loaded with ${this.totalItems} collectibles`);
    }
    
    createBoundaries() {
        const boundarySize = 100;
        const wallHeight = 30;
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
        const markerGeometry = new THREE.ConeGeometry(2, 5, 4);
        const markerMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.5
        });
        
        const corners = [
            { x: -size + 10, z: -size + 10 },
            { x: size - 10, z: -size + 10 },
            { x: -size + 10, z: size - 10 },
            { x: size - 10, z: size - 10 }
        ];
        
        corners.forEach(corner => {
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.set(corner.x, 2.5, corner.z);
            marker.rotation.x = Math.PI;
            this.scene.add(marker);
        });
    }
    
    setupEnvironment() {
        // Winter sky
        this.scene.background = new THREE.Color(0xE0F7FF);
        this.scene.fog = new THREE.Fog(0xE0F7FF, 50, 250);
        
        // Create snowy ground
        const groundSize = 200;
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 50, 50);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Add gentle snow hills
        const positions = groundGeometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);
            // Create gentle hills
            const hill1 = Math.sin(x * 0.02) * 3;
            const hill2 = Math.cos(z * 0.02) * 3;
            const mountainBase = Math.max(0, 10 - Math.sqrt(x*x + z*z) * 0.1);
            positions.setY(i, hill1 + hill2 + mountainBase);
        }
        positions.needsUpdate = true;
        groundGeometry.computeVertexNormals();
        
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = -2; // Lower ground
        this.ground.receiveShadow = true;
        this.ground.castShadow = false;
        
        this.ground.userData = {
            isGround: true,
            type: 'ground'
        };
        
        this.scene.add(this.ground);
        this.environmentObjects.push(this.ground);
        
        // Create central mountain
        this.createMountain();
        
        // Create frozen lake
        this.createFrozenLake();
        
        // Create pine forests
        this.createPineForests();
        
        // Create ice bridges
        this.createIceBridges();
        
        // Create ice caves
        this.createIceCaves();
        
        // Create snowy rocks
        this.createSnowyRocks();
        
        // Create navigation lights
        this.createNavigationLights();
    }
    
    createMountain() {
        // Main mountain
        const mountainHeight = 40;
        const mountainRadius = 25;
        const mountainGeometry = new THREE.ConeGeometry(mountainRadius, mountainHeight, 8);
        const mountainMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.8,
            metalness: 0.2
        });
        
        this.mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
        this.mountain.position.set(0, mountainHeight / 2 - 2, 0);
        this.mountain.castShadow = true;
        this.mountain.receiveShadow = true;
        
        this.mountain.userData = {
            isGround: false,
            type: 'mountain'
        };
        
        this.scene.add(this.mountain);
        this.environmentObjects.push(this.mountain);
        
        // Smaller peaks around main mountain
        const peakPositions = [
            { x: 20, z: 20, height: 15 },
            { x: -20, z: 20, height: 18 },
            { x: 20, z: -20, height: 12 },
            { x: -20, z: -20, height: 16 }
        ];
        
        peakPositions.forEach(peak => {
            const peakGeometry = new THREE.ConeGeometry(8, peak.height, 6);
            const peakMesh = new THREE.Mesh(peakGeometry, mountainMaterial);
            peakMesh.position.set(peak.x, peak.height / 2 - 2, peak.z);
            peakMesh.castShadow = true;
            peakMesh.receiveShadow = true;
            
            this.scene.add(peakMesh);
            this.environmentObjects.push(peakMesh);
        });
        
        console.log('Mountain created');
    }
    
    createFrozenLake() {
        const lakeGeometry = new THREE.CircleGeometry(30, 32);
        const lakeMaterial = new THREE.MeshStandardMaterial({
            color: 0x87CEEB,
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: 0.8
        });
        
        const lake = new THREE.Mesh(lakeGeometry, lakeMaterial);
        lake.rotation.x = -Math.PI / 2;
        lake.position.set(0, 0.1, 50);
        lake.receiveShadow = true;
        
        this.scene.add(lake);
        
        // Add ice cracks
        for (let i = 0; i < 15; i++) {
            const crackLength = 5 + Math.random() * 10;
            const crackWidth = 0.1 + Math.random() * 0.2;
            const crackGeometry = new THREE.PlaneGeometry(crackLength, crackWidth);
            const crackMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            
            const crack = new THREE.Mesh(crackGeometry, crackMaterial);
            crack.rotation.x = -Math.PI / 2;
            crack.position.set(
                (Math.random() - 0.5) * 50,
                0.15,
                50 + (Math.random() - 0.5) * 20
            );
            crack.rotation.z = Math.random() * Math.PI;
            this.scene.add(crack);
        }
        
        console.log('Frozen lake created');
    }
    
    createPineForests() {
        const forestAreas = [
            { x: -60, z: -60, count: 10 },
            { x: 60, z: -60, count: 10 },
            { x: -60, z: 60, count: 8 },
            { x: 60, z: 60, count: 8 },
            { x: -70, z: 0, count: 6 },
            { x: 70, z: 0, count: 6 }
        ];
        
        forestAreas.forEach(area => {
            for (let i = 0; i < area.count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 15;
                
                this.createPineTree(
                    area.x + Math.cos(angle) * distance,
                    area.z + Math.sin(angle) * distance
                );
            }
        });
    }
    
    createPineTree(x, z) {
        // Get ground height at this position
        const groundHeight = this.getGroundHeight(x, z);
        
        // Trunk
        const trunkHeight = 3 + Math.random() * 2;
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, trunkHeight, 6);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, groundHeight + trunkHeight / 2, z);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        
        trunk.userData = {
            isGround: false,
            type: 'tree'
        };
        
        this.scene.add(trunk);
        this.environmentObjects.push(trunk);
        
        // Pine foliage (layers)
        const foliageMaterial = new THREE.MeshStandardMaterial({
            color: 0x228B22,
            roughness: 0.8
        });
        
        // Create 3 layers of foliage
        for (let layer = 0; layer < 3; layer++) {
            const layerHeight = trunkHeight - layer * 0.8;
            const layerRadius = 1.5 - layer * 0.4;
            
            const foliageGeometry = new THREE.ConeGeometry(layerRadius, 2, 8);
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.set(x, groundHeight + layerHeight, z);
            foliage.castShadow = true;
            foliage.receiveShadow = true;
            
            foliage.userData = {
                isGround: false,
                type: 'foliage'
            };
            
            this.scene.add(foliage);
            this.environmentObjects.push(foliage);
        }
        
        // Add snow on top
        const snowGeometry = new THREE.SphereGeometry(0.5, 8, 6);
        const snowMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.9
        });
        const snow = new THREE.Mesh(snowGeometry, snowMaterial);
        snow.position.set(x, groundHeight + trunkHeight + 1, z);
        snow.scale.set(1, 0.5, 1);
        this.scene.add(snow);
    }
    
    createIceBridges() {
        // Create bridges across gaps
        const bridgePositions = [
            { start: { x: -30, z: 0 }, end: { x: 30, z: 0 }, width: 3 },
            { start: { x: 0, z: -30 }, end: { x: 0, z: 30 }, width: 3 },
            { start: { x: -40, z: -40 }, end: { x: 40, z: 40 }, width: 2.5 }
        ];
        
        bridgePositions.forEach(bridge => {
            const length = Math.sqrt(
                Math.pow(bridge.end.x - bridge.start.x, 2) + 
                Math.pow(bridge.end.z - bridge.start.z, 2)
            );
            
            const bridgeGeometry = new THREE.BoxGeometry(length, 0.5, bridge.width);
            const bridgeMaterial = new THREE.MeshStandardMaterial({
                color: 0x87CEEB,
                roughness: 0.1,
                metalness: 0.8,
                transparent: true,
                opacity: 0.9
            });
            
            const bridgeMesh = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
            
            // Position at midpoint
            const midX = (bridge.start.x + bridge.end.x) / 2;
            const midZ = (bridge.start.z + bridge.end.z) / 2;
            bridgeMesh.position.set(midX, 5, midZ);
            
            // Rotate to align with bridge direction
            const angle = Math.atan2(bridge.end.z - bridge.start.z, bridge.end.x - bridge.start.x);
            bridgeMesh.rotation.y = -angle;
            
            bridgeMesh.castShadow = true;
            bridgeMesh.receiveShadow = true;
            
            bridgeMesh.userData = {
                isGround: true,
                type: 'bridge',
                slippery: true
            };
            
            this.scene.add(bridgeMesh);
            this.environmentObjects.push(bridgeMesh);
            this.iceBridges.push(bridgeMesh);
        });
        
        console.log('Ice bridges created');
    }
    
    createIceCaves() {
        // Create ice cave entrances
        const cavePositions = [
            { x: -50, z: 0, size: 8 },
            { x: 50, z: 0, size: 8 },
            { x: 0, z: -50, size: 6 },
            { x: 0, z: 50, size: 6 }
        ];
        
        cavePositions.forEach(cave => {
            const caveGeometry = new THREE.SphereGeometry(cave.size, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
            const caveMaterial = new THREE.MeshStandardMaterial({
                color: 0x87CEEB,
                roughness: 0.1,
                metalness: 0.7,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            });
            
            const caveMesh = new THREE.Mesh(caveGeometry, caveMaterial);
            caveMesh.position.set(cave.x, cave.size / 2, cave.z);
            caveMesh.rotation.x = Math.PI;
            caveMesh.castShadow = true;
            caveMesh.receiveShadow = true;
            
            this.scene.add(caveMesh);
            this.environmentObjects.push(caveMesh);
            
            // Add icicles
            for (let i = 0; i < 5; i++) {
                this.createIcicle(cave.x, cave.size, cave.z + cave.size * 0.8);
            }
        });
    }
    
    createIcicle(x, y, z) {
        const icicleGeometry = new THREE.ConeGeometry(0.2, 2, 4);
        const icicleMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: 0.8
        });
        
        const icicle = new THREE.Mesh(icicleGeometry, icicleMaterial);
        icicle.position.set(x + (Math.random() - 0.5) * 3, y - 1, z + (Math.random() - 0.5) * 3);
        icicle.rotation.x = Math.PI;
        icicle.castShadow = true;
        
        this.scene.add(icicle);
        this.environmentObjects.push(icicle);
    }
    
    createSnowyRocks() {
        const rockClusters = [
            { x: -30, z: -30, count: 5 },
            { x: 30, z: -30, count: 5 },
            { x: -30, z: 30, count: 4 },
            { x: 30, z: 30, count: 4 }
        ];
        
        rockClusters.forEach(cluster => {
            for (let i = 0; i < cluster.count; i++) {
                const offsetX = (Math.random() - 0.5) * 10;
                const offsetZ = (Math.random() - 0.5) * 10;
                this.createSnowyRock(cluster.x + offsetX, cluster.z + offsetZ);
            }
        });
    }
    
    createSnowyRock(x, z) {
        const groundHeight = this.getGroundHeight(x, z);
        const size = 1 + Math.random() * 2;
        
        const rockGeometry = new THREE.DodecahedronGeometry(size, 0);
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.95
        });
        
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.set(x, groundHeight + size * 0.5, z);
        rock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        rock.castShadow = true;
        rock.receiveShadow = true;
        
        rock.userData = {
            isGround: false,
            type: 'rock'
        };
        
        this.scene.add(rock);
        this.environmentObjects.push(rock);
        
        // Add snow on top of rock
        const snowGeometry = new THREE.SphereGeometry(size * 0.6, 8, 6);
        const snowMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.9
        });
        const snow = new THREE.Mesh(snowGeometry, snowMaterial);
        snow.position.set(x, groundHeight + size, z);
        snow.scale.set(1, 0.3, 1);
        this.scene.add(snow);
    }
    
    createNavigationLights() {
        // Create glowing crystals for navigation
        const lightPositions = [
            { x: 0, z: -70, color: 0x00FF00 },
            { x: 0, z: 70, color: 0x00FF00 },
            { x: -70, z: 0, color: 0x00FF00 },
            { x: 70, z: 0, color: 0x00FF00 },
            { x: -50, z: -50, color: 0x00FFFF },
            { x: 50, z: -50, color: 0x00FFFF },
            { x: -50, z: 50, color: 0x00FFFF },
            { x: 50, z: 50, color: 0x00FFFF }
        ];
        
        lightPositions.forEach(light => {
            const crystalGeometry = new THREE.ConeGeometry(1, 3, 4);
            const crystalMaterial = new THREE.MeshBasicMaterial({
                color: light.color,
                transparent: true,
                opacity: 0.7
            });
            
            const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
            const groundHeight = this.getGroundHeight(light.x, light.z);
            crystal.position.set(light.x, groundHeight + 1.5, light.z);
            crystal.rotation.x = Math.PI;
            
            this.scene.add(crystal);
            
            // Add point light
            const pointLight = new THREE.PointLight(light.color, 1, 20);
            pointLight.position.set(light.x, groundHeight + 2, light.z);
            this.scene.add(pointLight);
            this.lights.push(pointLight);
        });
    }
    
    createCheckpoints() {
        // Create checkpoints for player guidance
        this.checkpoints = [
            { x: 0, z: -60, reached: false },
            { x: 60, z: 0, reached: false },
            { x: 0, z: 60, reached: false },
            { x: -60, z: 0, reached: false }
        ];
        
        this.checkpoints.forEach(checkpoint => {
            const flagGeometry = new THREE.BoxGeometry(0.1, 3, 0.1);
            const flagMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
            const flag = new THREE.Mesh(flagGeometry, flagMaterial);
            
            const groundHeight = this.getGroundHeight(checkpoint.x, checkpoint.z);
            flag.position.set(checkpoint.x, groundHeight + 1.5, checkpoint.z);
            
            this.scene.add(flag);
        });
    }
    
    getGroundHeight(x, z) {
        // Simple height function for the terrain
        const hill1 = Math.sin(x * 0.02) * 3;
        const hill2 = Math.cos(z * 0.02) * 3;
        const mountainBase = Math.max(0, 10 - Math.sqrt(x*x + z*z) * 0.1);
        return hill1 + hill2 + mountainBase - 2;
    }
    
    setupLighting() {
        // Cold ambient light
        const ambientLight = new THREE.AmbientLight(0x87CEEB, 0.6);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);
        
        // Directional light (sun)
        const dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(30, 50, 30);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 200;
        dirLight.shadow.camera.left = -100;
        dirLight.shadow.camera.right = 100;
        dirLight.shadow.camera.top = 100;
        dirLight.shadow.camera.bottom = -100;
        this.scene.add(dirLight);
        this.lights.push(dirLight);
        
        // Cold hemisphere light
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0xFFFFFF, 0.5);
        this.scene.add(hemiLight);
        this.lights.push(hemiLight);
        
        console.log('Winter lighting setup complete');
    }
    
    createCollectibles() {
        console.log('Placing collectibles in winter level...');
        
        // Strategic locations for collectibles
        const collectibleLocations = [
            // Around mountain base
            { x: 25, z: 25, height: 2 },
            { x: -25, z: 25, height: 2 },
            { x: 25, z: -25, height: 2 },
            { x: -25, z: -25, height: 2 },
            
            // On ice bridges
            { x: 0, z: 0, height: 6 },
            { x: 20, z: 20, height: 6 },
            { x: -20, z: -20, height: 6 },
            
            // Near caves
            { x: -45, z: 0, height: 3 },
            { x: 45, z: 0, height: 3 },
            { x: 0, z: -45, height: 3 },
            { x: 0, z: 45, height: 3 },
            
            // In forest areas
            { x: -65, z: -65, height: 4 },
            { x: 65, z: -65, height: 4 }
        ];
        
        // Take only the number we need
        const locationsToUse = collectibleLocations.slice(0, this.totalItems);
        
        locationsToUse.forEach((location, index) => {
            const groundHeight = this.getGroundHeight(location.x, location.z);
            const position = new THREE.Vector3(
                location.x,
                groundHeight + location.height,
                location.z
            );
            
            const collectible = new Collectible(position, 3);
            collectible.mesh.scale.set(1.2, 1.2, 1.2);
            
            // Make collectibles icy blue
            if (collectible.mesh.material && collectible.mesh.material.color) {
                collectible.mesh.material.color.set(0x00FFFF);
            }
            
            this.scene.add(collectible.mesh);
            this.collectibles.push(collectible);
            
            // Add icy platform
            const platformGeometry = new THREE.CylinderGeometry(1, 1.5, 0.3, 8);
            const platformMaterial = new THREE.MeshBasicMaterial({
                color: 0x87CEEB,
                transparent: true,
                opacity: 0.5
            });
            const platform = new THREE.Mesh(platformGeometry, platformMaterial);
            platform.position.set(location.x, groundHeight + 0.15, location.z);
            this.scene.add(platform);
            
            console.log(`Collectible ${index + 1}: (${location.x.toFixed(1)}, ${location.z.toFixed(1)})`);
        });
        
        console.log(`❄️ Placed ${this.collectibles.length} collectibles in winter level`);
    }
    
    update(delta) {
        // Update collectibles
        this.collectibles.forEach(collectible => {
            if (collectible && collectible.update) {
                collectible.update(delta);
            }
        });
        
        // Animate ice bridges slightly
        const time = Date.now() * 0.001;
        this.iceBridges.forEach((bridge, index) => {
            if (bridge) {
                bridge.position.y = 5 + Math.sin(time * 0.5 + index) * 0.1;
            }
        });
        
        // Check checkpoint proximity
        if (this.gameManager && this.gameManager.player) {
            const playerPos = this.gameManager.player.getPosition();
            this.checkpoints.forEach((checkpoint, index) => {
                if (!checkpoint.reached) {
                    const distance = Math.sqrt(
                        Math.pow(playerPos.x - checkpoint.x, 2) + 
                        Math.pow(playerPos.z - checkpoint.z, 2)
                    );
                    
                    if (distance < 5) {
                        checkpoint.reached = true;
                        console.log(`✅ Checkpoint ${index + 1} reached!`);
                    }
                }
            });
        }
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
        const boundarySize = 100;
        const isOutside = (
            Math.abs(playerPosition.x) > boundarySize ||
            Math.abs(playerPosition.z) > boundarySize
        );
        
        const isFallen = playerPosition.y < -20;
        
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
        
        // Remove additional scene elements (platforms, crystals, etc.)
        const elementsToRemove = [];
        this.scene.traverse((child) => {
            if (child.material && 
                (child.material.opacity === 0.5 || 
                 child.material.opacity === 0.7 ||
                 child.material.opacity === 0.6)) {
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
        this.mountain = null;
        this.iceBridges = [];
        this.checkpoints = [];
        
        console.log('Winter mountain level cleaned up');
    }
}