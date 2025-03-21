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

### Prerequisites & Requirements
Before setting up the project, ensure your system meets the following requirements:

1. System Requirements
- Operating System: Windows, macOS, or Linux
- Node.js: v18+ (Recommended)
- Package Manager: npm (comes with Node.js) or yarn
- Git

2. AI Model Requirements
You need either:
- Ollama (Local AI model)
  - Install Ollama: Ollama Installation Guide: https://github.com/ollama/ollama
  - Ensure it is running at http://localhost:11434
- OpenAI API (Remote AI model)
  - Get an OpenAI API Key: OpenAI Platform
  - Set AI_MODE=remote and provide your API key in .env

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

### Configure Environment Variables
Create a .env file in the project root and add the following required variables:

```ini
# AI Configuration
AI_MODE=                           # 'local' or 'remote'
AI_MODEL=                          # local example: 'llama3.2:1b'. remote example: 'gpt-4o'.

OLLAMA_URL=http://localhost:11434  # This is the default URI to access Ollama
OPENAI_API_KEY=your_key_here       # required only if AI_MODE=remote

# Set this to true if running Ollama on a different machine
# OLLAMA_INSECURE=true
```

#### Explanation of Variables:
- AI_MODE: Determines whether to use a local AI model (local) or a remote OpenAI model (remote).
- AI_MODEL: Defines the AI model to use. If using local, specify an Ollama model. If using remote, enter the OpenAI model name.
- OLLAMA_HOST: The URI where Ollama is hosted (default: http://localhost:11434).
- OPENAI_API_KEY: Only required if AI_MODE=remote; provides access to OpenAI's API.
- NEXT_PUBLIC_API_URL: The API endpoint used for AI-generated responses.
- OLLAMA_INSECURE: Set to true if running Ollama on another machine where HTTPS isn't configured.

#### Important
- If running locally with Ollama, ensure it is installed and accessible at the specified OLLAMA_HOST.
- If using OpenAI, you must set AI_MODE=remote and provide a valid OPENAI_API_KEY.
- Never expose your .env file in public repositories.
- Make sure to never expose your OpenAI API key in a public repository.

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

## License
This project is licensed under the MIT License.

## Authors
Developed by Sander Tøkje Hauge, Martin Hegnum Johannessen, Fredrik Sundt-Hansen and Daniel Lønning.