import * as THREE from 'three';

export class AudioManager {
    constructor() {
        this.sounds = {};
        this.muted = false;
        this.volume = 0.7;
        this.audioContext = null;
        this.audioBuffers = {};
        
        this.setupAudioContext();
        this.loadSounds();
    }
    
    setupAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context created successfully');
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.audioContext = null;
        }
    }
    
    async loadSounds() {
        // Base URL for sounds
        const basePath = '/sounds/';
        
        // Sound files configuration
        const soundFiles = {
            collect: 'collect.mp3',
            ambient: 'ambient.mp3',
            complete: 'complete.mp3',
            footsteps: 'footsteps.mp3',
            rain: 'rain.mp3',
            thunder: 'thunder.mp3',
            wind: 'wind.mp3',
            click: 'click.mp3'
        };
        
        try {
            // Try to load actual audio files
            for (const [name, filename] of Object.entries(soundFiles)) {
                try {
                    const response = await fetch(basePath + filename);
                    if (response.ok) {
                        const arrayBuffer = await response.arrayBuffer();
                        if (this.audioContext) {
                            this.audioBuffers[name] = await this.audioContext.decodeAudioData(arrayBuffer);
                            console.log(`Loaded sound: ${filename}`);
                        }
                    }
                } catch (error) {
                    console.warn(`Could not load ${filename}: ${error.message}`);
                    // Fallback to generated sound
                    this.createFallbackSound(name);
                }
            }
        } catch (error) {
            console.warn('Sound loading failed, using fallback sounds:', error);
            this.createAllFallbackSounds();
        }
        
        console.log('Audio system ready');
    }
    
    createAllFallbackSounds() {
        // Create fallback sounds for all required types
        this.createFallbackSound('collect');
        this.createFallbackSound('ambient');
        this.createFallbackSound('complete');
        this.createFallbackSound('footsteps');
        this.createFallbackSound('rain');
        this.createFallbackSound('thunder');
        this.createFallbackSound('wind');
        this.createFallbackSound('click');
    }
    
    createFallbackSound(name) {
        if (!this.audioContext) {
            this.sounds[name] = { play: () => {} };
            return;
        }
        
        switch(name) {
            case 'collect':
                this.sounds.collect = this.createBeepSound(800, 0.1, 'sine');
                break;
            case 'complete':
                this.sounds.complete = this.createChordSound([523.25, 659.25, 783.99], 1.5);
                break;
            case 'click':
                this.sounds.click = this.createBeepSound(600, 0.05, 'square');
                break;
            case 'footsteps':
                this.sounds.footsteps = this.createFootstepSound();
                break;
            case 'rain':
                this.sounds.rain = this.createRainSound();
                break;
            case 'thunder':
                this.sounds.thunder = this.createThunderSound();
                break;
            case 'wind':
                this.sounds.wind = this.createWindSound();
                break;
            case 'ambient':
                this.sounds.ambient = this.createAmbientSound();
                break;
            default:
                this.sounds[name] = this.createBeepSound(440, 0.1, 'sine');
        }
    }
    
    createBeepSound(frequency, duration, type = 'sine') {
        return {
            play: (volume = 1) => {
                if (this.muted || !this.audioContext) return;
                
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.value = frequency;
                oscillator.type = type;
                
                const now = this.audioContext.currentTime;
                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(this.volume * volume, now + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                
                oscillator.start(now);
                oscillator.stop(now + duration);
            }
        };
    }
    
    createChordSound(frequencies, duration) {
        return {
            play: (volume = 1) => {
                if (this.muted || !this.audioContext) return;
                
                const now = this.audioContext.currentTime;
                
                frequencies.forEach((freq, i) => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.value = freq;
                    oscillator.type = 'triangle';
                    
                    // Stagger start times slightly
                    const startTime = now + i * 0.05;
                    
                    gainNode.gain.setValueAtTime(0, startTime);
                    gainNode.gain.linearRampToValueAtTime(this.volume * volume * 0.3, startTime + 0.1);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
                    
                    oscillator.start(startTime);
                    oscillator.stop(startTime + duration);
                });
            }
        };
    }
    
    createFootstepSound() {
        let interval = null;
        let isPlaying = false;
        
        return {
            start: () => {
                if (this.muted || !this.audioContext || isPlaying) return;
                
                isPlaying = true;
                let stepCount = 0;
                
                interval = setInterval(() => {
                    // Alternate between two slightly different footstep sounds
                    const freq = stepCount % 2 === 0 ? 200 : 180;
                    this.createBeepSound(freq, 0.1, 'sawtooth').play(0.3);
                    stepCount++;
                }, 500);
            },
            stop: () => {
                isPlaying = false;
                if (interval) {
                    clearInterval(interval);
                    interval = null;
                }
            },
            isPlaying: () => isPlaying
        };
    }
    
    createRainSound() {
        let noiseNode = null;
        let filterNode = null;
        let gainNode = null;
        
        return {
            start: (intensity = 0.5) => {
                if (this.muted || !this.audioContext) return;
                
                // Create brown noise for rain
                const bufferSize = this.audioContext.sampleRate * 2;
                const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                const output = buffer.getChannelData(0);
                
                let lastOut = 0;
                for (let i = 0; i < bufferSize; i++) {
                    const white = Math.random() * 2 - 1;
                    output[i] = (lastOut + (0.02 * white)) / 1.02;
                    lastOut = output[i];
                    output[i] *= 3.5;
                }
                
                noiseNode = this.audioContext.createBufferSource();
                noiseNode.buffer = buffer;
                noiseNode.loop = true;
                
                // Filter to make it sound like rain
                filterNode = this.audioContext.createBiquadFilter();
                filterNode.type = 'bandpass';
                filterNode.frequency.value = 1000;
                filterNode.Q.value = 1;
                
                gainNode = this.audioContext.createGain();
                gainNode.gain.value = this.volume * intensity * 0.3;
                
                noiseNode.connect(filterNode);
                filterNode.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                noiseNode.start();
            },
            stop: () => {
                if (noiseNode) {
                    noiseNode.stop();
                    noiseNode = null;
                }
            },
            setIntensity: (intensity) => {
                if (gainNode) {
                    gainNode.gain.value = this.volume * intensity * 0.3;
                }
            }
        };
    }
    
    createThunderSound() {
        return {
            play: (intensity = 1) => {
                if (this.muted || !this.audioContext) return;
                
                const now = this.audioContext.currentTime;
                
                // Create multiple oscillators for thunder rumble
                for (let i = 0; i < 3; i++) {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    // Low frequency rumble
                    oscillator.frequency.value = 60 + i * 20;
                    oscillator.type = 'sawtooth';
                    
                    const startTime = now + i * 0.1;
                    const duration = 2 + Math.random();
                    
                    gainNode.gain.setValueAtTime(0, startTime);
                    gainNode.gain.linearRampToValueAtTime(this.volume * intensity * 0.5, startTime + 0.5);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
                    
                    oscillator.start(startTime);
                    oscillator.stop(startTime + duration);
                }
            }
        };
    }
    
    createWindSound() {
        let noiseNode = null;
        let gainNode = null;
        
        return {
            start: (intensity = 0.5) => {
                if (this.muted || !this.audioContext) return;
                
                // Create white noise
                const bufferSize = this.audioContext.sampleRate;
                const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                const output = buffer.getChannelData(0);
                
                for (let i = 0; i < bufferSize; i++) {
                    output[i] = Math.random() * 2 - 1;
                }
                
                noiseNode = this.audioContext.createBufferSource();
                noiseNode.buffer = buffer;
                noiseNode.loop = true;
                
                // Low-pass filter for wind sound
                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 800;
                
                // Gain with oscillation for wind gusts
                gainNode = this.audioContext.createGain();
                
                noiseNode.connect(filter);
                filter.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                // Animate gain for wind gusts
                const animateGust = () => {
                    if (!gainNode) return;
                    
                    const now = this.audioContext.currentTime;
                    const gustStrength = 0.3 + Math.random() * 0.7;
                    const gustDuration = 2 + Math.random() * 3;
                    
                    gainNode.gain.cancelScheduledValues(now);
                    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
                    gainNode.gain.linearRampToValueAtTime(this.volume * intensity * gustStrength, now + 1);
                    gainNode.gain.exponentialRampToValueAtTime(this.volume * intensity * 0.1, now + gustDuration);
                    
                    setTimeout(animateGust, gustDuration * 1000);
                };
                
                gainNode.gain.value = this.volume * intensity * 0.1;
                noiseNode.start();
                
                setTimeout(animateGust, 1000);
            },
            stop: () => {
                if (noiseNode) {
                    noiseNode.stop();
                    noiseNode = null;
                    gainNode = null;
                }
            }
        };
    }
    
    createAmbientSound() {
        return {
            start: () => {
                // Gentle ambient pad
                console.log('Ambient sound started');
            },
            stop: () => {
                console.log('Ambient sound stopped');
            }
        };
    }
    
    // Public methods
    playCollect() {
        if (this.audioBuffers.collect) {
            this.playBuffer('collect');
        } else if (this.sounds.collect) {
            this.sounds.collect.play();
        }
    }
    
    playComplete() {
        if (this.audioBuffers.complete) {
            this.playBuffer('complete');
        } else if (this.sounds.complete) {
            this.sounds.complete.play();
        }
    }
    
    playButtonClick() {
        if (this.audioBuffers.click) {
            this.playBuffer('click', 0.5);
        } else if (this.sounds.click) {
            this.sounds.click.play(0.5);
        }
    }
    
    playFootsteps(isMoving) {
        if (!this.sounds.footsteps) return;
        
        if (isMoving && !this.sounds.footsteps.isPlaying?.()) {
            this.sounds.footsteps.start();
        } else if (!isMoving && this.sounds.footsteps.isPlaying?.()) {
            this.sounds.footsteps.stop();
        }
    }
    
    playRain(intensity = 0.5) {
        if (this.sounds.rain) {
            this.sounds.rain.start(intensity);
        }
    }
    
    stopRain() {
        if (this.sounds.rain) {
            this.sounds.rain.stop();
        }
    }
    
    playThunder(intensity = 1) {
        if (this.audioBuffers.thunder) {
            this.playBuffer('thunder', intensity);
        } else if (this.sounds.thunder) {
            this.sounds.thunder.play(intensity);
        }
    }
    
    playWind(intensity = 0.5) {
        if (this.sounds.wind) {
            this.sounds.wind.start(intensity);
        }
    }
    
    stopWind() {
        if (this.sounds.wind) {
            this.sounds.wind.stop();
        }
    }
    
    playBuffer(name, volume = 1) {
        if (this.muted || !this.audioContext || !this.audioBuffers[name]) return;
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = this.audioBuffers[name];
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        gainNode.gain.value = this.volume * volume;
        
        source.start();
    }
    
    toggleMute() {
        this.muted = !this.muted;
        
        // Show visual feedback
        const event = new CustomEvent('audiomute', {
            detail: { muted: this.muted }
        });
        window.dispatchEvent(event);
        
        console.log(`Sound ${this.muted ? 'muted' : 'unmuted'}`);
    }
    
    setVolume(volume) {
        this.volume = THREE.MathUtils.clamp(volume, 0, 1);
    }
    
    stopAll() {
        Object.values(this.sounds).forEach(sound => {
            if (sound.stop) sound.stop();
        });
    }
    
    dispose() {
        this.stopAll();
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}