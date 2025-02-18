# Protein Analysis Suite

A bioinformatics tool that allows users to visualize protein structures, analyze molecular features, and interact with a bioinformatics chatbot for protein-related insights. 

Built using Next.js, React, and OpenAI API for visualization and chatbot features.

---

## Table of Contents

- [Protein Analysis Suite](#protein-analysis-suite)
- [Getting Started](#getting-started)
  - [Clone the Repository](#clone-the-repository)
  - [Install Dependencies](#install-dependencies)
  - [Run the Development Server](#run-the-development-server)
- [Features](#features)
  - [Protein Visualization](#protein-visualization)
  - [AI-Powered Bioinformatics Chatbot](#ai-powered-bioinformatics-chatbot)
  - [Quick Reference Cards](#quick-reference-cards)
- [How to Use](#how-to-use)
  - [Loading a Protein](#loading-a-protein)
  - [Example Questions to Ask the Chatbot](#example-questions-to-ask-the-chatbot)
- [Learn More](#learn-more)
- [License](#license)
- [Authors](#authors)

---

## Getting Started

### Clone the Repository
```bash
git clone https://github.com/MOL3022-Bioinformatics/BioSeekerR3.git
cd BioSeekerR3
```

### Install Dependencies
```bash
npm install
# or
yarn install
```

### Run the Development server
```bash
npm run dev
# or
yarn dev
```
Now, open http://localhost:3000 in your browser to start using the app.

## Features
### Protein Visualization
* Load and explore 3D protein structures using UniProt IDs.
* Choose different visualization styles (Cartoon, Stick, Sphere).

### AI-Powered Bioinformatics Chatbot
* Ask protein-related questions using natural language.
* Get scientific explanations about molecular structures, folding, and mutations.
* Use quick commands to load proteins.

### Quick Reference Cards
* View biological concepts with suggested chatbot questions.

## How to Use
### Loading a Protein
Use the chatbot command:
```bash
/protein P01308
```

This will load Insulin (P01308) into the Protein Viewer.

### Example Questions to Ask the Chatbot
* What is the function of hemoglobin?
* What happens if a protein misfolds?
* Where is the active site of this protein?
* What do the different colors in the visualization mean?

## Learn More
To learn more about Next.js, visit:

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js GitHub](https://github.com/vercel/next.js)
- [Next.js Interactive Tutorial](https://nextjs.org/learn)

## License
This project is licensed under the MIT License.

## Authors
Developed by Sander Tøkje Hauge, Martin Hegnum Johannessen, Fredrik Sundt-Hansen and Daniel Lønning.