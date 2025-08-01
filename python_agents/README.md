# Python LangChain Agents

This directory contains the Python-based implementation of the multi-agent workflow system using LangChain, Pydantic, and advanced RAG techniques.

## Architecture

### Core Components

1. **Workflow State Management** (`workflow_state.py`)
   - TypedDict-based state management for LangGraph compatibility
   - Pydantic models for data validation and structured outputs
   - Strong typing for all workflow interactions

2. **Advanced Agent Implementation** (`agents.py`)
   - `LangChainJiraAnalystAgent`: Enhanced RAG query optimization using LLM
   - `LangChainTechnicalArchitectAgent`: Chain-of-Thought reasoning for impact analysis
   - `LangChainProductManagerAgent`: Pydantic-validated structured PRD generation

3. **Vector Store & RAG** (`vector_store.py`)
   - TF-IDF based similarity search for document retrieval
   - Metadata filtering and semantic context building
   - Sample documents for testing and demonstration

4. **Jira Integration** (`jira_client.py`)
   - Async Jira API client with fallback to mock data
   - Structured ticket data extraction and validation
   - Configurable with environment variables

5. **Workflow Engine** (`workflow_engine.py`)
   - Python-based orchestration of multi-agent workflows
   - Real-time progress tracking and WebSocket broadcasting
   - Async execution with comprehensive error handling

6. **FastAPI Server** (`main.py`)
   - RESTful API endpoints for workflow management
   - WebSocket support for real-time updates
   - CORS-enabled for integration with Node.js frontend

## Features

### Advanced AI Capabilities
- **Chain-of-Thought Reasoning**: Step-by-step analysis with explicit reasoning instructions
- **Enhanced RAG Pipeline**: LLM-powered query optimization for better context retrieval
- **Pydantic Validation**: Structured output generation with schema enforcement
- **Semantic Search**: TF-IDF vectorization for document similarity matching

### Workflow Management
- **Async Processing**: Non-blocking workflow execution with progress tracking
- **Real-time Updates**: WebSocket broadcasting for live progress monitoring
- **Error Handling**: Comprehensive error recovery and fallback mechanisms
- **State Persistence**: In-memory workflow state with cleanup management

### Integration
- **Node.js Communication**: RESTful API and WebSocket integration
- **Environment Configuration**: Flexible setup with environment variables
- **Mock Data Support**: Fallback data for testing without external dependencies
- **Health Monitoring**: Service health checks and status reporting

## Setup Instructions

### 1. Install Dependencies
```bash
cd python_agents
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start the Server
```bash
# Method 1: Direct Python execution
python main.py

# Method 2: Using the startup script
python start_server.py

# Method 3: With requirements installation
python start_server.py --install
```

The server will start on port 8001 by default (configurable via `PYTHON_AGENTS_PORT`).

## API Endpoints

### Workflow Management
- `POST /workflow/start` - Start a new LangChain workflow
- `GET /workflow/{workflow_id}` - Get workflow status
- `GET /workflows` - List all workflows

### Health & Monitoring
- `GET /health` - Service health check
- `WebSocket /ws` - Real-time updates and progress monitoring

## Environment Variables

```bash
# Server Configuration
PYTHON_AGENTS_PORT=8001

# Jira Configuration (optional)
JIRA_INSTANCE_URL=https://your-domain.atlassian.net
JIRA_USERNAME=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-coder-v2:16b-lite-instruct-q4_K_M

# Integration
NODEJS_SERVER_URL=http://localhost:5000
```

## Integration with Node.js

The Python agents integrate seamlessly with the Node.js frontend through:

1. **RESTful API Communication**: Node.js server forwards workflow requests to Python agents
2. **WebSocket Bridging**: Real-time updates are forwarded from Python to Node.js clients
3. **Consistent Data Models**: Shared data structures for workflow state and progress tracking
4. **Health Monitoring**: Integrated health checks in the Node.js dashboard

## Advanced Features

### Chain-of-Thought Prompting
The Technical Architect Agent uses sophisticated prompting techniques:
```python
# Step-by-step reasoning instructions
**Chain-of-Thought Instructions:**
Before providing your final answer, think through each step carefully:
- What are the immediate implications of this change?
- What are the downstream effects?
- What could go wrong and how can we mitigate risks?
```

### Pydantic Output Validation
Structured PRD generation with strict schema enforcement:
```python
class PRD(BaseModel):
    title: str = Field(description="The title of the feature...")
    introduction: str = Field(description="Brief overview...")
    # ... detailed schema with validation
```

### Enhanced RAG Pipeline
LLM-powered query optimization for better context retrieval:
```python
# Generate optimized search queries using LLM
enhanced_query = await self.rag_query_chain.ainvoke({
    'summary': ticket_data.summary,
    'description': ticket_data.description,
    # ... context-aware query generation
})
```

## Development & Testing

### Mock Data
The system includes comprehensive mock data for testing without external dependencies:
- Sample Jira tickets with realistic data
- Pre-loaded vector store with technical documents
- Fallback mechanisms for all external services

### Debugging
Enable detailed logging by setting log levels in the startup configuration:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Performance
The system is optimized for:
- Async processing to handle multiple concurrent workflows
- Efficient vector similarity search with TF-IDF
- Memory management with workflow cleanup
- Real-time WebSocket communication

## Architecture Benefits

### Separation of Concerns
- **Python**: Advanced AI/ML processing, LangChain orchestration, RAG pipeline
- **Node.js**: Web interface, API routing, real-time communication, UI state management

### Scalability
- Independent scaling of AI processing and web interface
- Async processing prevents blocking operations
- Stateless design for horizontal scaling potential

### Maintainability
- Clear separation between AI logic and web application
- Strongly typed interfaces with Pydantic
- Comprehensive error handling and logging
- Modular architecture for easy feature additions