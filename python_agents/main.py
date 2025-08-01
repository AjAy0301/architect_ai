"""FastAPI server for Python-based LangChain agents"""

import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import json

from workflow_state import WorkflowRequest, WorkflowResponse, AgentProgress
from workflow_engine import workflow_engine
from jira_client import jira_client

# Load environment variables
load_dotenv()


class ConnectionManager:
    """WebSocket connection manager"""
    
    def __init__(self):
        self.active_connections: list[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except:
                disconnected.append(connection)
        
        # Remove disconnected clients
        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    print("[Python] Starting Python LangChain Agent Server")
    yield
    print("[Python] Shutting down Python LangChain Agent Server")
    await jira_client.close()


app = FastAPI(
    title="Python LangChain Agents",
    description="Python-based LangChain agents for multi-agent workflow processing",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "python-langchain-agents",
        "version": "1.0.0"
    }


@app.post("/workflow/start", response_model=WorkflowResponse)
async def start_workflow(request: WorkflowRequest):
    """Start a new LangChain workflow"""
    try:
        # Progress callback to broadcast updates
        async def progress_callback(progress: AgentProgress):
            await manager.broadcast({
                "type": "agent_progress",
                "workflow_id": progress.workflow_id,
                "agent": progress.agent,
                "message": progress.message,
                "progress": progress.progress,
                "completed": progress.completed
            })
        
        workflow_id = await workflow_engine.start_workflow(
            request.jira_ticket_id,
            progress_callback
        )
        
        # Broadcast workflow started
        await manager.broadcast({
            "type": "python_workflow_started",
            "workflow_id": workflow_id,
            "jira_ticket_id": request.jira_ticket_id,
            "engine_type": "python-langchain"
        })
        
        return WorkflowResponse(
            workflow_id=workflow_id,
            status="started",
            message=f"Python LangChain workflow started for {request.jira_ticket_id}",
            current_step="jira_analyst"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/workflow/{workflow_id}")
async def get_workflow_status(workflow_id: str):
    """Get workflow status"""
    state = workflow_engine.get_workflow_status(workflow_id)
    if not state:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return {
        "workflow_id": workflow_id,
        "status": state.get('current_step', 'unknown'),
        "state": state
    }


@app.get("/workflows")
async def get_all_workflows():
    """Get all workflows"""
    workflows = workflow_engine.get_all_workflows()
    return {
        "count": len(workflows),
        "workflows": workflows
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket)
    try:
        # Send initial connection message
        await websocket.send_text(json.dumps({
            "type": "connected",
            "message": "Connected to Python LangChain Agents",
            "service": "python-langchain-agents"
        }))
        
        # Keep connection alive
        while True:
            data = await websocket.receive_text()
            # Echo back for testing
            await websocket.send_text(f"Echo: {data}")
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("[Python] Client disconnected")


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PYTHON_AGENTS_PORT", "8001"))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )