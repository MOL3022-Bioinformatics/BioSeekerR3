// services/pdbService.js
export async function findPDBFromUniProt(uniprotId) {
    // For MVP, just return a known PDB id
    return '1CRN';
  }
  
  export async function fetchPDBFile(pdbId) {
    try {
      const response = await fetch(`https://files.rcsb.org/download/${pdbId}.pdb`);
      if (!response.ok) {
        throw new Error(`PDB entry not found for ${pdbId}`);
      }
      return await response.text();
    } catch (err) {
      console.error('fetchPDBFile error:', err);
      throw err;
    }
  }
  