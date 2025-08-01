
import asyncio
import aiohttp
import json
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass
import os
from base64 import b64encode

logger = logging.getLogger(__name__)

@dataclass
class ConfluenceConfig:
    base_url: str
    username: str
    api_token: str
    space_key: str

class ConfluenceClient:
    """Confluence API client for posting documents"""
    
    def __init__(self):
        self.config = self._load_config()
        self.session: Optional[aiohttp.ClientSession] = None
        self.logger = logging.getLogger(__name__)
    
    def _load_config(self) -> Optional[ConfluenceConfig]:
        """Load Confluence configuration from environment"""
        base_url = os.getenv('CONFLUENCE_BASE_URL')
        username = os.getenv('CONFLUENCE_USERNAME')
        api_token = os.getenv('CONFLUENCE_API_TOKEN')
        space_key = os.getenv('CONFLUENCE_SPACE_KEY', 'DEV')
        
        if not all([base_url, username, api_token]):
            self.logger.warning("Confluence configuration not complete. Using mock mode.")
            return None
        
        return ConfluenceConfig(
            base_url=base_url.rstrip('/'),
            username=username,
            api_token=api_token,
            space_key=space_key
        )
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session"""
        if not self.session:
            if self.config:
                auth_header = b64encode(f"{self.config.username}:{self.config.api_token}".encode()).decode()
                headers = {
                    'Authorization': f'Basic {auth_header}',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            else:
                headers = {'Content-Type': 'application/json'}
            
            self.session = aiohttp.ClientSession(headers=headers)
        
        return self.session
    
    async def create_page(self, title: str, content: str, parent_id: Optional[str] = None) -> Dict[str, Any]:
        """Create a new Confluence page"""
        if not self.config:
            return self._mock_create_page(title, content)
        
        try:
            session = await self._get_session()
            
            page_data = {
                "type": "page",
                "title": title,
                "space": {"key": self.config.space_key},
                "body": {
                    "storage": {
                        "value": self._markdown_to_confluence(content),
                        "representation": "storage"
                    }
                }
            }
            
            if parent_id:
                page_data["ancestors"] = [{"id": parent_id}]
            
            url = f"{self.config.base_url}/rest/api/content"
            
            async with session.post(url, json=page_data) as response:
                if response.status == 200:
                    result = await response.json()
                    self.logger.info(f"Successfully created Confluence page: {title}")
                    return {
                        "success": True,
                        "page_id": result.get('id'),
                        "page_url": f"{self.config.base_url}/pages/viewpage.action?pageId={result.get('id')}",
                        "title": title
                    }
                else:
                    error_text = await response.text()
                    self.logger.error(f"Failed to create Confluence page: {response.status} - {error_text}")
                    return {"success": False, "error": f"HTTP {response.status}: {error_text}"}
        
        except Exception as e:
            self.logger.error(f"Error creating Confluence page: {e}")
            return {"success": False, "error": str(e)}
    
    def _mock_create_page(self, title: str, content: str) -> Dict[str, Any]:
        """Mock page creation for testing"""
        self.logger.info(f"Mock: Creating Confluence page '{title}'")
        page_id = f"mock-{hash(title) % 10000}"
        
        return {
            "success": True,
            "page_id": page_id,
            "page_url": f"https://mock-confluence.com/pages/{page_id}",
            "title": title,
            "mock": True
        }
    
    def _markdown_to_confluence(self, markdown_content: str) -> str:
        """Convert markdown to Confluence storage format"""
        # Basic markdown to Confluence conversion
        confluence_content = markdown_content
        
        # Convert headers
        confluence_content = confluence_content.replace('# ', '<h1>').replace('\n# ', '</h1>\n<h1>')
        confluence_content = confluence_content.replace('## ', '<h2>').replace('\n## ', '</h2>\n<h2>')
        confluence_content = confluence_content.replace('### ', '<h3>').replace('\n### ', '</h3>\n<h3>')
        
        # Convert bold and italic
        confluence_content = confluence_content.replace('**', '<strong>').replace('**', '</strong>')
        confluence_content = confluence_content.replace('*', '<em>').replace('*', '</em>')
        
        # Convert lists
        lines = confluence_content.split('\n')
        processed_lines = []
        in_list = False
        
        for line in lines:
            if line.strip().startswith('- ') or line.strip().startswith('* '):
                if not in_list:
                    processed_lines.append('<ul>')
                    in_list = True
                processed_lines.append(f'<li>{line.strip()[2:]}</li>')
            elif line.strip().startswith(('1. ', '2. ', '3. ', '4. ', '5. ', '6. ', '7. ', '8. ', '9. ')):
                if not in_list:
                    processed_lines.append('<ol>')
                    in_list = True
                processed_lines.append(f'<li>{line.strip()[3:]}</li>')
            else:
                if in_list:
                    processed_lines.append('</ul>' if processed_lines[-2].startswith('<li>') else '</ol>')
                    in_list = False
                processed_lines.append(line)
        
        if in_list:
            processed_lines.append('</ul>')
        
        return '\n'.join(processed_lines)
    
    async def update_page(self, page_id: str, title: str, content: str, version: int) -> Dict[str, Any]:
        """Update an existing Confluence page"""
        if not self.config:
            return self._mock_update_page(page_id, title, content)
        
        try:
            session = await self._get_session()
            
            page_data = {
                "version": {"number": version + 1},
                "title": title,
                "type": "page",
                "body": {
                    "storage": {
                        "value": self._markdown_to_confluence(content),
                        "representation": "storage"
                    }
                }
            }
            
            url = f"{self.config.base_url}/rest/api/content/{page_id}"
            
            async with session.put(url, json=page_data) as response:
                if response.status == 200:
                    result = await response.json()
                    self.logger.info(f"Successfully updated Confluence page: {title}")
                    return {
                        "success": True,
                        "page_id": page_id,
                        "page_url": f"{self.config.base_url}/pages/viewpage.action?pageId={page_id}",
                        "title": title
                    }
                else:
                    error_text = await response.text()
                    self.logger.error(f"Failed to update Confluence page: {response.status} - {error_text}")
                    return {"success": False, "error": f"HTTP {response.status}: {error_text}"}
        
        except Exception as e:
            self.logger.error(f"Error updating Confluence page: {e}")
            return {"success": False, "error": str(e)}
    
    def _mock_update_page(self, page_id: str, title: str, content: str) -> Dict[str, Any]:
        """Mock page update for testing"""
        self.logger.info(f"Mock: Updating Confluence page '{title}' (ID: {page_id})")
        
        return {
            "success": True,
            "page_id": page_id,
            "page_url": f"https://mock-confluence.com/pages/{page_id}",
            "title": title,
            "mock": True
        }
    
    async def close(self):
        """Close the HTTP session"""
        if self.session:
            await self.session.close()

# Global instance
confluence_client = ConfluenceClient()
