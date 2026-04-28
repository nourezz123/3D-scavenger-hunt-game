# 🎮 3D Scavenger Hunt Game

> A browser-based 3D scavenger hunt game built with JavaScript and Three.js, where players explore a 3D environment to find hidden objects within a time limit.

---

## 🕹️ Demo

Open `index.html` in your browser or run locally with a dev server.

---

## 📌 Overview

This is an interactive 3D game that runs entirely in the browser. Players navigate a 3D world, search for hidden items, and complete the hunt as fast as possible. The game is built using **Three.js** for 3D rendering and **Vite** as the development toolchain.

---

## ✨ Features

- 🌍 Full 3D environment rendered in the browser using WebGL
- 🔍 Scavenger hunt gameplay — find hidden objects in the scene
- ⏱️ Timer-based challenge
- 🎮 Keyboard/mouse controls for 3D navigation
- 📦 Fast builds with Vite

---

## 🗂️ Project Structure

```
3D-scavenger-hunt-game/
│
├── public/              ← Static assets (textures, models)
├── src/                 ← Game source code
│   ├── main.js          ← Entry point
│   ├── scene.js         ← 3D scene setup
│   └── ...
├── index.html           ← Main HTML entry
├── package.json
└── Readme.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v16+)
- npm

### Run Locally

```bash
# Clone the repo
git clone https://github.com/nourezz123/3D-scavenger-hunt-game.git
cd 3D-scavenger-hunt-game

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open your browser at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Three.js** | 3D rendering (WebGL) |
| **JavaScript** | Game logic |
| **Vite** | Build tool & dev server |
| **HTML/CSS** | UI overlay |

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| `W A S D` | Move forward/left/backward/right |
| `Mouse` | Look around |
| `Click` | Interact / pick up item |

---

## 📄 License

MIT License
