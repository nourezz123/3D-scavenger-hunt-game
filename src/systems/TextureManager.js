import * as THREE from 'three';

export class TextureManager {
    constructor() {
        this.textures = {};
        this.loadingManager = new THREE.LoadingManager();
        this.textureLoader = new THREE.TextureLoader(this.loadingManager);
        this.cubeTextureLoader = new THREE.CubeTextureLoader(this.loadingManager);
        
        // Setup loading manager callbacks
        this.setupLoadingManager();
    }
    
    setupLoadingManager() {
        this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
            console.log(`Started loading: ${url} (${itemsLoaded}/${itemsTotal})`);
        };
        
        this.loadingManager.onLoad = () => {
            console.log('All textures loaded successfully');
        };
        
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            console.log(`Loading: ${url} (${itemsLoaded}/${itemsTotal})`);
        };
        
        this.loadingManager.onError = (url) => {
            console.error(`Error loading texture: ${url}`);
        };
    }
    
    async loadTextures() {
        const texturesToLoad = {
            // Ground textures
            'ground': 'textures/ground.jpg',
            'grass': 'textures/grass.jpg',
            'dirt': 'textures/dirt.jpg',
            'stone': 'textures/stone.jpg',
            'sand': 'textures/sand.jpg',
            
            // Skybox
            'skybox': {
                type: 'cube',
                urls: [
                    'textures/skybox/px.jpg', // right
                    'textures/skybox/nx.jpg', // left
                    'textures/skybox/py.jpg', // top
                    'textures/skybox/ny.jpg', // bottom
                    'textures/skybox/pz.jpg', // front
                    'textures/skybox/nz.jpg'  // back
                ]
            },
            
            // UI/Effects
            'particle': 'textures/particle.png',
            'noise': 'textures/noise.jpg'
        };
        
        try {
            await this.loadTextureSet(texturesToLoad);
        } catch (error) {
            console.warn('Texture loading failed, creating fallbacks:', error);
            this.createFallbackTextures();
        }
    }
    
    async loadTextureSet(textures) {
        const promises = [];
        
        for (const [name, config] of Object.entries(textures)) {
            if (config.type === 'cube') {
                promises.push(this.loadCubeTexture(name, config.urls));
            } else {
                promises.push(this.loadTexture(name, config));
            }
        }
        
        await Promise.all(promises);
    }
    
    loadTexture(name, url) {
        return new Promise((resolve, reject) => {
            this.textureLoader.load(
                url,
                (texture) => {
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(4, 4);
                    
                    if (name === 'ground' || name === 'grass') {
                        texture.anisotropy = 16;
                    }
                    
                    this.textures[name] = texture;
                    console.log(`Loaded texture: ${name}`);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.warn(`Failed to load texture ${name}:`, error);
                    this.createFallbackTexture(name);
                    resolve(this.textures[name]);
                }
            );
        });
    }
    
    loadCubeTexture(name, urls) {
        return new Promise((resolve, reject) => {
            this.cubeTextureLoader.load(
                urls,
                (texture) => {
                    this.textures[name] = texture;
                    console.log(`Loaded cube texture: ${name}`);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.warn(`Failed to load cube texture ${name}:`, error);
                    this.createFallbackSkybox();
                    resolve(this.textures[name]);
                }
            );
        });
    }
    
    createFallbackTextures() {
        // Create procedural textures as fallbacks
        this.createFallbackTexture('ground');
        this.createFallbackTexture('grass');
        this.createFallbackTexture('dirt');
        this.createFallbackTexture('stone');
        this.createFallbackTexture('sand');
        this.createFallbackSkybox();
        this.createParticleTexture();
        this.createNoiseTexture();
    }
    
    createFallbackTexture(name) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Different patterns for different texture types
        switch(name) {
            case 'ground':
                this.drawGrassPattern(ctx, canvas.width, canvas.height);
                break;
            case 'grass':
                this.drawGrassPattern(ctx, canvas.width, canvas.height, true);
                break;
            case 'dirt':
                this.drawDirtPattern(ctx, canvas.width, canvas.height);
                break;
            case 'stone':
                this.drawStonePattern(ctx, canvas.width, canvas.height);
                break;
            case 'sand':
                this.drawSandPattern(ctx, canvas.width, canvas.height);
                break;
            default:
                this.drawCheckeredPattern(ctx, canvas.width, canvas.height);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
        
        this.textures[name] = texture;
    }
    
    createFallbackSkybox() {
        // Create simple gradient skybox
        const size = 512;
        const canvases = [];
        
        for (let i = 0; i < 6; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            // Create gradient based on face
            let gradient;
            switch(i) {
                case 0: // right
                case 1: // left
                    gradient = ctx.createLinearGradient(0, 0, size, 0);
                    break;
                case 2: // top
                    gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
                    break;
                case 3: // bottom
                    gradient = ctx.createLinearGradient(0, 0, 0, size);
                    break;
                default:
                    gradient = ctx.createLinearGradient(0, 0, 0, size);
            }
            
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#E0F7FF');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, size, size);
            
            // Add some clouds to top face
            if (i === 2) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                for (let j = 0; j < 5; j++) {
                    const x = Math.random() * size;
                    const y = Math.random() * size;
                    const radius = 20 + Math.random() * 30;
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            canvases.push(canvas);
        }
        
        const cubeTexture = new THREE.CubeTexture(canvases.map(canvas => new THREE.CanvasTexture(canvas)));
        cubeTexture.needsUpdate = true;
        
        this.textures.skybox = cubeTexture;
    }
    
    createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Create circular gradient for particle
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        this.textures.particle = new THREE.CanvasTexture(canvas);
    }
    
    createNoiseTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const value = Math.random() * 255;
            data[i] = value;     // R
            data[i + 1] = value; // G
            data[i + 2] = value; // B
            data[i + 3] = 255;   // A
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        this.textures.noise = new THREE.CanvasTexture(canvas);
        this.textures.noise.wrapS = THREE.RepeatWrapping;
        this.textures.noise.wrapT = THREE.RepeatWrapping;
    }
    
    // Pattern drawing methods
    drawGrassPattern(ctx, width, height, detailed = false) {
        // Base color
        ctx.fillStyle = '#228B22';
        ctx.fillRect(0, 0, width, height);
        
        // Grass blades
        ctx.strokeStyle = '#1A6B1A';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const length = 5 + Math.random() * 10;
            const angle = Math.random() * Math.PI;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
            ctx.stroke();
        }
        
        if (detailed) {
            // Add more details for grass texture
            ctx.fillStyle = '#32CD32';
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                ctx.fillRect(x, y, 2, 2);
            }
        }
    }
    
    drawDirtPattern(ctx, width, height) {
        // Base color
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(0, 0, width, height);
        
        // Dirt specks
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = 1 + Math.random() * 3;
            const darkness = 30 + Math.random() * 70;
            
            ctx.fillStyle = `rgb(${darkness}, ${darkness - 20}, ${darkness - 40})`;
            ctx.fillRect(x, y, size, size);
        }
    }
    
    drawStonePattern(ctx, width, height) {
        // Base color
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, width, height);
        
        // Stone grain
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 50; i++) {
            const x1 = Math.random() * width;
            const y1 = Math.random() * height;
            const x2 = x1 + (Math.random() - 0.5) * 20;
            const y2 = y1 + (Math.random() - 0.5) * 20;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        // Highlight specks
        ctx.fillStyle = '#A9A9A9';
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            ctx.fillRect(x, y, 1, 1);
        }
    }
    
    drawSandPattern(ctx, width, height) {
        // Base color
        ctx.fillStyle = '#F4A460';
        ctx.fillRect(0, 0, width, height);
        
        // Sand grains
        for (let i = 0; i < 300; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = 1 + Math.random() * 2;
            const brightness = 180 + Math.random() * 75;
            
            ctx.fillStyle = `rgb(${brightness}, ${brightness - 40}, ${brightness - 80})`;
            ctx.fillRect(x, y, size, size);
        }
    }
    
    drawCheckeredPattern(ctx, width, height) {
        const tileSize = 32;
        
        for (let y = 0; y < height; y += tileSize) {
            for (let x = 0; x < width; x += tileSize) {
                ctx.fillStyle = (x + y) % (tileSize * 2) === 0 ? '#CCCCCC' : '#FFFFFF';
                ctx.fillRect(x, y, tileSize, tileSize);
            }
        }
    }
    
    getTexture(name) {
        return this.textures[name];
    }
    
    getSkybox() {
        return this.textures.skybox;
    }
    
    applyGroundTexture(mesh, textureName = 'ground') {
        const texture = this.getTexture(textureName);
        if (texture && mesh.material) {
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => {
                    if (mat.isMaterial) {
                        mat.map = texture;
                        mat.needsUpdate = true;
                    }
                });
            } else if (mesh.material.isMaterial) {
                mesh.material.map = texture;
                mesh.material.needsUpdate = true;
            }
        }
    }
    
    applySkybox(scene) {
        const skybox = this.getSkybox();
        if (skybox) {
            scene.background = skybox;
        }
    }
    
    dispose() {
        Object.values(this.textures).forEach(texture => {
            if (texture.dispose) {
                texture.dispose();
            }
        });
        this.textures = {};
    }
}