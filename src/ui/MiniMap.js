export class MiniMap {
    constructor(gameManager, player, size = 150) {
        this.gameManager = gameManager;
        this.player = player;
        this.size = size;
        this.scale = 0.08; // Adjust this to change zoom level
        this.showCollectibles = true;
        this.showPlayer = true;
        
        this.createUI();
        console.log('Mini-map created');
    }
    
    createUI() {
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: ${this.size}px;
            height: ${this.size}px;
            border: 2px solid #00ff88;
            border-radius: 10px;
            background: rgba(10, 14, 39, 0.95);
            backdrop-filter: blur(10px);
            overflow: hidden;
            z-index: 1000;
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
            transition: all 0.3s ease;
        `;
        
        // Add hover effect
        this.container.addEventListener('mouseenter', () => {
            this.container.style.transform = 'scale(1.05)';
            this.container.style.boxShadow = '0 0 30px rgba(0, 255, 136, 0.5)';
        });
        
        this.container.addEventListener('mouseleave', () => {
            this.container.style.transform = 'scale(1)';
            this.container.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.3)';
        });
        
        // Click to toggle zoom
        this.container.addEventListener('click', () => {
            this.toggleZoom();
        });
        
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.canvas.style.cssText = `
            width: 100%;
            height: 100%;
            display: block;
        `;
        
        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);
        document.body.appendChild(this.container);
        
        // Create compass
        this.createCompass();
    }
    
    createCompass() {
        this.compass = document.createElement('div');
        this.compass.style.cssText = `
            position: absolute;
            top: 5px;
            left: 5px;
            color: #00ff88;
            font-family: 'Orbitron', monospace;
            font-size: 10px;
            font-weight: bold;
            text-shadow: 0 0 5px rgba(0, 255, 136, 0.8);
        `;
        this.container.appendChild(this.compass);
    }
    
    update() {
        if (!this.gameManager.currentLevel || !this.player) return;
        
        this.ctx.clearRect(0, 0, this.size, this.size);
        
        // Draw background with grid
        this.drawBackground();
        
        const centerX = this.size / 2;
        const centerY = this.size / 2;
        const playerPos = this.player.getPosition();
        const playerRotation = this.player.getRotation ? this.player.getRotation() : { y: 0 };
        
        // Draw collectibles
        if (this.showCollectibles && this.gameManager.currentLevel.collectibles) {
            this.drawCollectibles(playerPos, centerX, centerY);
        }
        
        // Draw player
        if (this.showPlayer) {
            this.drawPlayer(centerX, centerY, playerRotation.y);
        }
        
        // Draw border and details
        this.drawBorder();
        
        // Update compass
        this.updateCompass(playerRotation.y);
    }
    
    drawBackground() {
        // Solid background
        this.ctx.fillStyle = 'rgba(10, 14, 39, 0.9)';
        this.ctx.fillRect(0, 0, this.size, this.size);
        
        // Grid lines
        this.ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 20;
        for (let x = 0; x <= this.size; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.size);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.size; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.size, y);
            this.ctx.stroke();
        }
        
        // Center cross
        const center = this.size / 2;
        this.ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(center, 0);
        this.ctx.lineTo(center, this.size);
        this.ctx.moveTo(0, center);
        this.ctx.lineTo(this.size, center);
        this.ctx.stroke();
    }
    
    drawCollectibles(playerPos, centerX, centerY) {
        this.gameManager.currentLevel.collectibles.forEach(collectible => {
            if (!collectible.collected) {
                const dx = collectible.mesh.position.x - playerPos.x;
                const dz = collectible.mesh.position.z - playerPos.z;
                
                // Convert to screen coordinates
                const screenX = centerX + dx * this.scale;
                const screenY = centerY + dz * this.scale;
                
                // Only draw if within minimap bounds (with some margin)
                const margin = 10;
                if (screenX >= -margin && screenX <= this.size + margin && 
                    screenY >= -margin && screenY <= this.size + margin) {
                    
                    // Draw glow effect
                    this.ctx.shadowColor = '#FFD700';
                    this.ctx.shadowBlur = 10;
                    
                    // Draw collectible
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.beginPath();
                    this.ctx.arc(screenX, screenY, 5, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Draw pulse animation
                    const pulse = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
                    this.ctx.fillStyle = `rgba(255, 215, 0, ${0.3 * pulse})`;
                    this.ctx.beginPath();
                    this.ctx.arc(screenX, screenY, 8 * pulse, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    this.ctx.shadowBlur = 0;
                }
            }
        });
    }
    
    drawPlayer(centerX, centerY, rotationY) {
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(rotationY);
        
        // Draw player direction triangle
        this.ctx.fillStyle = '#00ff88';
        this.ctx.shadowColor = '#00ff88';
        this.ctx.shadowBlur = 15;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, -8);
        this.ctx.lineTo(5, 8);
        this.ctx.lineTo(-5, 8);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw player center dot
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
        this.ctx.shadowBlur = 0;
    }
    
    drawBorder() {
        // Inner border
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(1, 1, this.size - 2, this.size - 2);
        
        // Outer glow
        this.ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(0, 0, this.size, this.size);
        
        // Corner accents
        const cornerSize = 10;
        this.ctx.fillStyle = '#00ff88';
        
        // Top-left
        this.ctx.fillRect(0, 0, cornerSize, 2);
        this.ctx.fillRect(0, 0, 2, cornerSize);
        
        // Top-right
        this.ctx.fillRect(this.size - cornerSize, 0, cornerSize, 2);
        this.ctx.fillRect(this.size - 2, 0, 2, cornerSize);
        
        // Bottom-left
        this.ctx.fillRect(0, this.size - 2, cornerSize, 2);
        this.ctx.fillRect(0, this.size - cornerSize, 2, cornerSize);
        
        // Bottom-right
        this.ctx.fillRect(this.size - cornerSize, this.size - 2, cornerSize, 2);
        this.ctx.fillRect(this.size - 2, this.size - cornerSize, 2, cornerSize);
    }
    
    updateCompass(rotationY) {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const angle = (rotationY * 180 / Math.PI) % 360;
        const index = Math.round((angle + 360) % 360 / 45) % 8;
        
        this.compass.textContent = directions[index];
        
        // Update compass color based on direction
        const hue = (angle + 360) % 360;
        this.compass.style.color = `hsl(${hue}, 100%, 60%)`;
    }
    
    toggleZoom() {
        this.scale = this.scale === 0.08 ? 0.04 : 0.08;
        const zoomLevel = this.scale === 0.08 ? 'Normal' : 'Zoomed Out';
        
        // Show zoom notification
        this.showNotification(`Mini-map: ${zoomLevel}`);
    }
    
    showNotification(text) {
        const notification = document.createElement('div');
        notification.textContent = text;
        notification.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: #00ff88;
            padding: 5px 10px;
            border-radius: 3px;
            font-family: 'Orbitron', monospace;
            font-size: 10px;
            z-index: 1001;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        
        this.container.appendChild(notification);
        
        setTimeout(() => notification.style.opacity = '1', 10);
        setTimeout(() => notification.style.opacity = '0', 1000);
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 1300);
    }
    
    remove() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}