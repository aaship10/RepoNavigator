---
name: architecture-scrollytelling
description: Workflow for building a single-page, React-based scrollytelling animation that transforms a standard file tree into an interactive architectural node graph.
license: MIT
---

# React DOM Scrollytelling & Architecture Navigator

## Boundaries and Scope
This skill is exclusively for a single-viewport scroll experience built with React. Do not suggest or implement WebGL, Canvas, or external video/image sequence generation. Rely strictly on DOM manipulation, React `refs`, and standard CSS hardware-accelerated transforms (`translate`, `scale`, `opacity`). Do not implement complex multi-page routing.

## Structural Overview
1. **The Pinned Wrapper:** A `100vh` sticky container (`position: sticky`, `top: 0`) that acts as the camera viewport.
2. **The Scroll Track:** A tall wrapper (e.g., `300vh` or `400vh`) that creates the physical scrollable space for the user.
3. **The Animation Engine:** A scroll-linked animation hook (e.g., Framer Motion `useScroll` or GSAP) that maps the `0` to `1` scroll progress directly to the architectural components.

## Execution Workflow

**Step 1: Scaffold the Component Structure**
- Create the main layout wrapper ensuring the sticky positioning works without overflow issues.
- Build the initial state: A clean, localized UI representing the collapsed project structure (e.g., standard folders for the React UI, the FastAPI backend, and the ML Engine/GNN models).

**Step 2: Bind the Scroll Context**
- Initialize the scroll tracker. 
- Attach references (`useRef`) to the specific DOM elements (folders, files, connectors) that will be manipulated.

**Step 3: Define the Interpolation Sequence (The Exploded View)**
- **0% - 15% Scroll (Lock & Load):** User begins scrolling. Lock the view.
- **15% - 60% Scroll (The Unfold):** Break apart the file tree. Translate specific nodes outward into a spatial graph arrangement (e.g., moving the Frontend node left, Backend center, and ML Engine right). 
- **60% - 85% Scroll (Data Flow):** Fade in SVG bezier curves connecting the nodes. Animate a glowing CSS or SVG element along these paths to trace the functional execution of the repository.
- **85% - 100% Scroll (Settle):** The components settle into the final Repository Architecture Navigator view. Allow the user to seamlessly scroll past this container into the next section of the landing page.

**Step 4: Optimization Rules**
- Ensure all animated properties trigger GPU acceleration.
- Strictly animate `transform` and `opacity`. Never animate `top`, `left`, `width`, `margin`, or `padding` to prevent frame-dropping and layout thrashing.