// src/app/components/ProteinViewer.jsx
import React, { useEffect, useRef, useState } from "react";
import { Settings2 } from "lucide-react";

const ProteinViewer = ({ pdbData }) => {
  const [isClient, setIsClient] = useState(false);
  const [viewStyle, setViewStyle] = useState('cartoon');
  const viewerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const updateStyle = (style) => {
    if (!viewerRef.current) return;

    viewerRef.current.clear();
    viewerRef.current.addModel(pdbData, "pdb");

    switch (style) {
      case 'cartoon':
        viewerRef.current.setStyle({}, { cartoon: { color: "spectrum" } });
        break;
      case 'stick':
        viewerRef.current.setStyle({}, { stick: {} });
        break;
      case 'sphere':
        viewerRef.current.setStyle({}, { sphere: {} });
        break;
      default:
        viewerRef.current.setStyle({}, { cartoon: { color: "spectrum" } });
    }

    viewerRef.current.zoomTo();
    viewerRef.current.render();
  };

  useEffect(() => {
    if (isClient && pdbData) {
      // Ensure container is available
      if (!containerRef.current) return;

      import("3dmol").then(($3Dmol) => {
        // Clear existing viewer if any
        if (viewerRef.current) {
          viewerRef.current.clear();
        }

        // Initialize new viewer
        viewerRef.current = new $3Dmol.GLViewer(containerRef.current, {
          backgroundColor: "black",
          antialias: true,
          id: "protein-viewer"
        });

        // Add model and set initial style
        viewerRef.current.addModel(pdbData, "pdb");
        viewerRef.current.setStyle({}, { cartoon: { color: "spectrum" } });
        viewerRef.current.zoomTo();
        viewerRef.current.render();

        // Add event listeners for rotation
        const viewer = viewerRef.current;
        let isRotating = false;
        const rotationSpeed = 0.5;

        viewer.rotate(rotationSpeed, rotationSpeed);
        
        containerRef.current.addEventListener('mousedown', () => {
          isRotating = false;
          viewer.stopAnimate();
        });

        containerRef.current.addEventListener('mouseup', () => {
          if (!isRotating) {
            isRotating = true;
            viewer.animate({ rotate: rotationSpeed });
          }
        });
      });
    }

    return () => {
      if (viewerRef.current) {
        viewerRef.current.clear();
      }
    };
  }, [isClient, pdbData]);

  return (
    <div className="relative w-full h-full">
      {/* Viewer Container */}
      <div 
        ref={containerRef}
        className="w-full h-full"
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      >
        {!isClient && <p className="text-center p-4">Loading 3D viewer...</p>}
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 bg-gray-800 rounded-lg shadow-lg p-2">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              setViewStyle('cartoon');
              updateStyle('cartoon');
            }}
            className={`px-3 py-1 rounded ${
              viewStyle === 'cartoon' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Cartoon
          </button>
          <button
            onClick={() => {
              setViewStyle('stick');
              updateStyle('stick');
            }}
            className={`px-3 py-1 rounded ${
              viewStyle === 'stick' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Stick
          </button>
          <button
            onClick={() => {
              setViewStyle('sphere');
              updateStyle('sphere');
            }}
            className={`px-3 py-1 rounded ${
              viewStyle === 'sphere' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Sphere
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProteinViewer;