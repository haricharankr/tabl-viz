import React, { useEffect, useCallback, useRef } from 'react';
import { DataProvider, useData } from './context/DataContext';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import FieldPanel from './components/FieldPanel';
import ChartCanvas from './components/ChartCanvas';
import FilterPanel from './components/FilterPanel';
import DataTable from './components/DataTable';

function AppContent() {
  const { dispatch, loadFile, loadFileFromDrop, activeDataset } = useData();
  const dropRef = useRef(null);

  // Handle Electron menu events
  useEffect(() => {
    if (!window.electronAPI) return;

    window.electronAPI.onFileOpened(async (paths) => {
      for (const path of paths) {
        try {
          await loadFile(path);
        } catch (err) {
          console.error('Failed to load file:', err);
        }
      }
    });

    window.electronAPI.onExportChart(() => {
      // Export chart as PNG
      const canvas = document.getElementById('chart-canvas');
      if (canvas) {
        import('html2canvas').then(({ default: html2canvas }) => {
          html2canvas(canvas, {
            backgroundColor: '#0f172a',
            scale: 2,
          }).then(async (canvasEl) => {
            const dataUrl = canvasEl.toDataURL('image/png');
            if (window.electronAPI) {
              const result = await window.electronAPI.saveFileDialog('chart.png');
              if (!result.canceled && result.filePath) {
                const base64 = dataUrl.split(',')[1];
                const buffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
                await window.electronAPI.writeFile(result.filePath, Buffer.from(buffer));
              }
            }
          });
        });
      }
    });

    window.electronAPI.onSaveWorkspace(async () => {
      // TODO: Implement workspace saving
      console.log('Save workspace');
    });

    window.electronAPI.onLoadWorkspace(async () => {
      // TODO: Implement workspace loading
      console.log('Load workspace');
    });

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('file-opened');
        window.electronAPI.removeAllListeners('export-chart');
        window.electronAPI.removeAllListeners('save-workspace');
        window.electronAPI.removeAllListeners('load-workspace');
      }
    };
  }, [loadFile, dispatch]);

  // Global drag-and-drop for files
  const handleGlobalDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleGlobalDrop = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (['csv', 'tsv', 'xlsx', 'xls', 'json'].includes(ext)) {
          try {
            await loadFileFromDrop(file);
          } catch (err) {
            console.error('Failed to load dropped file:', err);
          }
        }
      }
    },
    [loadFileFromDrop]
  );

  return (
    <div
      ref={dropRef}
      className="app-container"
      onDragOver={handleGlobalDragOver}
      onDrop={handleGlobalDrop}
    >
      <TitleBar />
      <div className="app-body">
        <Sidebar />
        <div className="main-content">
          <FilterPanel />
          <div className="chart-area">
            <ChartCanvas />
          </div>
          <DataTable />
        </div>
        <FieldPanel />
      </div>

      <style>{`
        .app-container {
          display: flex;
          flex-direction: column;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: var(--bg-primary);
        }

        .app-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .chart-area {
          flex: 1;
          overflow: hidden;
          position: relative;
        }
      `}</style>
    </div>
  );
}

function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

export default App;
