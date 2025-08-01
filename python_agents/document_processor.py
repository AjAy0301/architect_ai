
import asyncio
import json
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime
import mermaid_py
import markdown

logger = logging.getLogger(__name__)

@dataclass
class DocumentProcessingResult:
    document_id: int
    entities_created: int
    dependencies_created: int
    processing_time: float

@dataclass
class ArchitectureDocument:
    title: str
    summary: str
    components: List[Dict[str, Any]]
    sequence_diagrams: List[Dict[str, Any]]
    impact_analysis: List[Dict[str, Any]]
    content: str

class DocumentProcessor:
    """Python version of the TypeScript document processor"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    async def process_prd_document(self, prd_data: Dict[str, Any], jira_ticket: Dict[str, Any]) -> ArchitectureDocument:
        """Process PRD data into architecture document"""
        start_time = datetime.now()
        
        try:
            # Generate components from technical requirements
            components = self._extract_components(prd_data.get('technical_requirements', []))
            
            # Generate sequence diagrams from user stories
            sequence_diagrams = await self._generate_sequence_diagrams(prd_data.get('user_stories', []))
            
            # Create impact analysis from problem statement
            impact_analysis = self._generate_impact_analysis(prd_data)
            
            # Generate markdown content
            content = self._generate_markdown_content(prd_data, jira_ticket)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return ArchitectureDocument(
                title=prd_data.get('title', 'Untitled Document'),
                summary=prd_data.get('introduction', ''),
                components=components,
                sequence_diagrams=sequence_diagrams,
                impact_analysis=impact_analysis,
                content=content
            )
            
        except Exception as e:
            self.logger.error(f"Error processing PRD document: {e}")
            raise
    
    def _extract_components(self, technical_requirements: List[str]) -> List[Dict[str, Any]]:
        """Extract components from technical requirements"""
        components = []
        
        for req in technical_requirements:
            # Simple component extraction based on keywords
            component_type = "service"
            if "api" in req.lower() or "endpoint" in req.lower():
                component_type = "api"
            elif "ui" in req.lower() or "interface" in req.lower():
                component_type = "frontend"
            elif "database" in req.lower() or "storage" in req.lower():
                component_type = "database"
            
            components.append({
                "name": req[:50] + "..." if len(req) > 50 else req,
                "type": component_type,
                "description": req,
                "apis": []
            })
        
        return components
    
    async def _generate_sequence_diagrams(self, user_stories: List[str]) -> List[Dict[str, Any]]:
        """Generate Mermaid sequence diagrams from user stories"""
        diagrams = []
        
        for i, story in enumerate(user_stories):
            try:
                # Extract actors and actions from user story
                mermaid_code = self._user_story_to_mermaid(story)
                
                diagrams.append({
                    "title": f"User Story {i + 1} Flow",
                    "description": story,
                    "mermaidCode": mermaid_code,
                    "content": story
                })
            except Exception as e:
                self.logger.warning(f"Failed to generate diagram for story {i}: {e}")
        
        return diagrams
    
    def _user_story_to_mermaid(self, user_story: str) -> str:
        """Convert user story to Mermaid sequence diagram"""
        # Simple pattern matching to create sequence diagram
        mermaid_code = """sequenceDiagram
    participant User
    participant System
    participant Backend
    
    User->>System: Initiate Action
    System->>Backend: Process Request
    Backend-->>System: Return Response
    System-->>User: Display Result
"""
        
        # Customize based on story content
        if "login" in user_story.lower():
            mermaid_code = """sequenceDiagram
    participant User
    participant AuthSystem
    participant Database
    
    User->>AuthSystem: Login Request
    AuthSystem->>Database: Validate Credentials
    Database-->>AuthSystem: User Data
    AuthSystem-->>User: Authentication Token
"""
        elif "payment" in user_story.lower():
            mermaid_code = """sequenceDiagram
    participant User
    participant PaymentSystem
    participant Bank
    
    User->>PaymentSystem: Payment Request
    PaymentSystem->>Bank: Process Payment
    Bank-->>PaymentSystem: Payment Status
    PaymentSystem-->>User: Confirmation
"""
        
        return mermaid_code
    
    def _generate_impact_analysis(self, prd_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate impact analysis from PRD data"""
        impact_analysis = []
        
        # Analyze technical requirements for impact
        tech_reqs = prd_data.get('technical_requirements', [])
        
        for req in tech_reqs:
            risk_level = "low"
            affected_services = ["Primary Service"]
            
            # Determine risk level based on keywords
            if any(keyword in req.lower() for keyword in ["database", "migration", "schema"]):
                risk_level = "high"
                affected_services.extend(["Database", "Data Layer"])
            elif any(keyword in req.lower() for keyword in ["api", "integration", "external"]):
                risk_level = "medium"
                affected_services.extend(["API Gateway", "External Services"])
            
            impact_analysis.append({
                "component": req[:30] + "..." if len(req) > 30 else req,
                "riskLevel": risk_level,
                "affectedServices": affected_services,
                "description": f"Implementation of: {req}"
            })
        
        return impact_analysis
    
    def _generate_markdown_content(self, prd_data: Dict[str, Any], jira_ticket: Dict[str, Any]) -> str:
        """Generate complete markdown content for the document"""
        content = f"""# {prd_data.get('title', 'Product Requirements Document')}

## Overview
{prd_data.get('introduction', 'No introduction provided')}

## Problem Statement
{prd_data.get('problem_statement', 'No problem statement provided')}

## User Stories
"""
        
        for i, story in enumerate(prd_data.get('user_stories', []), 1):
            content += f"{i}. {story}\n"
        
        content += f"""
## Technical Requirements
"""
        
        for i, req in enumerate(prd_data.get('technical_requirements', []), 1):
            content += f"{i}. {req}\n"
        
        content += f"""
## Non-Functional Requirements
"""
        
        nfr = prd_data.get('non_functional_requirements', {})
        for key, value in nfr.items():
            content += f"- **{key}**: {value}\n"
        
        content += f"""
## Out of Scope
"""
        
        for i, item in enumerate(prd_data.get('out_of_scope', []), 1):
            content += f"{i}. {item}\n"
        
        content += f"""
## Success Metrics
"""
        
        for i, metric in enumerate(prd_data.get('success_metrics', []), 1):
            content += f"{i}. {metric}\n"
        
        content += f"""
## Original Jira Ticket
- **Key**: {jira_ticket.get('key', 'N/A')}
- **Summary**: {jira_ticket.get('summary', 'N/A')}
- **Priority**: {jira_ticket.get('priority', 'N/A')}
"""
        
        return content

# Global instance
document_processor = DocumentProcessor()
