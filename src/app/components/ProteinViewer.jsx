import React, { useEffect, useRef, useState } from "react";

const ProteinViewer = ({ pdbData }) => {
  const [isClient, setIsClient] = useState(false);
  const viewerRef = useRef(null);

  useEffect(() => {
    setIsClient(true); // Ensures this component only runs in the browser
  }, []);

  useEffect(() => {
    if (isClient && pdbData) {
      import("3dmol").then(($3Dmol) => {
        if (!viewerRef.current) {
          viewerRef.current = new $3Dmol.GlViewer(
            document.getElementById("viewer-container"),
            { backgroundColor: "white" }
          );
        }

        viewerRef.current.clear();
        viewerRef.current.addModel(pdbData, "pdb");
        viewerRef.current.setStyle({}, { cartoon: { color: "spectrum" } });
        viewerRef.current.zoomTo();
        viewerRef.current.render();
      });
    }
  }, [isClient, pdbData]);

  return (
    <div id="viewer-container" className="w-full h-full">
      {isClient ? null : <p>Loading 3D viewer...</p>}
    </div>
  );
};

export default ProteinViewer;
