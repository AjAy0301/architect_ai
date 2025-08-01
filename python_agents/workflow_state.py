from typing import TypedDict, List, Dict, Any, Optional
from pydantic import BaseModel, Field


class WorkflowState(TypedDict):
    """Enhanced workflow state interface for LangGraph implementation"""
    jira_ticket_id: str
    jira_ticket_data: Optional[Dict[str, Any]]
    rag_context: Optional[List[str]]
    impact_analysis: Optional[str]
    solution_architecture: Optional[str]
    prd: Optional[Dict[str, Any]]
    error: Optional[str]
    current_step: Optional[str]  # 'jira_analyst' | 'tech_architect' | 'product_manager' | 'completed'
    metadata: Optional[Dict[str, Any]]


# JiraTicketData is now imported from jira_client.py


class PRD(BaseModel):
    """Enhanced PRD schema for Pydantic-style parsing"""
    title: str = Field(description="The title of the feature or change described in the Jira ticket")
    introduction: str = Field(description="A brief, one-paragraph overview of the project's purpose and goals")
    problem_statement: str = Field(description="A clear and concise description of the problem this change is solving")
    user_stories: List[str] = Field(description="A list of user stories in the format 'As a [user type], I want [goal] so that [benefit]'")
    technical_requirements: List[str] = Field(description="A list of specific technical requirements derived from the solution architecture")
    non_functional_requirements: Dict[str, str] = Field(description="A dictionary of non-functional requirements, with keys like 'Performance', 'Security', 'Scalability'")
    out_of_scope: List[str] = Field(description="A list of items that are explicitly not part of this project")
    success_metrics: List[str] = Field(description="A list of quantifiable metrics that will be used to measure the success of this feature")


class WorkflowRequest(BaseModel):
    """Request model for starting a workflow"""
    jira_ticket_id: str
    engine_type: str = "langchain"


class WorkflowResponse(BaseModel):
    """Response model for workflow operations"""
    workflow_id: str
    status: str
    message: str
    current_step: Optional[str] = None
    error: Optional[str] = None


class AgentProgress(BaseModel):
    """Progress update from agents"""
    workflow_id: str
    agent: str
    message: str
    progress: int
    completed: bool = False