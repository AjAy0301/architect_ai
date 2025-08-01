"""Enhanced Jira client with real API integration"""

import asyncio
import logging
from typing import Optional, Dict, Any, List
import json
import requests
from dataclasses import dataclass
from datetime import datetime

import config

logger = logging.getLogger(__name__)

@dataclass
class JiraTicketData:
    """Structured Jira ticket data"""
    key: str
    summary: str
    description: str
    status: str
    priority: str
    assignee: Optional[Dict[str, Any]]
    reporter: Optional[Dict[str, Any]]
    created: str
    updated: str
    labels: List[str]
    components: List[Dict[str, Any]]
    attachments: List[Dict[str, Any]]
    comments: List[Dict[str, Any]]
    issuetype: Dict[str, Any]
    project: Dict[str, Any]
    environment: str
    duedate: Optional[str]
    epic_link: Optional[str]
    sprint: Optional[str]
    
    def dict(self):
        return {
            'key': self.key,
            'summary': self.summary,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'assignee': self.assignee,
            'reporter': self.reporter,
            'created': self.created,
            'updated': self.updated,
            'labels': self.labels,
            'components': self.components,
            'attachments': self.attachments,
            'comments': self.comments,
            'issuetype': self.issuetype,
            'project': self.project,
            'environment': self.environment,
            'duedate': self.duedate,
            'epic_link': self.epic_link,
            'sprint': self.sprint
        }


class JiraClient:
    """Enhanced Jira client with real API integration"""
    
    def __init__(self):
        self.base_url = config.base_url.rstrip('/')
        self.username = config.os_username
        self.password = config.os_password
        self.headers = {
            'Accept': 'application/json',
            'User-Agent': 'ArchitectAI/1.0 (Jira Ticket Fetcher)'
        }
        self.auth = (self.username, self.password)
    
    async def get_ticket(self, ticket_id: str) -> JiraTicketData:
        """Fetch Jira ticket data using real API"""
        try:
            # Try real Jira API first
            ticket_data = await self._fetch_real_ticket(ticket_id)
            if ticket_data:
                logger.info(f"Successfully fetched real Jira ticket: {ticket_id}")
                # Print detailed ticket information
                logger.info(f"=== Fetched Ticket Details for {ticket_id} ===")
                logger.info(f"Summary: {ticket_data.summary}")
                logger.info(f"Status: {ticket_data.status}")
                logger.info(f"Priority: {ticket_data.priority}")
                logger.info(f"Type: {ticket_data.issuetype.get('name', 'N/A')}")
                logger.info(f"Project: {ticket_data.project.get('name', 'N/A')}")
                logger.info(f"Assignee: {ticket_data.assignee.get('displayName', 'N/A') if ticket_data.assignee else 'Unassigned'}")
                logger.info(f"Labels: {', '.join(ticket_data.labels) if ticket_data.labels else 'None'}")
                logger.info(f"Components: {', '.join([c.get('name', '') for c in ticket_data.components]) if ticket_data.components else 'None'}")
                logger.info(f"Attachments: {len(ticket_data.attachments)} files")
                logger.info(f"Comments: {len(ticket_data.comments)} comments")
                logger.info(f"Sprint: {ticket_data.sprint or 'None'}")
                logger.info(f"Epic Link: {ticket_data.epic_link or 'None'}")
                logger.info(f"Description: {ticket_data.description[:200]}{'...' if len(ticket_data.description) > 200 else ''}")
                logger.info(f"=== End Ticket Details ===")
                return ticket_data
            else:
                logger.error(f"Failed to fetch real ticket {ticket_id}")
                raise Exception(f"Unable to fetch Jira ticket {ticket_id} - API request failed")
                
        except Exception as e:
            logger.error(f"Error fetching ticket {ticket_id}: {str(e)}")
            raise Exception(f"Unable to fetch Jira ticket {ticket_id}: {str(e)}")
    
    async def _fetch_real_ticket(self, ticket_id: str) -> Optional[JiraTicketData]:
        """Fetch real Jira ticket data"""
        url = f"{self.base_url}/rest/api/2/issue/{ticket_id}?expand=changelog"
        
        logger.info(f"Attempting to fetch real Jira ticket from: {url}")
        logger.info(f"Using credentials: {self.username}")
        
        try:
            # Use asyncio to make the request non-blocking
            loop = asyncio.get_event_loop()
            logger.info(f"Making HTTP request to Jira API...")
            
            response = await loop.run_in_executor(
                None, 
                lambda: requests.get(url, headers=self.headers, auth=self.auth, timeout=30)
            )
            
            logger.info(f"Jira API response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Successfully fetched real Jira ticket data for {ticket_id}")
                return self._parse_ticket_data(data)
            elif response.status_code == 403:
                logger.error(f"Jira API authentication failed (403): Check credentials for {ticket_id}")
                logger.error(f"Response text: {response.text}")
                logger.info(f"Using mock data for ticket: {ticket_id}")
                return None
            elif response.status_code == 404:
                logger.error(f"Jira ticket not found (404): {ticket_id}")
                logger.error(f"Response text: {response.text}")
                logger.info(f"Using mock data for ticket: {ticket_id}")
                return None
            else:
                logger.error(f"Jira API error {response.status_code}: {response.text}")
                logger.info(f"Using mock data for ticket: {ticket_id}")
                return None
                
        except requests.exceptions.Timeout:
            logger.error(f"Jira API request timed out for {ticket_id}")
            logger.info(f"Using mock data for ticket: {ticket_id}")
            return None
        except requests.exceptions.ConnectionError as e:
            logger.error(f"Jira API connection error for {ticket_id}: {str(e)}")
            logger.info(f"Using mock data for ticket: {ticket_id}")
            return None
        except Exception as e:
            logger.error(f"Exception fetching real ticket: {str(e)}")
            logger.info(f"Using mock data for ticket: {ticket_id}")
            return None
    
    def _parse_ticket_data(self, data: Dict[str, Any]) -> JiraTicketData:
        """Parse raw Jira API response into structured data"""
        fields = data.get('fields', {})
        
        # Extract components with better error handling
        components = []
        for comp in fields.get('components', []):
            components.append({
                'id': comp.get('id', ''),
                'name': comp.get('name', ''),
                'description': comp.get('description', '')
            })
        
        # Extract comments with better formatting
        comments = []
        if 'comment' in fields and 'comments' in fields['comment']:
            for comment in fields['comment']['comments']:
                author_name = comment.get('author', {}).get('displayName', 'Unknown')
                body = comment.get('body', '').replace('\r\n', '\n').replace('\r', '\n')
                comments.append({
                    'id': comment.get('id', ''),
                    'author': comment.get('author', {}),
                    'body': body,
                    'created': comment.get('created', ''),
                    'updated': comment.get('updated', ''),
                    'author_name': author_name
                })
        
        # Extract attachments with better info
        attachments = []
        for attachment in fields.get('attachment', []):
            attachments.append({
                'id': attachment.get('id', ''),
                'filename': attachment.get('filename', ''),
                'size': attachment.get('size', 0),
                'mimeType': attachment.get('mimeType', ''),
                'created': attachment.get('created', ''),
                'author': attachment.get('author', {}),
                'url': f"https://jira.telekom.de/secure/attachment/{attachment.get('id', '')}/{attachment.get('filename', '')}"
            })
        
        # Extract sprint information
        sprint_info = ""
        if 'customfield_10015' in fields and fields['customfield_10015']:
            sprint_info = str(fields['customfield_10015'])
        
        # Extract epic link
        epic_link = fields.get('customfield_10014', '')
        
        # Create a comprehensive description
        description = fields.get('description', '')
        if not description:
            # If no description, use summary
            description = fields.get('summary', '')
        
        # Format description for better readability
        if description:
            description = description.replace('\r\n', '\n').replace('\r', '\n')
        
        # Create ticket data with additional fields
        ticket_data = JiraTicketData(
            key=data.get('key', ''),
            summary=fields.get('summary', ''),
            description=description,
            status=fields.get('status', {}).get('name', ''),
            priority=fields.get('priority', {}).get('name', ''),
            assignee=fields.get('assignee', {}),
            reporter=fields.get('reporter', {}),
            created=fields.get('created', ''),
            updated=fields.get('updated', ''),
            labels=fields.get('labels', []),
            components=components,
            attachments=attachments,
            comments=comments,
            issuetype=fields.get('issuetype', {}),
            project=fields.get('project', {}),
            environment=fields.get('environment', ''),
            duedate=fields.get('duedate'),
            epic_link=epic_link,
            sprint=sprint_info
        )
        
        # Add additional fields as attributes for HSD ticket creation
        ticket_data.story_points = fields.get('customfield_10002', '')  # Story points
        ticket_data.delivery_page = fields.get('customfield_10501', '')  # Delivery page
        ticket_data.value_stream = fields.get('customfield_10502', '')  # Value stream
        ticket_data.resolution = fields.get('resolution', {}).get('name', '') if fields.get('resolution') else ''
        ticket_data.current_priority = fields.get('customfield_10003', '')  # Current Priority
        
        return ticket_data
    

    
    async def create_datadev_ticket(self, prd_data: Dict[str, Any], source_ticket_key: str, source_ticket_data: JiraTicketData) -> Optional[str]:
        """Create a DATADEV ticket based on PRD data"""
        try:
            # Extract sprint from source ticket
            sprint = None
            if source_ticket_data.sprint:
                sprint = source_ticket_data.sprint
            
            # Prepare ticket data
            ticket_data = {
                "fields": {
                    "project": {
                        "key": "DATADEV"
                    },
                    "summary": f"Implement {prd_data.get('title', 'Feature')} - {source_ticket_key}",
                    "description": self._format_datadev_description(prd_data, source_ticket_key),
                    "issuetype": {
                        "name": "Task"
                    },
                    "priority": {
                        "name": "Medium"
                    },
                    "labels": ["OneApp", "data", "PRD-Generated"],
                    "components": [],
                    "customfield_10015": sprint,  # Sprint field
                    "customfield_10014": source_ticket_key,  # Epic link or reference
                }
            }
            
            # Create the ticket
            url = f"{self.base_url}/rest/api/2/issue"
            
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: requests.post(
                    url,
                    json=ticket_data,
                    auth=self.auth,
                    headers=self.headers,
                    timeout=30
                )
            )
            
            if response.status_code == 201:
                created_ticket = response.json()
                ticket_key = created_ticket['key']
                logger.info(f"Successfully created DATADEV ticket: {ticket_key}")
                
                # Create link to source ticket
                await self._create_ticket_link(ticket_key, source_ticket_key)
                
                return ticket_key
            else:
                logger.error(f"Failed to create DATADEV ticket: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error creating DATADEV ticket: {str(e)}")
            return None

    async def create_hsd_ticket(self, source_ticket_data: JiraTicketData) -> Optional[str]:
        """Create an HSD ticket based on source ticket data"""
        try:
            # Prepare detailed description from source ticket
            description = self._format_hsd_description(source_ticket_data)
            
            # Prepare ticket data using the HSD project and curl structure
            ticket_data = {
                "fields": {
                    "project": {
                        "key": "HSD"  # Changed to HSD project as requested
                    },
                    "summary": f"HSD Implementation: {source_ticket_data.summary}",
                    "description": description,
                    "issuetype": {
                        "name": "Task"
                    },
                    "priority": {
                        "name": source_ticket_data.priority or "Medium"
                    },
                    "labels": [
                        "HSD-Generated",
                        "OneApp",
                        f"Source-{source_ticket_data.key}"
                    ] + (source_ticket_data.labels or []),
                    "customfield_74704": [
                        { "value": "OneTV" }
                    ]
                }
            }
            
            # Add components if available from source ticket
            if source_ticket_data.components:
                ticket_data["fields"]["components"] = [
                    {"name": comp.get("name", comp)} if isinstance(comp, dict) else {"name": str(comp)}
                    for comp in source_ticket_data.components
                ]
            
            # Add sprint if available from source ticket
            if source_ticket_data.sprint:
                ticket_data["fields"]["customfield_10015"] = source_ticket_data.sprint
            
            # Add story points if available (from screenshot field "Story Points: 5")
            if hasattr(source_ticket_data, 'story_points') and source_ticket_data.story_points:
                ticket_data["fields"]["customfield_10002"] = source_ticket_data.story_points
            
            # Add delivery page link if available
            if hasattr(source_ticket_data, 'delivery_page') and source_ticket_data.delivery_page:
                ticket_data["fields"]["customfield_10501"] = source_ticket_data.delivery_page
            
            # Add value stream if available
            if hasattr(source_ticket_data, 'value_stream') and source_ticket_data.value_stream:
                ticket_data["fields"]["customfield_10502"] = source_ticket_data.value_stream
            
            # Create the ticket
            url = f"{self.base_url}/rest/api/2/issue"
            
            # Use the authorization from the curl example
            auth_headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Basic YWpheS5rdW1hcjFAdGVsZWtvbS1kaWdpdGFsLmNvbTpSTlBJQ1NOVkdLTFc3REI2SlhBVFBXTjVQSFhLNE8zRDYzUFdZTkJVRTZTVExNRFdGRjZHMzZGSkpDVEZHTTMyQk1TUjNKWlVRSEFLU1VXRlFXVklYQkZXMk9RVDQzRk9JSVJZRklXV0xWQTZTT1JQN0ZVQkk3SEgyUTRHSVVWUA==',
                'Cookie': 'AWSALB=atEnLmP0FtpmWzxawIrjGTzogWsZT6XGnxCPNZPAh1WZ/yms2+LxK4ACChRd+FjeVXVvqCVG2Q6f4f96JIDG6I82FWSanBrGPAfPYKr5Iyjt0PoYRYYl79tIPjWz; AWSALBCORS=atEnLmP0FtpmWzxawIrjGTzogWsZT6XGnxCPNZPAh1WZ/yms2+LxK4ACChRd+FjeVXVvqCVG2Q6f4f96JIDG6I82FWSanBrGPAfPYKr5Iyjt0PoYRYYl79tIPjWz; JSESSIONID=DC00F38EDFA051B04272753706F61940; atlassian.xsrf.token=AREI-Y2RZ-7GF0-NRGB_90f06cf67e9a41bb5c7f15285f69132eb5ab1ad1_lin; AWSALB=OJwCoFRxc/JdodBetXe/AnsAJJ9PUXetLxuGaVpcqM6ayZu6qBWz3GZvndInwBZMbVlHpL4g9ESHGgka7stUjSbufmvqhyrhiCeSriQV0Bb1T1k6A3EWG1GxGpPO; AWSALBCORS=OJwCoFRxc/JdodBetXe/AnsAJJ9PUXetLxuGaVpcqM6ayZu6qBWz3GZvndInwBZMbVlHpL4g9ESHGgka7stUjSbufmvqhyrhiCeSriQV0Bb1T1k6A3EWG1GxGpPO; JSESSIONID=A2FE62164A4587E948E008D9A72CCB3F; atlassian.xsrf.token=AREI-Y2RZ-7GF0-NRGB_6d278e44a5fcdd8e3d830cc019a925ef3f193bd4_lin'
            }
            
            logger.info(f"Creating HSD ticket with data: {ticket_data}")
            
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: requests.post(
                    url,
                    json=ticket_data,
                    headers=auth_headers,
                    timeout=30
                )
            )
            
            logger.info(f"HSD ticket creation response: {response.status_code}")
            
            if response.status_code == 201:
                created_ticket = response.json()
                ticket_key = created_ticket['key']
                logger.info(f"Successfully created HSD ticket: {ticket_key}")
                
                # Create link to source ticket
                await self._create_ticket_link(ticket_key, source_ticket_data.key)
                
                return ticket_key
            else:
                logger.error(f"Failed to create HSD ticket: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error creating HSD ticket: {str(e)}")
            return None
    
    def _format_hsd_description(self, source_ticket_data: JiraTicketData) -> str:
        """Format detailed description for HSD ticket based on source ticket"""
        description_parts = [
            f"# HSD Implementation for {source_ticket_data.key}",
            "",
            f"## Source Ticket Information",
            f"- **Original Ticket**: {source_ticket_data.key}",
            f"- **Type**: {source_ticket_data.issuetype.get('name', 'N/A')}",
            f"- **Priority**: {source_ticket_data.priority}",
            f"- **Status**: {source_ticket_data.status}",
            f"- **Resolution**: {getattr(source_ticket_data, 'resolution', 'N/A')}",
            f"- **Project**: {source_ticket_data.project.get('name', 'N/A')}",
            ""
        ]
        
        # Add story points if available
        if hasattr(source_ticket_data, 'story_points') and source_ticket_data.story_points:
            description_parts.extend([
                f"- **Story Points**: {source_ticket_data.story_points}",
                ""
            ])
        
        # Add current priority if different from main priority
        if hasattr(source_ticket_data, 'current_priority') and source_ticket_data.current_priority:
            description_parts.extend([
                f"- **Current Priority**: {source_ticket_data.current_priority}",
                ""
            ])
        
        description_parts.extend([
            f"## Original Summary",
            source_ticket_data.summary,
            "",
            f"## Original Description",
            source_ticket_data.description or "No description provided",
            ""
        ])
        
        # Add delivery page information if available
        if hasattr(source_ticket_data, 'delivery_page') and source_ticket_data.delivery_page:
            description_parts.extend([
                f"## Delivery Information",
                f"- **Delivery Page**: {source_ticket_data.delivery_page}",
                ""
            ])
        
        # Add value stream information if available
        if hasattr(source_ticket_data, 'value_stream') and source_ticket_data.value_stream:
            description_parts.extend([
                f"- **Value Stream**: {source_ticket_data.value_stream}",
                ""
            ])
        
        # Add assignee information
        if source_ticket_data.assignee:
            description_parts.extend([
                f"## Assignee Information",
                f"- **Assignee**: {source_ticket_data.assignee.get('displayName', 'N/A')}",
                f"- **Email**: {source_ticket_data.assignee.get('emailAddress', 'N/A')}",
                ""
            ])
        
        # Add reporter information
        if source_ticket_data.reporter:
            description_parts.extend([
                f"## Reporter Information",
                f"- **Reporter**: {source_ticket_data.reporter.get('displayName', 'N/A')}",
                f"- **Email**: {source_ticket_data.reporter.get('emailAddress', 'N/A')}",
                ""
            ])
        
        # Add labels
        if source_ticket_data.labels:
            description_parts.extend([
                f"## Labels",
                f"- {', '.join(source_ticket_data.labels)}",
                ""
            ])
        
        # Add components
        if source_ticket_data.components:
            component_names = [
                comp.get('name', str(comp)) if isinstance(comp, dict) else str(comp)
                for comp in source_ticket_data.components
            ]
            description_parts.extend([
                f"## Components",
                f"- {', '.join(component_names)}",
                ""
            ])
        
        # Add sprint information
        if source_ticket_data.sprint:
            description_parts.extend([
                f"## Sprint Information",
                f"- **Sprint**: {source_ticket_data.sprint}",
                ""
            ])
        
        # Add dates
        description_parts.extend([
            f"## Timeline",
            f"- **Created**: {source_ticket_data.created}",
            f"- **Updated**: {source_ticket_data.updated}",
        ])
        
        if source_ticket_data.duedate:
            description_parts.append(f"- **Due Date**: {source_ticket_data.duedate}")
        
        description_parts.extend([
            "",
            f"## Attachments Information",
            f"- **Number of attachments**: {len(source_ticket_data.attachments)}",
        ])
        
        if source_ticket_data.attachments:
            description_parts.append("- **Attachment files**:")
            for attachment in source_ticket_data.attachments[:5]:  # Limit to first 5
                filename = attachment.get('filename', 'Unknown')
                mime_type = attachment.get('mimeType', 'Unknown')
                description_parts.append(f"  - {filename} ({mime_type})")
            
            if len(source_ticket_data.attachments) > 5:
                description_parts.append(f"  - ... and {len(source_ticket_data.attachments) - 5} more attachments")
        
        description_parts.extend([
            "",
            f"## Comments Summary",
            f"- **Number of comments**: {len(source_ticket_data.comments)}",
            "",
            f"---",
            f"*This HSD ticket was automatically created from {source_ticket_data.key} with all relevant details transferred.*"
        ])
        
        return "\n".join(description_parts)
    
    def _format_datadev_description(self, prd_data: Dict[str, Any], source_ticket_key: str) -> str:
        """Format description for DATADEV ticket"""
        description = f"""*Tasks*:
# Implement {prd_data.get('title', 'Feature')} based on PRD requirements
# Develop data processing components as specified in technical requirements
# Create necessary API endpoints and data models
# Implement data validation and error handling

*Pre-requisites*:
# Review PRD document for {source_ticket_key}
# Understand technical requirements and architecture
# Coordinate with development team

*Benefits*:
# Automated data processing implementation
# Improved system functionality
# Enhanced user experience

*Documentation*:
# PRD Reference: {source_ticket_key}
# Technical Requirements: {', '.join(prd_data.get('technical_requirements', []))}
# User Stories: {', '.join(prd_data.get('user_stories', []))}

*Success Metrics*:
{chr(10).join(f"# {metric}" for metric in prd_data.get('success_metrics', []))}

*Non-Functional Requirements*:
{chr(10).join(f"# {key}: {value}" for key, value in prd_data.get('non_functional_requirements', {}).items())}

*Out of Scope*:
{chr(10).join(f"# {item}" for item in prd_data.get('out_of_scope', []))}
"""
        return description
    
    async def _create_ticket_link(self, datadev_key: str, source_key: str):
        """Create a link between DATADEV and source ticket"""
        try:
            link_data = {
                "type": {
                    "name": "Reference"
                },
                "inwardIssue": {
                    "key": source_key
                },
                "outwardIssue": {
                    "key": datadev_key
                }
            }
            
            url = f"{self.base_url}/rest/api/2/issueLink"
            
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: requests.post(
                    url,
                    json=link_data,
                    auth=self.auth,
                    headers=self.headers,
                    timeout=30
                )
            )
            
            if response.status_code == 201:
                logger.info(f"Successfully linked {datadev_key} to {source_key}")
            else:
                logger.warning(f"Failed to create ticket link: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error creating ticket link: {str(e)}")

    async def close(self):
        """Cleanup resources"""
        pass


# Global Jira client instance
jira_client = JiraClient()