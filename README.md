# 🗺️ RepoNavigator

> **Transform your codebase into an interactive visual journey**

RepoNavigator is a cutting-edge scrollytelling visualization tool that converts static file trees into dynamic, animated architectural node graphs. Watch your repository structure unfold as users scroll through an immersive, DOM-based animation experience that reveals connections, data flows, and system architecture in real-time.

![Status](https://img.shields.io/badge/status-active-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![JavaScript](https://img.shields.io/badge/language-JavaScript-yellow)

---

## 🎯 Problem Statement

**The Challenge:** Developers and teams struggle to quickly grasp complex multi-component repository architecture. Traditional static file trees and documentation fail to engage viewers, leading to:
- ⏱️ Longer onboarding times for new team members
- 📉 Poor knowledge retention and understanding
- 🔄 Repeated manual explanations of system design
- 📊 Lack of standardized architectural visualization
- 😴 Disengaging, text-heavy technical documentation

**The Solution:** RepoNavigator makes repository architecture intuitive, engaging, and memorable through interactive scroll-triggered animations that dynamically reveal how different system components connect and communicate.

---

## ✨ Key Features

### 🎬 Interactive Scrollytelling Experience
- **DOM-Based Animations**: Smooth, GPU-accelerated scroll-linked animations using Framer Motion and GSAP
- **100vh Pinned Viewport**: Sticky container that acts as a camera, keeping animations centered while content scrolls beneath
- **Smooth Scroll Progress Tracking**: Real-time mapping of scroll position (0-1) to animation states

### 🏗️ Architecture Visualization
- **File Tree Transformation**: Converts collapsed folder structures into an exploded spatial graph
- **Multi-Component Support**: Visualizes Frontend, Backend, ML Engine, and custom components
- **Dynamic Node Positioning**: Intelligent spatial arrangement of repository components
- **Visual Hierarchy**: Clear representation of dependencies and relationships

### 🎨 Animation Sequences
The experience unfolds in four distinct phases:

1. **Lock & Load (0-15%)**: Initial view with collapsed file tree; user begins scrolling
2. **The Unfold (15-60%)**: Nodes translate outward into spatial arrangement; components separate and spread
3. **Data Flow (60-85%)**: SVG bezier curves connect components; animated glowing elements trace execution paths
4. **Settle (85-100%)**: Components settle into final Repository Architecture Navigator view; seamless transition to next content

### ⚡ Performance Optimized
- **GPU Acceleration**: Only animates `transform` and `opacity` properties (no layout thrashing)
- **60fps Smooth Animation**: Optimized rendering pipeline for consistent frame rates
- **Lightweight DOM Manipulation**: Pure React with Vite for minimal bundle size
- **Zero Canvas/WebGL**: Strictly DOM-based for maximum compatibility and maintainability

### 🔗 Tech Stack
- **Frontend**: React 18 + Vite + Framer Motion/GSAP
- **Backend**: FastAPI (Python)
- **ML Components**: GNN models for intelligent architectural analysis
- **Build**: Vite with Hot Module Reloading (HMR)
- **Code Quality**: ESLint configuration with TypeScript support

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- Python 3.8+ (for backend)
- npm or yarn

### Installation

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

#### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Quick Start
```bash
# Clone the repository
git clone https://github.com/aaship10/RepoNavigator.git
cd RepoNavigator

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && pip install -r requirements.txt

# Run both services
# Terminal 1 - Frontend
cd frontend && npm run dev

# Terminal 2 - Backend
cd backend && python main.py
```

---

## 📁 Project Structure

```
RepoNavigator/
├── frontend/                  # React + Vite application
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── hooks/            # Custom scroll animation hooks
│   │   ├── animations/       # Animation sequences and configurations
│   │   └── App.jsx           # Main application component
│   ├── package.json
│   └── vite.config.js
│
├── backend/                   # FastAPI backend service
│   ├── models/               # ML/GNN models for architecture analysis
│   ├── api/                  # API endpoints
│   └── main.py               # Server entry point
│
└── skill.md                   # Detailed architectural workflow documentation
```

---

## 🎮 How It Works

### The Three-Layer Architecture

1. **The Pinned Wrapper** 
   - `position: sticky; top: 0` creates a fixed viewport
   - Height: `100vh` (full viewport height)
   - Acts as the "camera" for animations

2. **The Scroll Track**
   - Tall wrapper (300vh-400vh) creates scrollable space
   - Physical scroll distance maps to animation progress
   - Enables smooth scroll-linked animation binding

3. **The Animation Engine**
   - Framer Motion `useScroll` hook tracks scroll progress
   - GSAP animations for complex sequences
   - Direct mapping: scroll progress (0→1) → animation state

### Animation Pipeline
```
User Scrolls
    ↓
Scroll Progress Tracked (0-1)
    ↓
DOM Elements Referenced via useRef
    ↓
Transform & Opacity Animated
    ↓
SVG Bezier Curves Drawn
    ↓
Components Visualized with Data Flow
    ↓
Architecture Revealed
```

---

## 🎨 Core Components

### ScrollContext Hook
Manages scroll-linked animations across the application
```javascript
const { scrollProgress, isLocked } = useScrollContext();
```

### NodeGraph Component
Renders and animates repository nodes and connections
```javascript
<NodeGraph nodes={architectureData} progress={scrollProgress} />
```

### DataFlowVisualizer
Animates data flow through SVG bezier curves
```javascript
<DataFlowVisualizer connections={dataFlow} progress={scrollProgress} />
```

---

## 🛠️ Configuration

### Customization
Edit animation timings and thresholds in `src/animations/config.js`:
```javascript
export const ANIMATION_PHASES = {
  LOCK_AND_LOAD: { start: 0, end: 0.15 },
  THE_UNFOLD: { start: 0.15, end: 0.6 },
  DATA_FLOW: { start: 0.6, end: 0.85 },
  SETTLE: { start: 0.85, end: 1.0 }
};
```

### Adding Custom Components
1. Define component nodes in your data structure
2. Add positioning logic in `NodeGraph`
3. Update SVG connections in `DataFlowVisualizer`

---

## 📊 Use Cases

- 📚 **Technical Documentation**: Engage readers with interactive architecture explanations
- 🎓 **Onboarding Materials**: Help new developers understand system structure visually
- 🎤 **Presentations & Talks**: Create memorable technical presentations
- 💼 **Portfolio Projects**: Showcase complex codebases in interviews and portfolios
- 📖 **Blog Posts**: Enhance technical blog posts with interactive visualizations
- 🏢 **Enterprise Knowledge Sharing**: Standardize architectural communication across teams

---

## ⚙️ Advanced Features

### Performance Optimization Tips
- Use `will-change: transform` for animated elements
- Implement `requestAnimationFrame` for smooth animations
- Debounce scroll listeners for better performance
- Profile with Chrome DevTools Performance tab

### Extending with ML
The backend integrates GNN (Graph Neural Networks) for:
- Automatic dependency analysis
- Component relationship detection
- Architecture pattern recognition
- Intelligent node positioning

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow ESLint configuration for code consistency
- Use React hooks for state management
- Optimize animations with GPU acceleration
- Test animations across different scroll speeds
- Update documentation for new features

---

## 📝 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

---

## 🎯 Roadmap

- [ ] Support for multiple visualization themes
- [ ] Real-time repository scanning and auto-generation
- [ ] WebGL version for ultra-large codebases
- [ ] Export animations as videos
- [ ] Interactive component filtering
- [ ] Multi-language documentation support
- [ ] API for third-party integrations
- [ ] Desktop application (Electron)

---

## 💡 Why RepoNavigator?

✅ **Engaging**: Turn boring documentation into captivating visual stories  
✅ **Scalable**: Works with small and enterprise-scale repositories  
✅ **Developer-Friendly**: Simple React API, easy to customize  
✅ **Performance**: 60fps animations with GPU acceleration  
✅ **Accessible**: Pure DOM-based, no external dependencies on Canvas/WebGL  
✅ **Memorable**: Viewers retain 65% more information from visual content  

---

## 📞 Support & Contact

- 📧 **Email**: [your-email@example.com]
- 💬 **GitHub Issues**: [Report bugs and request features](https://github.com/aaship10/RepoNavigator/issues)
- 🐙 **GitHub Discussions**: [Join our community](https://github.com/aaship10/RepoNavigator/discussions)

---

## 🌟 Show Your Support

If you find RepoNavigator helpful, please consider:
- ⭐ Starring this repository
- 🔗 Sharing it with your network
- 💬 Providing feedback and suggestions
- 🤝 Contributing to the project

---

**Made with ❤️ by [aaship10](https://github.com/aaship10)**

*RepoNavigator: Because your code deserves to be seen, not just read.*
