import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatPanel from '../src/app/components/ChatPanel';
import ProteinViewer from '../src/app/components/ProteinViewer';
import { fetchProteinMetadata, fetchPDBFile } from '../src/app/services/proteinServices';
import { Loader2, AlertCircle, Database, Atom } from "lucide-react";

export default function Home() {
  const [pdbData, setPdbData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentProtein, setCurrentProtein] = useState(null);
  const [showSplitView, setShowSplitView] = useState(true);

  useEffect(() => {
    // Add smooth transition on initial load
    document.body.classList.add('transition-colors', 'duration-300');
  }, []);

  async function handleSequenceSubmit(uniprotId) {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Fetch protein metadata
      const metadata = await fetchProteinMetadata(uniprotId);
      setCurrentProtein(metadata);

      // 2. Fetch PDB file
      const pdbFileText = await fetchPDBFile(metadata.pdbId);
      setPdbData(pdbFileText);
      
      // 3. Ensure split view is active
      setShowSplitView(true);

      return metadata;
    } catch (err) {
      console.error('Error in handleSequenceSubmit:', err);
      setError(err.message || 'Failed to load protein data');
      setPdbData(null);
    } finally {
      setLoading(false);
    }
  }

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] dark:bg-gray-900 text-[var(--text-color)] dark:text-gray-200">
      {/* Header */}
      <motion.header 
        className="bg-[var(--chat-bg)] dark:bg-gray-800 text-[var(--text-color)] dark:text-gray-200 py-4 px-6 shadow-lg"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Atom className="h-8 w-8" />
              <h1 className="text-2xl font-bold">Protein Analysis Suite</h1>
            </div>
            <div className="flex space-x-4">
              {/* Dark Mode Toggle Button */}
              <button
                onClick={() => {
                  document.documentElement.classList.toggle("dark");
                }}
                className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors"
              >
                Toggle Dark Mode
            </button>

              {/* Split View Toggle Button */}
              <button
                onClick={() => setShowSplitView(!showSplitView)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white flex items-center space-x-2"
              >
                <Database className="h-4 w-4" />
                <span>{showSplitView ? 'Full Chat' : 'Split View'}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        <div className="flex gap-4 h-[calc(100vh-8rem)]">
          {/* Chat Panel */}
          <motion.div 
            className={`${showSplitView ? 'w-1/2' : 'w-full'} transition-all duration-300`}
            layout
          >
            <ChatPanel 
              onSendMessage={(msg) => console.log('Message sent:', msg)}
              onProteinVisualize={handleSequenceSubmit}
            />
          </motion.div>

          {/* Protein Viewer */}
          <AnimatePresence>
            {showSplitView && (
              <motion.div 
                className="w-1/2 flex flex-col bg-[var(--chat-bg)] dark:bg-gray-800 rounded-lg overflow-hidden shadow-xl"
                {...fadeIn}
                transition={{ duration: 0.3 }}
              >
                <div className="p-4 bg-[var(--chat-bg)] dark:bg-gray-800 border-b border-gray-700">
                  <h2 className="text-xl font-semibold text-[var(--text-color)] dark:text-gray-200">
                    Protein Visualization
                  </h2>
                  {currentProtein && (
                    <motion.div 
                      className="mt-2 text-sm text-[var(--text-color)] dark:text-gray-200 opacity-75"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <p>Name: {currentProtein.name}</p>
                      <p>Organism: {currentProtein.organism}</p>
                      <p>Length: {currentProtein.length} amino acids</p>
                    </motion.div>
                  )}
                </div>

                <div className="flex-1 relative bg-[var(--background)] dark:bg-gray-900">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div 
                        key="loading"
                        className="absolute inset-0 flex flex-col items-center justify-center space-y-2"
                        {...fadeIn}
                      > 
                        <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
                        <p className="mt-2 text-[var(--text-color)] text-sm">Fetching protein metadata...</p>
                    </motion.div>                    
                    ) : error ? (
                      <motion.div 
                        key="error"
                        className="absolute inset-0 flex items-center justify-center"
                        {...fadeIn}
                      >
                        <div className="text-center text-red-400 p-4">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-lg font-semibold">Error</p>
                          <p className="mt-2">{error}</p>
                        </div>
                      </motion.div>
                    ) : !pdbData ? (
                      <motion.div 
                        key="empty"
                        className="absolute inset-0 flex items-center justify-center"
                        {...fadeIn}
                      >
                        <div className="text-center text-[var(--text-color)] opacity-75 p-4">
                          <Atom className="h-12 w-12 mx-auto mb-3 opacity-50 animate-bounce" />
                          <p className="text-lg font-semibold">No protein selected</p>
                          <p className="mt-2">Try searching for a UniProt ID, e.g., <code className="bg-gray-300 text-gray-900 px-2 py-1 rounded">P01308</code> (Insulin)</p>
                          <button className="mt-3 px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition"
                            onClick={() => handleSequenceSubmit('P01308')}
                          >
                            Load Example Protein
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="viewer"
                        className="h-full"
                        {...fadeIn}
                      >
                        <ProteinViewer pdbData={pdbData} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}