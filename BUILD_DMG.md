# Building Tabl Viz for macOS

## Prerequisites

- **macOS Tahoe 26** (or later)
- **Node.js 18+** — install via [nodejs.org](https://nodejs.org) or `brew install node`
- **Xcode Command Line Tools** — run `xcode-select --install`

## Quick Start (Development Mode)

```bash
# 1. Install dependencies
cd tabl-viz
npm install

# 2. Run in development mode (opens Electron with hot-reload)
npm start
```

This launches the React dev server and Electron app together. Changes to source files will hot-reload.

## Build the DMG Installer

```bash
# 1. Install dependencies (if not done already)
npm install

# 2. Build the production React app and package as DMG
npm run build:dmg
```

The DMG file will be created in `dist/` directory:
- `dist/Tabl Viz-1.0.0-universal.dmg`

## Install the App

1. Open the `.dmg` file
2. Drag **Tabl Viz** to the **Applications** folder
3. Open **Tabl Viz** from Applications
4. If macOS warns about an unidentified developer, go to **System Settings > Privacy & Security** and click "Open Anyway"

## Using the App

1. **Open Data Files**: Click the "+" button in the sidebar or use **Cmd+O**. Supports CSV, Excel (.xlsx), and JSON files.
2. **Drag & Drop**: Drop data files directly into the app window.
3. **Configure Chart**:
   - Choose a chart type from the sidebar
   - Drag fields from the right panel to encoding shelves (X Axis, Y Axis, Color, etc.)
   - Or click fields to auto-assign them
4. **Chart Types**: Bar, Line, Area, Scatter, Pie, Donut, Heatmap, Histogram, Treemap, Radar, and more
5. **Filters**: Toggle filters from the sidebar to filter your data
6. **Data Table**: Toggle the data table to see raw data
7. **Export**: Use **Cmd+Shift+E** to export the chart as PNG

## GitHub Setup

```bash
# Initialize git repo
cd tabl-viz
git init
git add .
git commit -m "Initial commit: Tabl Viz data visualization app"

# Add your GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/tabl-viz.git
git push -u origin main
```

## Project Structure

```
tabl-viz/
├── electron/           # Electron main process
│   ├── main.js         # App window, menus, IPC handlers
│   └── preload.js      # Secure bridge between Electron and React
├── public/             # Static assets
│   └── index.html      # HTML template
├── src/                # React application
│   ├── components/     # UI components
│   │   ├── ChartCanvas.js   # Main chart rendering (Recharts)
│   │   ├── DataTable.js     # Data table viewer
│   │   ├── FieldPanel.js    # Field mapping panel (drag & drop)
│   │   ├── FilterPanel.js   # Data filters
│   │   ├── Sidebar.js       # Chart type, palette, options
│   │   └── TitleBar.js      # macOS-style title bar
│   ├── context/        # React context for state management
│   │   └── DataContext.js   # Global data state & operations
│   ├── utils/          # Utility functions
│   │   ├── chartColors.js   # Color palettes
│   │   ├── dataParser.js    # CSV, Excel, JSON parsing
│   │   └── formatters.js    # Number/text formatters
│   ├── styles/
│   │   └── globals.css      # Global styles & theme
│   ├── App.js          # Main app layout
│   └── index.js        # Entry point
├── package.json        # Dependencies & build config
└── BUILD_DMG.md        # This file
```
