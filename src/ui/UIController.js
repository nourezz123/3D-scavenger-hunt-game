import { MiniMap } from './MiniMap.js';

export class UIController {
    constructor(gameManager = null, player = null) {
        // DOM Elements
        this.hud = document.getElementById('hud');
        this.menu = document.getElementById('menu');
        this.completion = document.getElementById('completion');
        
        // HUD Elements
        this.levelName = document.getElementById('level-name');
        this.itemsCollected = document.getElementById('items-collected');
        this.totalItems = document.getElementById('total-items');
        this.timer = document.getElementById('timer');
        this.score = document.getElementById('score');
        this.progressFill = document.getElementById('progress-fill');
        
        // Completion Screen Elements
        this.compTime = document.getElementById('comp-time');
        this.compItems = document.getElementById('comp-items');
        this.compScore = document.getElementById('comp-score');
        this.btnNext = document.getElementById('btn-next');
        
        // Game references
        this.gameManager = gameManager;
        this.player = player;
        
        // Mini-map
        this.miniMap = null;
        
        // Debug stats
        this.debugStats = {
            fps: 0,
            triangles: 0,
            drawCalls: 0,
            memory: 0
        };
        
        this.debugPanel = null;
        this.showDebug = false;
        
        // Controls display
        this.controlsDisplay = null;
        
        this.setupDebugPanel();
        this.setupMenuAnimations();
        this.createControlsDisplay();
    }
    
    // Initialize with game references (called after game starts)
    initialize(gameManager, player) {
        this.gameManager = gameManager;
        this.player = player;
        
        // Create mini-map
        if (!this.miniMap) {
            this.miniMap = new MiniMap(gameManager, player);
        }
        
        console.log('UI Controller initialized');
    }
    
    createControlsDisplay() {
        // Create controls display container
        this.controlsDisplay = document.createElement('div');
        this.controlsDisplay.id = 'controls-display';
        this.controlsDisplay.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font-family: 'Rajdhani', sans-serif;
            font-size: 14px;
            text-align: center;
            z-index: 100;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(0, 255, 136, 0.3);
            display: none;
        `;
        
        this.controlsDisplay.innerHTML = `
            <div style="margin-bottom: 5px;">
                <span style="color: #00ff88; font-weight: bold;">W</span> | 
                <span style="color: #00ff88; font-weight: bold;">A</span> | 
                <span style="color: #00ff88; font-weight: bold;">S</span> | 
                <span style="color: #00ff88; font-weight: bold;">D</span> : Move
            </div>
            <div style="margin-bottom: 5px;">
                <span style="color: #00ff88; font-weight: bold;">Mouse</span> : Look | 
                <span style="color: #00ff88; font-weight: bold;">Space</span> : Jump
            </div>
            <div style="margin-bottom: 5px;">
                <span style="color: #00ff88; font-weight: bold;">Shift</span> : Sprint | 
                <span style="color: #00ff88; font-weight: bold;">ESC</span> : Pause/Menu
            </div>
            <div>
                <span style="color: #00ff88; font-weight: bold;">F</span> : Wireframe | 
                <span style="color: #00ff88; font-weight: bold;">M</span> : Mute | 
                <span style="color: #00ff88; font-weight: bold;">H</span> : Debug
            </div>
        `;
        
        document.body.appendChild(this.controlsDisplay);
    }
    
    setupMenuAnimations() {
        // Add subtle animation to menu buttons
        const buttons = document.querySelectorAll('.menu-button');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 8px 25px rgba(0, 255, 136, 0.4)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = '0 0 30px rgba(0, 255, 136, 0.3)';
            });
            
            button.addEventListener('mousedown', () => {
                button.style.transform = 'translateY(1px)';
            });
            
            button.addEventListener('mouseup', () => {
                button.style.transform = 'translateY(-2px)';
            });
        });
    }
    
    setupDebugPanel() {
        this.debugPanel = document.createElement('div');
        this.debugPanel.style.cssText = `
            position: fixed;
            top: 60px;
            left: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: #00ff88;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 10px;
            border-radius: 5px;
            border: 1px solid #00ff88;
            z-index: 10000;
            display: none;
            backdrop-filter: blur(5px);
        `;
        
        this.debugPanel.innerHTML = `
            <div>FPS: <span id="debug-fps">0</span></div>
            <div>Triangles: <span id="debug-triangles">0</span></div>
            <div>Draw Calls: <span id="debug-drawcalls">0</span></div>
            <div>Memory: <span id="debug-memory">0 MB</span></div>
            <div>Position: <span id="debug-position">0, 0, 0</span></div>
            <div>Rotation: <span id="debug-rotation">0, 0, 0</span></div>
        `;
        
        document.body.appendChild(this.debugPanel);
    }
    
    toggleDebugStats() {
        this.showDebug = !this.showDebug;
        this.debugPanel.style.display = this.showDebug ? 'block' : 'none';
    }
    
    updateDebugStats(renderer, player) {
        if (!this.showDebug || !this.debugPanel) return;
        
        // Update FPS (approximate)
        this.debugStats.fps = Math.round(1000 / (performance.now() - (this.lastFrameTime || performance.now())));
        this.lastFrameTime = performance.now();
        
        // Get renderer info
        const info = renderer.info;
        this.debugStats.triangles = info.render.triangles;
        this.debugStats.drawCalls = info.render.calls;
        this.debugStats.memory = Math.round(info.memory.geometries / 1024);
        
        // Update player info
        if (player) {
            const pos = player.getPosition();
            const rot = player.getRotation ? player.getRotation() : { x: 0, y: 0, z: 0 };
            
            document.getElementById('debug-fps').textContent = this.debugStats.fps;
            document.getElementById('debug-triangles').textContent = this.debugStats.triangles.toLocaleString();
            document.getElementById('debug-drawcalls').textContent = this.debugStats.drawCalls;
            document.getElementById('debug-memory').textContent = `${this.debugStats.memory} MB`;
            document.getElementById('debug-position').textContent = 
                `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
            document.getElementById('debug-rotation').textContent = 
                `${rot.x.toFixed(2)}, ${rot.y.toFixed(2)}, ${rot.z.toFixed(2)}`;
        }
    }
    
    showHUD() {
        this.hud.classList.remove('hidden');
        if (this.miniMap) {
            this.miniMap.container.style.display = 'block';
        }
        
        // Show controls display
        if (this.controlsDisplay) {
            this.controlsDisplay.style.display = 'block';
            this.controlsDisplay.style.opacity = '0';
            this.controlsDisplay.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                this.controlsDisplay.style.opacity = '1';
            }, 10);
        }
        
        // Add fade-in animation
        this.hud.style.opacity = '0';
        this.hud.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            this.hud.style.opacity = '1';
        }, 10);
    }
    
    hideHUD() {
        this.hud.classList.add('hidden');
        if (this.miniMap) {
            this.miniMap.container.style.display = 'none';
        }
        
        // Hide controls display
        if (this.controlsDisplay) {
            this.controlsDisplay.style.display = 'none';
        }
    }
    
    showMenu() {
        this.menu.style.display = 'flex';
        
        // Animation
        this.menu.style.opacity = '0';
        this.menu.style.transform = 'scale(0.9)';
        this.menu.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        setTimeout(() => {
            this.menu.style.opacity = '1';
            this.menu.style.transform = 'scale(1)';
        }, 10);
    }
    
    hideMenu() {
        this.menu.style.display = 'none';
    }
    
    showCompletion(time, items, totalItems, score, isFinalLevel) {
        const minutes = Math.floor(time / 60).toString().padStart(2, '0');
        const seconds = (time % 60).toString().padStart(2, '0');
        
        this.compTime.textContent = `${minutes}:${seconds}`;
        this.compItems.textContent = `${items}/${totalItems}`;
        this.compScore.textContent = score.toLocaleString();
        
        const title = document.querySelector('.completion-title');
        if (isFinalLevel) {
            title.textContent = '🏆 GAME COMPLETE!';
            title.style.background = 'linear-gradient(135deg, #FFD700, #FFA500)';
            title.style.webkitBackgroundClip = 'text';
            this.btnNext.style.display = 'none';
        } else {
            title.textContent = '🎉 LEVEL COMPLETE!';
            title.style.background = 'linear-gradient(135deg, #00ff88, #0099ff)';
            title.style.webkitBackgroundClip = 'text';
            this.btnNext.style.display = 'block';
        }
        
        // Add celebration animation
        this.completion.style.display = 'flex';
        this.completion.style.opacity = '0';
        this.completion.style.transform = 'translateY(20px)';
        this.completion.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        
        setTimeout(() => {
            this.completion.style.opacity = '1';
            this.completion.style.transform = 'translateY(0)';
        }, 10);
        
        // Add particle effects (optional)
        this.createCelebrationParticles();
    }
    
    createCelebrationParticles() {
        // Simple CSS particle effect
        const particleCount = 50;
        const completionContent = document.querySelector('.completion-content');
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 10 + 5}px;
                height: ${Math.random() * 10 + 5}px;
                background: ${Math.random() > 0.5 ? '#00ff88' : '#0099ff'};
                border-radius: 50%;
                pointer-events: none;
                z-index: -1;
            `;
            
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 100 + 50;
            const duration = Math.random() * 1 + 1;
            
            particle.style.left = `50%`;
            particle.style.top = `50%`;
            particle.style.transform = `translate(-50%, -50%)`;
            
            completionContent.appendChild(particle);
            
            // Animate
            setTimeout(() => {
                particle.style.transition = `all ${duration}s ease-out`;
                particle.style.transform = `translate(
                    ${Math.cos(angle) * distance}px, 
                    ${Math.sin(angle) * distance}px
                )`;
                particle.style.opacity = '0';
                
                // Remove after animation
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, duration * 1000);
            }, 10);
        }
    }
    
    hideCompletion() {
        this.completion.style.display = 'none';
    }
    
    updateLevel(name, total) {
        this.levelName.textContent = name;
        this.totalItems.textContent = total;
        
        // Add highlight animation
        this.levelName.style.transform = 'scale(1.1)';
        this.levelName.style.transition = 'transform 0.3s ease';
        
        setTimeout(() => {
            this.levelName.style.transform = 'scale(1)';
        }, 300);
    }
    
    updateItems(collected, total) {
        this.itemsCollected.textContent = collected;
        this.totalItems.textContent = total;
        
        // Pulse animation when collecting items
        if (collected > parseInt(this.itemsCollected.textContent || 0)) {
            this.itemsCollected.style.transform = 'scale(1.3)';
            this.itemsCollected.style.color = '#00ff88';
            this.itemsCollected.style.transition = 'transform 0.2s ease, color 0.2s ease';
            
            setTimeout(() => {
                this.itemsCollected.style.transform = 'scale(1)';
                this.itemsCollected.style.color = 'white';
            }, 200);
        }
    }
    
    updateTimer(seconds) {
        const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        this.timer.textContent = `${minutes}:${secs}`;
        
        // Color coding for time
        if (seconds <= 10) {
            this.timer.style.color = '#ff4444';
            this.timer.style.animation = 'pulse 0.5s infinite';
        } else if (seconds <= 30) {
            this.timer.style.color = '#ffaa00';
            this.timer.style.animation = '';
        } else {
            this.timer.style.color = '#0099ff';
            this.timer.style.animation = '';
        }
    }
    
    updateScore(score) {
        const oldScore = parseInt(this.score.textContent || 0);
        this.score.textContent = score.toLocaleString();
        
        // Animate score increase
        if (score > oldScore) {
            this.score.style.transform = 'scale(1.2)';
            this.score.style.color = '#00ff88';
            
            setTimeout(() => {
                this.score.style.transform = 'scale(1)';
                setTimeout(() => {
                    this.score.style.color = '#0099ff';
                }, 100);
            }, 150);
        }
    }
    
    updateProgress(percentage) {
        this.progressFill.style.width = `${Math.min(100, percentage)}%`;
        
        // Color coding for progress
        if (percentage >= 100) {
            this.progressFill.style.background = 'linear-gradient(90deg, #00ff88, #00cc66)';
        } else if (percentage >= 50) {
            this.progressFill.style.background = 'linear-gradient(90deg, #0099ff, #00ff88)';
        } else {
            this.progressFill.style.background = 'linear-gradient(90deg, #0099ff, #0066cc)';
        }
    }
    
    update() {
        // Update mini-map
        if (this.miniMap && this.gameManager && this.gameManager.isGameActive) {
            this.miniMap.update();
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const colors = {
            info: '#0099ff',
            success: '#00ff88',
            warning: '#ffaa00',
            error: '#ff4444'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(10, 14, 39, 0.95);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            border-left: 4px solid ${colors[type]};
            font-family: 'Rajdhani', sans-serif;
            font-weight: 600;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            backdrop-filter: blur(10px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Clean up
    dispose() {
        if (this.miniMap) {
            this.miniMap.remove();
        }
        
        if (this.debugPanel && this.debugPanel.parentNode) {
            this.debugPanel.parentNode.removeChild(this.debugPanel);
        }
        
        if (this.controlsDisplay && this.controlsDisplay.parentNode) {
            this.controlsDisplay.parentNode.removeChild(this.controlsDisplay);
        }
    }
}