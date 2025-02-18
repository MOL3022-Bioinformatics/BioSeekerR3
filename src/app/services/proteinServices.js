// services/proteinServices.js
const UNIPROT_API_BASE = 'https://rest.uniprot.org/uniprotkb';
const PDB_API_BASE = 'https://data.rcsb.org/rest/v1/core';
const PDB_FILE_BASE = 'https://files.rcsb.org/download';

// UniProt ID validation
export const isUniProtID = (text) => {
  // UniProt ID patterns:
  // 1. Standard format: [O,P,Q,A-N,R-Z][0-9][A-Z,0-9][A-Z,0-9][A-Z,0-9][0-9]
  // 2. Alternative format: [A-Z,0-9]+_[A-Z,0-9]+ (e.g., CMT2_ARATH)
  const standardPattern = /^[OPQ][0-9][A-Z0-9]{3}[0-9]$|^[A-NR-Z][0-9][A-Z][A-Z0-9]{2}[0-9]$/;
  const alternativePattern = /^[A-Z0-9]+_[A-Z0-9]+$/;
  
  return standardPattern.test(text) || alternativePattern.test(text);
};

// Fetch UniProt data with retry mechanism
export async function fetchUniProtData(uniprotId) {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`${UNIPROT_API_BASE}/${uniprotId}.json`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Protein ${uniprotId} not found in UniProt database`);
        }
        throw new Error(`UniProt API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Extract relevant information
      return {
        id: uniprotId,
        name: data.proteinDescription?.recommendedName?.fullName?.value || 'Unknown',
        organism: data.organism?.scientificName || 'Unknown',
        sequence: data.sequence?.value || '',
        length: data.sequence?.length || 0,
        function: data.comments?.find(c => c.commentType === 'FUNCTION')?.texts[0]?.value || 'Unknown',
        pdbIds: data.uniProtKBCrossReferences
          ?.filter(ref => ref.database === 'PDB')
          ?.map(ref => ref.id) || []
      };

    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      throw lastError;
    }
  }
}

// Find best matching PDB structure
export async function findPDBFromUniProt(uniprotId) {
  try {
    const uniprotData = await fetchUniProtData(uniprotId);
    
    if (!uniprotData.pdbIds || uniprotData.pdbIds.length === 0) {
      throw new Error(`No PDB structures found for ${uniprotId}`);
    }

    // For each PDB ID, fetch metadata to find the best resolution structure
    const pdbPromises = uniprotData.pdbIds.map(async (pdbId) => {
      try {
        const response = await fetch(`${PDB_API_BASE}/entry/${pdbId}`);
        if (!response.ok) return null;
        const data = await response.json();
        return {
          id: pdbId,
          resolution: data.rcsb_entry_info?.resolution_combined || 999,
          method: data.exptl?.[0]?.method || ''
        };
      } catch (error) {
        console.warn(`Error fetching PDB ${pdbId} metadata:`, error);
        return null;
      }
    });

    const pdbResults = (await Promise.all(pdbPromises)).filter(Boolean);

    // Sort by resolution (prefer X-ray structures)
    pdbResults.sort((a, b) => {
      if (a.method.includes('X-RAY') && !b.method.includes('X-RAY')) return -1;
      if (!a.method.includes('X-RAY') && b.method.includes('X-RAY')) return 1;
      return a.resolution - b.resolution;
    });

    return pdbResults[0]?.id || uniprotData.pdbIds[0];
  } catch (error) {
    console.error('Error in findPDBFromUniProt:', error);
    throw error;
  }
}

// Fetch PDB file with validation
export async function fetchPDBFile(pdbId) {
  if (!pdbId) throw new Error('PDB ID is required');
  
  try {
    const response = await fetch(`${PDB_FILE_BASE}/${pdbId}.pdb`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch PDB file: ${response.statusText}`);
    }

    const text = await response.text();
    
    // Validate PDB format
    if (!text.includes('ATOM') || !text.includes('END')) {
      throw new Error('Invalid PDB file format');
    }

    return text;
  } catch (error) {
    console.error('Error fetching PDB file:', error);
    throw error;
  }
}

// Fetch protein metadata
export async function fetchProteinMetadata(uniprotId) {
  try {
    const uniprotData = await fetchUniProtData(uniprotId);
    const pdbId = await findPDBFromUniProt(uniprotId);
    
    return {
      ...uniprotData,
      pdbId,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching protein metadata:', error);
    throw error;
  }
}