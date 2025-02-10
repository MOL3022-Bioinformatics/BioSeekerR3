// services/uniprotService.js
export async function fetchUniProtData(uniprotId) {
    try {
      const response = await fetch(`https://rest.uniprot.org/uniprotkb/${uniprotId}.json`);
      if (!response.ok) {
        throw new Error('UniProt entry not found');
      }
      return await response.json();
    } catch (err) {
      console.error('fetchUniProtData error:', err);
      throw err;
    }
  }
  