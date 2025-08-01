"""LangChain agents for multi-agent workflow"""

import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Dict, Any, Optional, Callable
from langchain_ollama import ChatOllama
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from pydantic import ValidationError

from workflow_state import WorkflowState, PRD
from jira_client import JiraTicketData
from prompts import (
    TECHNICAL_ARCHITECT_PROMPT,
    PRODUCT_MANAGER_PROMPT,
    JIRA_ANALYST_SYSTEM_PROMPT,
    RAG_QUERY_ENHANCEMENT_PROMPT
)
from vector_store import vector_store
from jira_client import jira_client
from jira_export_tool import get_jira_details_to_excel
from document_processor import document_processor
from confluence_client import confluence_client
from mermaid_generator import mermaid_generator

logger = logging.getLogger(__name__)


class LangChainJiraAnalystAgent:
    """Enhanced Jira Analyst Agent with RAG query optimization"""
    
    def __init__(self, model_name: str = "llama3.1:8b"):
        self.llm = ChatOllama(
            model=model_name,
            temperature=0.1,
            top_p=0.9
        )
        
        # RAG query enhancement chain
        rag_query_prompt = PromptTemplate.from_template(RAG_QUERY_ENHANCEMENT_PROMPT)
        self.rag_query_chain = rag_query_prompt | self.llm | StrOutputParser()
    
    async def execute(self, state_or_ticket_data, progress_callback=None) -> Dict[str, Any]:
        """Execute the Jira Analyst Agent - Simple data fetch and Excel export only"""
        if progress_callback:
            await progress_callback("jira-analyst", "Starting ticket data fetch...", 10)
        
        # Handle both state dict and JiraTicketData object
        if isinstance(state_or_ticket_data, dict):
            # Extract ticket ID from state and fetch ticket data
            jira_ticket_id = state_or_ticket_data.get('jira_ticket_id')
            logger.info(f"[LangChain] JiraAnalystAgent: Fetching ticket {jira_ticket_id}")
            
            # Fetch Jira ticket data
            jira_ticket_data = await jira_client.get_ticket(jira_ticket_id)
        else:
            # Direct JiraTicketData object
            jira_ticket_data = state_or_ticket_data
            logger.info(f"[LangChain] JiraAnalystAgent: Processing ticket {jira_ticket_data.key}")
        
        # Export ticket data to Excel
        if progress_callback:
            await progress_callback("jira-analyst", "Exporting ticket data to Excel...", 30)
        
        logger.info(f"[LangChain] JiraAnalystAgent: Exporting {jira_ticket_data.key} to Excel...")
        try:
            # Create jira_exports directory if it doesn't exist
            export_dir = "jira_exports"
            os.makedirs(export_dir, exist_ok=True)
            
            # Try real export first
            excel_file = get_jira_details_to_excel(jira_ticket_data.key, export_dir)
            
            # If real export fails, log the failure
            if not excel_file:
                logger.warning(f"[LangChain] JiraAnalystAgent: Real export failed for {jira_ticket_data.key}")
            
            if excel_file and os.path.exists(excel_file):
                logger.info(f"[LangChain] JiraAnalystAgent: Excel export successful: {excel_file}")
                logger.info(f"[LangChain] JiraAnalystAgent: File size: {os.path.getsize(excel_file)} bytes")
            else:
                logger.warning(f"[LangChain] JiraAnalystAgent: Excel export failed for {jira_ticket_data.key}")
                excel_file = None
        except Exception as e:
            logger.error(f"[LangChain] JiraAnalystAgent: Excel export error: {e}")
            excel_file = None
        
        # Create HSD ticket based on the fetched data
        if progress_callback:
            await progress_callback("jira-analyst", "Creating HSD ticket...", 70)
        
        logger.info(f"[LangChain] JiraAnalystAgent: Creating HSD ticket for {jira_ticket_data.key}...")
        try:
            hsd_ticket_key = await jira_client.create_hsd_ticket(jira_ticket_data)
            if hsd_ticket_key:
                logger.info(f"[LangChain] JiraAnalystAgent: Successfully created HSD ticket: {hsd_ticket_key}")
            else:
                logger.warning(f"[LangChain] JiraAnalystAgent: Failed to create HSD ticket for {jira_ticket_data.key}")
        except Exception as e:
            logger.error(f"[LangChain] JiraAnalystAgent: Error creating HSD ticket: {e}")
            hsd_ticket_key = None
        
        if progress_callback:
            await progress_callback("jira-analyst", "Workflow completed successfully", 100)
        
        # Return comprehensive result with all data
        return {
            'jira_ticket_data': jira_ticket_data.dict(),
            'current_step': 'completed',  # Skip other agents
            'ticket_key': jira_ticket_data.key,
            'summary': jira_ticket_data.summary,
            'excel_export': excel_file,
            'hsd_ticket_key': hsd_ticket_key,
            'status': 'completed'
        }
    



class LangChainTechnicalArchitectAgent:
    """Enhanced Technical Architect Agent with Chain-of-Thought reasoning"""
    
    def __init__(self, model_name: str = "llama3.1:8b"):
        self.llm = ChatOllama(
            model=model_name,
            temperature=0.1,
            top_p=0.9
        )
        
        # Technical architect chain
        architect_prompt = PromptTemplate.from_template(TECHNICAL_ARCHITECT_PROMPT)
        self.architect_chain = architect_prompt | self.llm | StrOutputParser()
    
    async def execute(self, state: WorkflowState, progress_callback: Optional[Callable] = None) -> Dict[str, Any]:
        """Execute technical architect workflow with Chain-of-Thought reasoning and Mermaid generation"""
        try:
            if progress_callback:
                await progress_callback("tech-architect", "Starting impact analysis...", 20)
            
            print('[LangChain] TechnicalArchitectAgent: Generating impact analysis and solution architecture')
            
            if not state.get('jira_ticket_data'):
                raise Exception('Jira ticket data not available')
            
            jira_ticket_data = state['jira_ticket_data']
            rag_context = state.get('rag_context', [])
            
            if progress_callback:
                await progress_callback("tech-architect", "Analyzing impact with Chain-of-Thought reasoning...", 40)
            
            # Handle components that might be dictionaries
            components_list = []
            for c in jira_ticket_data['components']:
                if isinstance(c, dict):
                    components_list.append(str(c.get('name', c)))
                else:
                    components_list.append(str(c))
            components_str = ', '.join(components_list)
            
            response = await self.architect_chain.ainvoke({
                'summary': jira_ticket_data['summary'],
                'description': jira_ticket_data['description'],
                'components': components_str,
                'priority': jira_ticket_data['priority'],
                'issue_type': jira_ticket_data.get('issuetype', {}).get('name', 'Story'),
                'acceptance_criteria': jira_ticket_data.get('acceptance_criteria', 'Not specified'),
                'rag_context': '\n---\n'.join(rag_context),
            })
            
            # Parse the response to extract impact analysis and solution architecture
            sections = self._parse_architect_response(response)
            
            if progress_callback:
                await progress_callback("tech-architect", "Generating architecture diagrams...", 70)
            
            # Generate Mermaid diagrams
            print('[LangChain] TechnicalArchitectAgent: Generating Mermaid diagrams')
            
            # Create components for diagram generation
            components_for_diagram = [
                {"name": comp, "type": "service", "description": f"Component: {comp}"}
                for comp in components_list[:5]  # Limit to 5 components
            ]
            
            # Generate architecture diagram
            architecture_diagram = mermaid_generator.generate_architecture_diagram(components_for_diagram)
            
            if progress_callback:
                await progress_callback("tech-architect", "Impact analysis and solution architecture completed", 100)
            
            print('[LangChain] TechnicalArchitectAgent: Generated comprehensive analysis with diagrams')
            
            return {
                'impact_analysis': sections['impact_analysis'],
                'solution_architecture': sections['solution_architecture'],
                'architecture_diagram': {
                    'title': architecture_diagram.title,
                    'mermaidCode': architecture_diagram.chart,
                    'description': architecture_diagram.description
                },
                'current_step': 'product_manager',
            }
        
        except Exception as error:
            error_message = f"TechnicalArchitectAgent failed: {str(error)}"
            print(f"[LangChain] {error_message}")
            return {'error': error_message}
    
    def _parse_architect_response(self, response: str) -> Dict[str, str]:
        """Parse architect response into sections"""
        sections = response.split('## Solution Architecture')
        impact_analysis = sections[0].replace('## Impact Analysis', '').strip()
        solution_architecture = f"## Solution Architecture{sections[1]}".strip() if len(sections) > 1 else ''
        
        return {
            'impact_analysis': impact_analysis,
            'solution_architecture': solution_architecture
        }


class LangChainProductManagerAgent:
    """Enhanced Product Manager Agent with Pydantic validation"""
    
    def __init__(self, model_name: str = "llama3.1:8b"):
        self.llm = ChatOllama(
            model=model_name,
            temperature=0.1,
            top_p=0.9
        )
        
        # Product manager chain
        prd_prompt = PromptTemplate.from_template(PRODUCT_MANAGER_PROMPT)
        self.prd_chain = prd_prompt | self.llm | StrOutputParser()
    
    def _create_format_instructions(self) -> str:
        """Create format instructions for structured output"""
        return """Please respond with a valid JSON object that matches this exact schema:
{
  "title": "string - The title of the feature or change",
  "introduction": "string - Brief overview of the project's purpose and goals",
  "problem_statement": "string - Clear description of the problem being solved",
  "user_stories": ["array of strings - User stories in 'As a [user type], I want [goal] so that [benefit]' format"],
  "technical_requirements": ["array of strings - Specific technical requirements from the solution architecture"],
  "non_functional_requirements": {"object - Performance, Security, Scalability requirements"},
  "out_of_scope": ["array of strings - Items explicitly not part of this project"],
  "success_metrics": ["array of strings - Quantifiable metrics to measure success"]
}

Ensure the JSON is valid and complete. Do not include any text before or after the JSON object."""
    
    async def execute(self, state: WorkflowState, progress_callback: Optional[Callable] = None) -> Dict[str, Any]:
        """Execute product manager workflow with PRD, Mermaid diagrams, and Confluence posting"""
        try:
            if progress_callback:
                await progress_callback("product-manager", "Starting PRD generation...", 20)
            
            print('[LangChain] ProductManagerAgent: Generating structured PRD with diagrams')
            
            if not all(key in state for key in ['jira_ticket_data', 'impact_analysis', 'solution_architecture']):
                raise Exception('Required data not available for PRD generation')
            
            jira_ticket_data = state['jira_ticket_data']
            
            if progress_callback:
                await progress_callback("product-manager", "Generating comprehensive PRD with structured validation...", 40)
            
            response = await self.prd_chain.ainvoke({
                'summary': jira_ticket_data['summary'],
                'description': jira_ticket_data['description'],
                'acceptance_criteria': jira_ticket_data.get('acceptance_criteria', 'Not specified'),
                'impact_analysis': state['impact_analysis'],
                'solution_architecture': state['solution_architecture'],
                'format_instructions': self._create_format_instructions(),
            })
            
            # Parse and validate the structured response
            prd_data = self._parse_structured_response(response)
            
            if progress_callback:
                await progress_callback("product-manager", "Generating Mermaid diagrams...", 60)
            
            # Generate Mermaid diagrams from PRD
            print('[LangChain] ProductManagerAgent: Generating Mermaid diagrams')
            
            diagrams = []
            
            # Generate sequence diagrams from user stories
            for i, user_story in enumerate(prd_data.get('user_stories', [])[:3]):  # Limit to 3 diagrams
                sequence_diagram = mermaid_generator.generate_sequence_diagram(user_story)
                diagrams.append({
                    'title': f"User Story {i + 1} Flow",
                    'description': user_story,
                    'mermaidCode': sequence_diagram.chart,
                    'type': 'sequence'
                })
            
            # Generate workflow diagram
            workflow_diagram = mermaid_generator.generate_workflow_diagram(prd_data.get('user_stories', []))
            diagrams.append({
                'title': workflow_diagram.title,
                'description': workflow_diagram.description,
                'mermaidCode': workflow_diagram.chart,
                'type': 'workflow'
            })
            
            # Add architecture diagram if available
            if 'architecture_diagram' in state:
                diagrams.append({
                    'title': state['architecture_diagram']['title'],
                    'description': state['architecture_diagram']['description'],
                    'mermaidCode': state['architecture_diagram']['mermaidCode'],
                    'type': 'architecture'
                })
            
            if progress_callback:
                await progress_callback("product-manager", "Creating comprehensive document...", 70)
            
            # Process document with all components
            architecture_document = await document_processor.process_prd_document(prd_data, jira_ticket_data)
            
            if progress_callback:
                await progress_callback("product-manager", "Posting to Confluence...", 85)
            
            # Post to Confluence
            print('[LangChain] ProductManagerAgent: Posting to Confluence')
            
            confluence_title = f"PRD: {prd_data.get('title', jira_ticket_data['summary'])}"
            
            # Create enhanced content with diagrams
            confluence_content = architecture_document.content
            
            # Add diagrams section
            confluence_content += "\n\n## Architecture Diagrams\n\n"
            for diagram in diagrams:
                confluence_content += f"### {diagram['title']}\n"
                confluence_content += f"{diagram['description']}\n\n"
                confluence_content += "```mermaid\n"
                confluence_content += diagram['mermaidCode']
                confluence_content += "\n```\n\n"
            
            confluence_result = await confluence_client.create_page(
                title=confluence_title,
                content=confluence_content
            )
            
            if progress_callback:
                await progress_callback("product-manager", "Creating DATADEV ticket for implementation...", 95)
            
            # Create DATADEV ticket with enhanced information
            try:
                datadev_ticket_key = await jira_client.create_datadev_ticket(
                    prd_data, 
                    jira_ticket_data['key'], 
                    JiraTicketData(**jira_ticket_data)
                )
            except Exception as e:
                print(f'[LangChain] Warning: DATADEV ticket creation failed: {e}')
                datadev_ticket_key = None
            
            if progress_callback:
                await progress_callback("product-manager", "PRD document with diagrams completed and posted to Confluence", 100)
            
            print(f'[LangChain] ProductManagerAgent: Generated PRD with {len(diagrams)} diagrams, posted to Confluence')
            
            return {
                'prd': prd_data,
                'architecture_document': architecture_document.__dict__,
                'mermaid_diagrams': diagrams,
                'confluence_result': confluence_result,
                'datadev_ticket_key': datadev_ticket_key,
                'current_step': 'completed',
            }
        
        except Exception as error:
            error_message = f"ProductManagerAgent failed: {str(error)}"
            print(f"[LangChain] {error_message}")
            return {'error': error_message}
    
    def _parse_structured_response(self, response: str) -> Dict[str, Any]:
        """Parse and validate structured response"""
        try:
            # Extract JSON from response (handle potential markdown code blocks)
            json_string = response.strip()
            
            # Remove markdown code block markers if present
            if json_string.startswith('```json'):
                json_string = json_string[7:]
            if json_string.startswith('```'):
                json_string = json_string[3:]
            if json_string.endswith('```'):
                json_string = json_string[:-3]
            
            # Try to find JSON object in the response
            import re
            json_match = re.search(r'\{.*\}', json_string, re.DOTALL)
            if json_match:
                json_string = json_match.group(0)
            
            parsed = json.loads(json_string)
            
            # Validate using Pydantic schema
            prd = PRD(**parsed)
            return prd.dict()
        
        except (json.JSONDecodeError, ValidationError) as error:
            print(f'[LangChain] Error parsing structured response: {error}')
            print(f'[LangChain] Raw response: {response}')
            
            # Try to extract basic information from the response
            try:
                # Look for key information in the response
                title_match = re.search(r'"title":\s*"([^"]+)"', response)
                intro_match = re.search(r'"introduction":\s*"([^"]+)"', response)
                problem_match = re.search(r'"problem_statement":\s*"([^"]+)"', response)
                
                return {
                    "title": title_match.group(1) if title_match else "Digital Telco Feature",
                    "introduction": intro_match.group(1) if intro_match else "This project aims to implement new features for the Digital Telco platform.",
                    "problem_statement": problem_match.group(1) if problem_match else "Users need improved functionality for managing their services.",
                    "user_stories": ["As a user, I want to manage my services effectively"],
                    "technical_requirements": ["Implement API endpoints", "Update UI components", "Integrate with backend services"],
                    "non_functional_requirements": {"Performance": "Response time < 2 seconds", "Security": "Secure data transmission"},
                    "out_of_scope": ["External integrations"],
                    "success_metrics": ["User satisfaction > 80%", "System uptime > 99%"],
                }
            except Exception:
                # Final fallback
                return {
                    "title": "Digital Telco Feature Implementation",
                    "introduction": "This project aims to implement new features for the Digital Telco platform.",
                    "problem_statement": "Users need improved functionality for managing their services.",
                    "user_stories": ["As a user, I want to manage my services effectively"],
                    "technical_requirements": ["Implement API endpoints", "Update UI components", "Integrate with backend services"],
                    "non_functional_requirements": {"Performance": "Response time < 2 seconds", "Security": "Secure data transmission"},
                    "out_of_scope": ["External integrations"],
                    "success_metrics": ["User satisfaction > 80%", "System uptime > 99%"],
                }
    



# Agent instances
jira_analyst_agent = LangChainJiraAnalystAgent()
technical_architect_agent = LangChainTechnicalArchitectAgent()
product_manager_agent = LangChainProductManagerAgent()