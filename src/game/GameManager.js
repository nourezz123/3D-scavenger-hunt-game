import { Player } from './Player.js';
import { Level1_Forest } from '../levels/Level1_Forest.js';
import { Level2_Village } from '../levels/Level2_Village.js';
import { Level3_Ruins } from '../levels/Level3_Ruins.js';
import { Level4_Cave } from '../levels/Level4_Cave.js';

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
        this.timerInterval = null;
        this.isGameActive = false;
        this.isPaused = false;
        
        this.levels = [
            Level1_Forest,
            Level2_Village,
            Level3_Ruins,
            Level4_Cave
        ];
        
        // In-memory save state
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
        // Clear current level
        if (this.currentLevel) {
            this.currentLevel.dispose();
        }
        
        // Create new level
        const LevelClass = this.levels[levelNumber - 1];
        this.currentLevel = new LevelClass(this.scene, this);
        this.currentLevel.load();
        
        this.currentLevelNumber = levelNumber;
        this.gameTime = 0;
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
    }
    
    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.gameTime = 0;
        this.timerInterval = setInterval(() => {
            if (!this.isPaused) {
                this.gameTime++;
                this.ui.updateTimer(this.gameTime);
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
        this.score += points;
        this.ui.updateScore(this.score);
        this.ui.updateItems(
            this.currentLevel.itemsCollected,
            this.currentLevel.totalItems
        );
        
        // Play collect sound
        if (this.audioManager) {
            this.audioManager.playCollect();
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
        
        // Play completion sound
        if (this.audioManager) {
            this.audioManager.playComplete();
        }
        
        this.saveState.currentLevel = this.currentLevelNumber + 1;
        this.saveState.totalScore = this.score;
        
        this.ui.showCompletion(
            this.gameTime,
            this.currentLevel.itemsCollected,
            this.currentLevel.totalItems,
            this.score,
            this.currentLevelNumber >= 4
        );
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
    }
}