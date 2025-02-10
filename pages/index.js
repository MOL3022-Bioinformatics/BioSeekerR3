// pages/index.js

import React, { useState } from 'react';
import ChatPanel from '../src/app/components/ChatPanel';
import ProteinViewer from '../src/app/components/ProteinViewer';
import { fetchUniProtData } from '../src/app/services/uniprotService';
import { findPDBFromUniProt, fetchPDBFile } from '../src/app/services/pdbService';

export default function Home() {
  const [pdbData, setPdbData] = useState(null);

  async function handleSequenceSubmit(uniprotId) {
    try {
      // 1. Fetch UniProt data
      const uniProtInfo = await fetchUniProtData(uniprotId);
      console.log('UniProt Info:', uniProtInfo);

      // 2. Find a relevant PDB
      const pdbId = await findPDBFromUniProt(uniprotId);

      // 3. Fetch the PDB file
      const pdbFileText = await fetchPDBFile(pdbId);
      setPdbData(pdbFileText);
    } catch (err) {
      console.error('Error handleSequenceSubmit:', err);
      setPdbData(null);
    }
  }

  return (
    <div className="flex flex-row h-screen">
      <div className="w-2/5 border-r border-gray-300">
        <ChatPanel onSequenceSubmit={handleSequenceSubmit} />
      </div>
      <div className="flex-1 relative">
        <ProteinViewer pdbData={pdbData} />
      </div>
    </div>
  );
}
