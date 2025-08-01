"""Python-based LangChain workflow engine"""

import asyncio
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, Callable
from workflow_state import WorkflowState, WorkflowResponse, AgentProgress
from agents import jira_analyst_agent, technical_architect_agent, product_manager_agent
from vector_store import vector_store


class PythonWorkflowEngine:
    """Python-based workflow engine for LangChain agents"""
    
    def __init__(self):
        self.active_workflows: Dict[str, WorkflowState] = {}
        self.progress_callbacks: Dict[str, Callable] = {}
        
        # Load sample documents into vector store
        vector_store.load_sample_documents()
        print(f"[Python] Vector store initialized with {vector_store.get_document_count()} documents")
    
    async def start_workflow(self, jira_ticket_id: str, progress_callback: Optional[Callable] = None) -> str:
        """Start a new LangChain workflow"""
        workflow_id = str(uuid.uuid4())
        
        print(f"[Python] Starting LangChain workflow for ticket: {jira_ticket_id}")
        
        # Initialize workflow state
        state: WorkflowState = {
            'jira_ticket_id': jira_ticket_id,
            'current_step': 'jira_analyst',
            'currentAgent': 'jira-analyst',  # Set initial agent
            'metadata': {
                'start_time': datetime.now().isoformat(),
                'engine_type': 'langchain-python',
                'version': '2.0'
            }
        }
        
        self.active_workflows[workflow_id] = state
        
        if progress_callback:
            self.progress_callbacks[workflow_id] = progress_callback
        
        # Start execution asynchronously
        asyncio.create_task(self._execute_workflow(workflow_id))
        
        return workflow_id
    
    async def _execute_workflow(self, workflow_id: str):
        """Execute the complete workflow"""
        state = self.active_workflows.get(workflow_id)
        if not state:
            print(f"[Python] Workflow {workflow_id} not found")
            return
        
        progress_callback = self.progress_callbacks.get(workflow_id)
        
        try:
            # Step 1: Jira Analyst Agent
            print(f"[Python] Executing JiraAnalystAgent for workflow {workflow_id}")
            
            async def analyst_progress(agent: str, message: str, progress: int):
                if progress_callback:
                    await progress_callback(AgentProgress(
                        workflow_id=workflow_id,
                        agent=agent,
                        message=message,
                        progress=progress
                    ))
            
            analyst_result = await jira_analyst_agent.execute(state, analyst_progress)
            
            if analyst_result.get('error'):
                raise Exception(analyst_result['error'])
            
            # Update state with analyst results
            state.update(analyst_result)
            state['currentAgent'] = 'completed'  # Mark as completed
            
            if progress_callback:
                await progress_callback(AgentProgress(
                    workflow_id=workflow_id,
                    agent='jira-analyst',
                    message='Ticket data fetch and Excel export completed',
                    progress=100,
                    completed=True
                ))
            
            # Skip other agents - only do data fetch and Excel export
            
            # Workflow completed successfully
            state['current_step'] = 'completed'
            state['currentAgent'] = 'completed'  # Mark as completed
            
            if progress_callback:
                await progress_callback(AgentProgress(
                    workflow_id=workflow_id,
                    agent='workflow',
                    message='LangChain workflow completed successfully',
                    progress=100,
                    completed=True
                ))
            
            print(f"[Python] Workflow {workflow_id} completed successfully")
            
        except Exception as error:
            print(f"[Python] Workflow {workflow_id} failed: {error}")
            state['error'] = str(error)
            state['current_step'] = 'failed'
            
            if progress_callback:
                await progress_callback(AgentProgress(
                    workflow_id=workflow_id,
                    agent='workflow',
                    message=f'Workflow failed: {str(error)}',
                    progress=100,
                    completed=True
                ))
    
    def get_workflow_status(self, workflow_id: str) -> Optional[WorkflowState]:
        """Get current workflow status"""
        return self.active_workflows.get(workflow_id)
    
    def get_all_workflows(self) -> Dict[str, WorkflowState]:
        """Get all active workflows"""
        return self.active_workflows.copy()
    
    async def cleanup_workflow(self, workflow_id: str):
        """Clean up completed workflow"""
        if workflow_id in self.active_workflows:
            del self.active_workflows[workflow_id]
        if workflow_id in self.progress_callbacks:
            del self.progress_callbacks[workflow_id]


# Global workflow engine instance
workflow_engine = PythonWorkflowEngine()