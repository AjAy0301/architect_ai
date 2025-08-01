# AI Multi-Agent Jira Automation System

## Overview

This is a full-stack web application that automates the analysis of Jira tickets using a multi-agent AI workflow. The system consists of three specialized AI agents (Jira Analyst, Technical Architect, and Product Manager) that work together to process Jira tickets and generate comprehensive documentation including impact analyses, solution architectures, and Product Requirements Documents (PRDs).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with a dark theme using shadcn/ui components
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **UI Library**: Radix UI primitives with custom styling (New York variant)
- **Real-time Communication**: WebSocket connection for live workflow updates

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with WebSocket support for real-time updates
- **Architecture Pattern**: Multi-agent workflow system with in-memory storage
- **AI Integration**: Ollama for local LLM inference
- **External Integrations**: Jira API for ticket fetching

### Data Storage Solutions
- **Primary Storage**: In-memory storage implementation (MemStorage class)
- **Database Schema**: Drizzle ORM with PostgreSQL schema definitions (ready for future implementation)
- **Vector Storage**: In-memory vector store for RAG (Retrieval-Augmented Generation) context
- **Session Management**: Stateful workflow tracking in memory

## Key Components

### Multi-Agent Workflow System
1. **JiraAnalystAgent**: Fetches Jira tickets and retrieves RAG context
2. **TechnicalArchitectAgent**: Generates impact analysis using Chain-of-Thought prompting
3. **ProductManagerAgent**: Creates structured PRDs and consolidates documentation

### AI Services
- **Ollama Service**: Local LLM integration with health monitoring
- **Vector Store**: Semantic search for historical documentation context
- **Workflow Engine**: Orchestrates agent execution with WebSocket updates

### External Integrations
- **Jira Client**: Fetches ticket data with fallback to mock data
- **Real-time Updates**: WebSocket broadcasting for workflow progress

## Data Flow

1. **Workflow Initiation**: User submits Jira ticket ID through the dashboard
2. **Jira Analysis**: First agent fetches ticket data and retrieves relevant context
3. **Technical Analysis**: Second agent performs impact analysis with LLM reasoning
4. **Document Generation**: Third agent creates structured PRD and final documentation
5. **Real-time Updates**: Progress broadcasted via WebSocket to connected clients
6. **Completion**: Generated documents stored and workflow marked complete

## External Dependencies

### AI and ML
- **Ollama**: Local LLM inference engine (default model: deepseek-coder-v2:16b-lite-instruct-q4_K_M)
- **TanStack Query**: React server state management

### Backend Services
- **Jira API**: Ticket data retrieval (requires JIRA_INSTANCE_URL, JIRA_USERNAME, JIRA_API_TOKEN)
- **WebSocket**: Real-time communication between client and server

### Development Tools
- **Vite**: Frontend build tool with HMR
- **Drizzle Kit**: Database schema management
- **ESBuild**: Server-side bundling for production

### UI Framework
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library

## Deployment Strategy

### Development Environment
- **Dev Server**: Vite development server with Express backend
- **Hot Reload**: Real-time code updates for both frontend and backend
- **Environment Variables**: Local configuration for Jira and Ollama connections

### Production Build
- **Frontend**: Static build output to `dist/public`
- **Backend**: ESBuild bundle to `dist/index.js`
- **Serving**: Express serves both API routes and static frontend assets

### Configuration Requirements
- **Ollama**: Must be running locally on port 11434
- **Jira Integration**: Optional but requires proper API credentials
- **Database**: PostgreSQL connection string for future persistence layer

### Scalability Considerations
- **Current State**: In-memory storage suitable for development and small deployments
- **Future Enhancement**: Database persistence layer already defined with Drizzle schema
- **Agent Scaling**: Workflow engine designed to handle multiple concurrent workflows
- **Real-time Performance**: WebSocket connections for immediate workflow updates

## Recent Changes: Latest modifications with dates

### July 31, 2025 - Python LangChain Agents Integration & Multi-Engine Architecture
- **Python-Based AI Agents**: Complete separation of AI processing into dedicated Python service
  - `python_agents/` directory with FastAPI server for LangChain processing
  - Advanced Pydantic models for structured data validation and output generation
  - TF-IDF based vector store with semantic search capabilities
  - Async workflow engine with real-time progress tracking
- **Triple Engine Architecture**: Three distinct workflow processing engines
  - **Python LangChain**: Advanced AI processing with Pydantic validation (Recommended)
  - **Node.js LangChain**: Enhanced workflow with LangChain integration
  - **Basic Workflow**: Simple agent orchestration for quick analysis
- **Microservices Communication**: Node.js ↔ Python integration layer
  - RESTful API communication between Node.js frontend and Python agents
  - WebSocket message forwarding for real-time progress updates
  - Health monitoring and service status integration
- **Enhanced Frontend Experience**: 
  - Updated engine selection with Python LangChain as recommended option
  - Engine-specific progress indicators and messaging
  - Health status monitoring for all service components
- **Advanced AI Capabilities**: 
  - Chain-of-Thought reasoning with step-by-step analysis instructions
  - LLM-powered RAG query optimization for better context retrieval
  - Pydantic schema enforcement for reliable structured outputs
  - Comprehensive error handling and fallback mechanisms