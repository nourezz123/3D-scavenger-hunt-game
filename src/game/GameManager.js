import { Player } from './Player.js';
import { Level1_Forest } from '../levels/Level1_Forest.js';
import { Level2_Village } from '../levels/Level2_Village.js';
import { Level3_Desert } from '../levels/Level3_Desert.js';
import { Level4_Mountain } from '../levels/Level4_Mountain.js';

export class GameManager {
    constructor(scene, camera, ui, audioManager) {
        this.scene = scene;
        this.camera = camera;
        this.ui = ui;
        this.audioManager = audioManager;
        this.player = new Player(camera);
        this.scene.add(this.player.object);
        
        this.currentLevel = null;
        this.currentLevelNumber = 1;
        this.score = 0;
        this.gameTime = 0;
        this.timeRemaining = 0;
        this.timerInterval = null;
        this.isGameActive = false;
        this.isPaused = false;
        
        this.levels = [
            Level1_Forest,
            Level2_Village,
            Level3_Desert,
            Level4_Mountain
        ];
        
        this.saveState = {
            currentLevel: 1,
            totalScore: 0
        };
    }
    
    startGame() {
        this.currentLevelNumber = 1;
        this.score = 0;
        this.saveState.totalScore = 0;
        this.loadLevel(1);
    }
    
    continueGame() {
        if (this.saveState.currentLevel > 1) {
            this.currentLevelNumber = this.saveState.currentLevel;
            this.score = this.saveState.totalScore;
            this.loadLevel(this.currentLevelNumber);
        } else {
            this.startGame();
        }
    }
    
    loadLevel(levelNumber) {
        if (this.currentLevel) {
            this.currentLevel.dispose();
        }
        
        const LevelClass = this.levels[levelNumber - 1];
        this.currentLevel = new LevelClass(this.scene, this);
        this.currentLevel.load();
        
        // Pass collision objects to player
        this.player.setCollisionObjects(this.currentLevel.environmentObjects);
        
        this.currentLevelNumber = levelNumber;
        this.gameTime = 0;
        this.timeRemaining = this.currentLevel.timeLimit || 120;
        this.isPaused = false;
        this.player.reset();
        this.player.setActive(true);
        this.isGameActive = true;
        
        this.ui.showHUD();
        this.ui.hideMenu();
        this.ui.hideCompletion();
        this.ui.updateLevel(this.currentLevel.name, this.currentLevel.totalItems);
        this.ui.updateScore(this.score);
        this.ui.updateItems(0, this.currentLevel.totalItems);
        
        this.startTimer();
        
        console.log(`✅ Level ${levelNumber} loaded - Time Limit: ${this.currentLevel.timeLimit || 120}s`);
    }
    
    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.gameTime = 0;
        this.timeRemaining = this.currentLevel.timeLimit || 120;
        
        this.timerInterval = setInterval(() => {
            if (!this.isPaused && this.isGameActive) {
                this.gameTime++;
                this.timeRemaining--;
                
                this.ui.updateTimer(this.timeRemaining);
                
                // Time's up - Game Over
                if (this.timeRemaining <= 0) {
                    this.gameOver('Time\'s Up!');
                }
                
                // Warning at 30 seconds
                if (this.timeRemaining === 30) {
                    this.ui.showNotification('⏰ 30 seconds remaining!', 'warning');
                }
                
                // Warning at 10 seconds
                if (this.timeRemaining === 10) {
                    this.ui.showNotification('⏰ 10 seconds left!', 'error');
                }
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        this.player.setActive(!this.isPaused);
        
        if (this.isPaused) {
            console.log('Game Paused');
            this.ui.showMenu();
            this.ui.hideHUD();
        } else {
            console.log('Game Resumed');
            this.ui.hideMenu();
            this.ui.showHUD();
        }
    }
    
    onItemCollected() {
        const points = 100 * this.currentLevelNumber;
        const timeBonus = Math.floor(this.timeRemaining / 10) * 10; // Bonus for remaining time
        
        this.score += points + timeBonus;
        this.ui.updateScore(this.score);
        this.ui.updateItems(
            this.currentLevel.itemsCollected,
            this.currentLevel.totalItems
        );
        
        if (this.audioManager) {
            this.audioManager.playCollect();
        }
        
        if (timeBonus > 0) {
            this.ui.showNotification(`+${points + timeBonus} (${timeBonus} time bonus!)`, 'success');
        }
        
        const progress = (this.currentLevel.itemsCollected / this.currentLevel.totalItems) * 100;
        this.ui.updateProgress(progress);
        
        if (this.currentLevel.itemsCollected >= this.currentLevel.totalItems) {
            this.levelComplete();
        }
    }
    
    levelComplete() {
        this.isGameActive = false;
        this.player.setActive(false);
        this.stopTimer();
        
        if (this.audioManager) {
            this.audioManager.playComplete();
        }
        
        // Bonus points for completing level
        const completionBonus = this.timeRemaining * 10;
        this.score += completionBonus;
        
        this.saveState.currentLevel = this.currentLevelNumber + 1;
        this.saveState.totalScore = this.score;
        
        this.ui.showCompletion(
            this.currentLevel.timeLimit - this.timeRemaining,
            this.currentLevel.itemsCollected,
            this.currentLevel.totalItems,
            this.score,
            this.currentLevelNumber >= 4
        );
    }
    
    gameOver(reason) {
        this.isGameActive = false;
        this.player.setActive(false);
        this.stopTimer();
        
        console.log(`Game Over: ${reason}`);
        
        // Show game over screen
        this.ui.showNotification(`💀 GAME OVER: ${reason}`, 'error');
        
        setTimeout(() => {
            this.returnToMenu();
        }, 2000);
    }
    
    nextLevel() {
        if (this.currentLevelNumber < 4) {
            this.loadLevel(this.currentLevelNumber + 1);
        }
    }
    
    returnToMenu() {
        this.isGameActive = false;
        this.isPaused = false;
        this.player.setActive(false);
        this.stopTimer();
        
        if (this.currentLevel) {
            this.currentLevel.dispose();
            this.currentLevel = null;
        }
        
        this.ui.hideHUD();
        this.ui.hideCompletion();
        this.ui.showMenu();
    }
    
    update(delta) {
        if (!this.isGameActive || this.isPaused || !this.currentLevel) return;
        
        this.player.update(delta);
        this.currentLevel.update(delta);
        
        // Check collectible collisions
        this.currentLevel.checkCollisions(this.player.getPosition());
        
        // Check boundary violations
        if (this.currentLevel.checkBoundaryViolation && 
            this.currentLevel.checkBoundaryViolation(this.player.getPosition())) {
            this.gameOver('Fell off the edge!');
        }
    }
}