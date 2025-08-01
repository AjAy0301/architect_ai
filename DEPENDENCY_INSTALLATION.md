
# Dependency Installation Guide

This document contains all the necessary commands to install dependencies for running the complete application stack.

## System Requirements

- Node.js (v18 or higher)
- Python (v3.11 or higher)
- npm (comes with Node.js)

## Node.js Dependencies Installation

### 1. Clean Installation (Recommended)
```bash
# Remove existing node_modules and lock files
rm -rf node_modules package-lock.json yarn.lock .yarn

# Clear npm cache
npm cache clean --force

# Install all dependencies
npm install
```

### 2. Install Specific Production Dependencies
```bash
# Core framework dependencies
npm install express@^4.21.2
npm install fastapi@^0.116.1
npm install react@^18.3.1
npm install react-dom@^18.3.1

# UI Component Libraries
npm install @radix-ui/react-accordion@^1.2.4
npm install @radix-ui/react-alert-dialog@^1.1.7
npm install @radix-ui/react-aspect-ratio@^1.1.3
npm install @radix-ui/react-avatar@^1.1.4
npm install @radix-ui/react-checkbox@^1.1.5
npm install @radix-ui/react-collapsible@^1.1.4
npm install @radix-ui/react-context-menu@^2.2.7
npm install @radix-ui/react-dialog@^1.1.7
npm install @radix-ui/react-dropdown-menu@^2.1.7
npm install @radix-ui/react-hover-card@^1.1.7
npm install @radix-ui/react-label@^2.1.3
npm install @radix-ui/react-menubar@^1.1.7
npm install @radix-ui/react-navigation-menu@^1.2.6
npm install @radix-ui/react-popover@^1.1.7
npm install @radix-ui/react-progress@^1.1.3
npm install @radix-ui/react-radio-group@^1.2.4
npm install @radix-ui/react-scroll-area@^1.2.4
npm install @radix-ui/react-select@^2.1.7
npm install @radix-ui/react-separator@^1.1.3
npm install @radix-ui/react-slider@^1.2.4
npm install @radix-ui/react-slot@^1.2.0
npm install @radix-ui/react-switch@^1.1.4
npm install @radix-ui/react-tabs@^1.1.4
npm install @radix-ui/react-toast@^1.2.7
npm install @radix-ui/react-toggle@^1.1.3
npm install @radix-ui/react-toggle-group@^1.1.3
npm install @radix-ui/react-tooltip@^1.2.0

# LangChain and AI Dependencies
npm install @langchain/community@^0.3.49
npm install @langchain/core@^0.3.66
npm install @langchain/ollama@^0.2.3
npm install @langchain/openai@^0.6.3
npm install langchain@^0.3.30
npm install langsmith@^0.3.50

# Database and ORM
npm install @neondatabase/serverless@^0.10.4
npm install drizzle-orm@^0.39.1
npm install drizzle-zod@^0.7.0

# Form Handling
npm install @hookform/resolvers@^3.10.0
npm install react-hook-form@^7.55.0

# Utility Libraries
npm install @jridgewell/trace-mapping@^0.3.25
npm install @tanstack/react-query@^5.60.5
npm install @types/node-fetch@^2.6.13
npm install cheerio@^1.1.2
npm install class-variance-authority@^0.7.1
npm install clsx@^2.1.1
npm install cmdk@^1.1.1
npm install connect-pg-simple@^10.0.0
npm install date-fns@^3.6.0
npm install embla-carousel-react@^8.6.0
npm install express-session@^1.18.1
npm install framer-motion@^11.13.1
npm install input-otp@^1.4.2
npm install lucide-react@^0.453.0
npm install memorystore@^1.6.7
npm install nanoid@^5.1.5
npm install next-themes@^0.4.6
npm install node-fetch@^3.3.2
npm install passport@^0.7.0
npm install passport-local@^1.0.0
npm install pdfjs-dist@^5.4.54
npm install react-day-picker@^8.10.1
npm install react-icons@^5.4.0
npm install react-resizable-panels@^2.1.7
npm install recharts@^2.15.2
npm install tailwind-merge@^2.6.0
npm install tailwindcss-animate@^1.0.7
npm install tw-animate-css@^1.2.5
npm install uuid@^11.1.0
npm install vaul@^1.1.2
npm install wouter@^3.3.5
npm install ws@^8.18.0
npm install zod@^3.24.2
npm install zod-validation-error@^3.4.0
```

### 3. Install Development Dependencies
```bash
# Replit specific plugins
npm install --save-dev @replit/vite-plugin-cartographer@^0.2.8
npm install --save-dev @replit/vite-plugin-runtime-error-modal@^0.0.3

# Tailwind CSS
npm install --save-dev @tailwindcss/typography@^0.5.15
npm install --save-dev @tailwindcss/vite@^4.1.3
npm install --save-dev autoprefixer@^10.4.20
npm install --save-dev postcss@^8.4.47
npm install --save-dev tailwindcss@^3.4.17

# TypeScript and Type Definitions
npm install --save-dev @types/connect-pg-simple@^7.0.3
npm install --save-dev @types/express@4.17.21
npm install --save-dev @types/express-session@^1.18.0
npm install --save-dev @types/node@20.16.11
npm install --save-dev @types/passport@^1.0.16
npm install --save-dev @types/passport-local@^1.0.38
npm install --save-dev @types/react@^18.3.11
npm install --save-dev @types/react-dom@^18.3.1
npm install --save-dev @types/ws@^8.5.13
npm install --save-dev typescript@5.6.3

# Build Tools
npm install --save-dev @vitejs/plugin-react@^4.3.2
npm install --save-dev drizzle-kit@^0.30.4
npm install --save-dev esbuild@^0.25.0
npm install --save-dev tsx@^4.20.3
npm install --save-dev vite@^5.4.19
```

### 4. Install Optional Dependencies
```bash
# Optional performance optimization
npm install bufferutil@^4.0.8
```

## Python Dependencies Installation

### 1. Navigate to Python Agents Directory
```bash
cd python_agents
```

### 2. Install Python Dependencies
```bash
# Install all Python dependencies from requirements.txt
pip install -r requirements.txt
```

### 3. Install Individual Python Dependencies (Alternative)
```bash
# Core FastAPI and server
pip install fastapi>=0.116.1
pip install uvicorn>=0.35.0
pip install python-multipart>=0.0.20

# LangChain ecosystem
pip install langchain>=0.3.27
pip install langchain-community>=0.3.27
pip install langchain-core>=0.3.72
pip install langchain-ollama>=0.3.6

# Data processing and ML
pip install numpy>=2.3.2
pip install pandas>=2.2.1
pip install scikit-learn>=1.7.1

# Web scraping and HTTP
pip install httpx>=0.28.1
pip install requests>=2.31.0
pip install beautifulsoup4>=4.12.2

# Jira and Confluence integration
pip install atlassian-python-api>=3.41.10
pip install jira>=3.5.2

# Vector database and embeddings
pip install chromadb>=0.4.22
pip install sentence-transformers>=2.3.1

# Data validation and configuration
pip install pydantic>=2.11.7
pip install python-dotenv>=1.1.1

# Additional utilities
pip install python-dateutil>=2.8.2
pip install pytz>=2023.3
pip install openpyxl>=3.1.2
```

## Verification Commands

### 1. Verify Node.js Installation
```bash
# Check if all packages are installed correctly
npm list

# Check for vulnerabilities
npm audit

# Check package sizes
npm ls --depth=0
```

### 2. Verify Python Installation
```bash
# Navigate to python_agents directory
cd python_agents

# Check installed packages
pip list

# Verify specific LangChain installation
python -c "import langchain; print(langchain.__version__)"

# Verify FastAPI installation
python -c "import fastapi; print(fastapi.__version__)"
```

## Troubleshooting

### If npm install fails:
```bash
# Clear all caches and reinstall
rm -rf node_modules package-lock.json yarn.lock .yarn
npm cache clean --force
npm install --no-optional
```

### If Python dependencies fail:
```bash
# Upgrade pip first
pip install --upgrade pip

# Install dependencies one by one if batch install fails
pip install fastapi uvicorn langchain pydantic
```

### For network/corruption issues:
```bash
# Use different registry
npm config set registry https://registry.npmjs.org/
npm install

# Or use npm instead of yarn
rm -rf yarn.lock .yarn
npm install
```

## Running the Application

After installing all dependencies:

### 1. Start the Full Application
```bash
# From root directory - runs both Node.js and Python servers
npm run dev
```

### 2. Start Individual Services
```bash
# Node.js development server only
npm run dev

# Python agents server only (from python_agents directory)
cd python_agents && python start_server.py
```

## Environment Setup

Create necessary environment files:

### 1. Python Environment (.env in python_agents/)
```bash
# Create .env file in python_agents directory
cp python_agents/.env.example python_agents/.env
```

### 2. Configure required environment variables in .env:
- JIRA_URL
- JIRA_USERNAME
- JIRA_API_TOKEN
- OLLAMA_BASE_URL (default: http://localhost:11434)

This completes the dependency installation setup for your multi-agent workflow application.
