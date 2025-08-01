"""Ticket Document Manager for organizing ticket-related files and attachments"""

import os
import asyncio
import aiohttp
import aiofiles
from datetime import datetime
from typing import Dict, Any, List, Optional
from pathlib import Path
import json
import logging

logger = logging.getLogger(__name__)


class TicketDocumentManager:
    """Manages ticket-specific folders and document organization"""
    
    def __init__(self, base_dir: str = "../ticket_docs"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(exist_ok=True)
    
    def create_ticket_folder(self, ticket_key: str) -> Path:
        """Create a folder for the specific ticket"""
        ticket_folder = self.base_dir / ticket_key
        ticket_folder.mkdir(exist_ok=True)
        
        # Create subdirectories
        (ticket_folder / "attachments").mkdir(exist_ok=True)
        (ticket_folder / "prd").mkdir(exist_ok=True)
        (ticket_folder / "metadata").mkdir(exist_ok=True)
        
        logger.info(f"Created ticket folder structure for {ticket_key}")
        return ticket_folder
    
    async def download_attachment(self, attachment: Dict[str, Any], ticket_folder: Path) -> Optional[str]:
        """Download an attachment from Jira"""
        try:
            attachment_id = attachment.get('id', '')
            filename = attachment.get('filename', '')
            url = attachment.get('url', '')
            
            if not url or not filename:
                logger.warning(f"Invalid attachment data: {attachment}")
                return None
            
            # Create safe filename
            safe_filename = self._sanitize_filename(filename)
            file_path = ticket_folder / "attachments" / safe_filename
            
            # Download file
            async with aiohttp.ClientSession() as session:
                async with session.get(url, auth=self._get_auth()) as response:
                    if response.status == 200:
                        async with aiofiles.open(file_path, 'wb') as f:
                            await f.write(await response.read())
                        
                        logger.info(f"Downloaded attachment: {filename}")
                        return str(file_path)
                    else:
                        logger.warning(f"Failed to download {filename}: {response.status}")
                        return None
                        
        except Exception as e:
            logger.error(f"Error downloading attachment {attachment.get('filename', '')}: {str(e)}")
            return None
    
    def _get_auth(self):
        """Get authentication for Jira API"""
        from config import os_username, os_password
        return aiohttp.BasicAuth(os_username, os_password)
    
    def _sanitize_filename(self, filename: str) -> str:
        """Sanitize filename for safe file system usage"""
        import re
        # Remove or replace unsafe characters
        safe_filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
        # Limit length
        if len(safe_filename) > 200:
            name, ext = os.path.splitext(safe_filename)
            safe_filename = name[:200-len(ext)] + ext
        return safe_filename
    
    async def save_ticket_metadata(self, ticket_data: Dict[str, Any], ticket_folder: Path):
        """Save ticket metadata as JSON"""
        try:
            metadata_file = ticket_folder / "metadata" / "ticket_data.json"
            async with aiofiles.open(metadata_file, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(ticket_data, indent=2, ensure_ascii=False))
            
            logger.info(f"Saved ticket metadata for {ticket_data.get('key', '')}")
        except Exception as e:
            logger.error(f"Error saving ticket metadata: {str(e)}")
    
    async def save_prd_documents(self, prd_data: Dict[str, Any], ticket_key: str, ticket_folder: Path):
        """Save PRD documents in ticket folder"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            # Save JSON PRD
            json_file = ticket_folder / "prd" / f"PRD_{ticket_key}_{timestamp}.json"
            async with aiofiles.open(json_file, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(prd_data, indent=2, ensure_ascii=False))
            
            # Save Markdown PRD
            md_file = ticket_folder / "prd" / f"PRD_{ticket_key}_{timestamp}.md"
            md_content = self._format_prd_as_markdown(prd_data, ticket_key)
            async with aiofiles.open(md_file, 'w', encoding='utf-8') as f:
                await f.write(md_content)
            
            logger.info(f"Saved PRD documents for {ticket_key}")
            
        except Exception as e:
            logger.error(f"Error saving PRD documents: {str(e)}")
    
    def _format_prd_as_markdown(self, prd_data: Dict[str, Any], ticket_key: str) -> str:
        """Format PRD data as markdown document"""
        md_content = f"""# Product Requirements Document (PRD)
**Ticket:** {ticket_key}
**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

## {prd_data.get('title', 'Product Requirements Document')}

### Introduction
{prd_data.get('introduction', 'No introduction provided.')}

### Problem Statement
{prd_data.get('problem_statement', 'No problem statement provided.')}

### User Stories
"""
        
        for story in prd_data.get('user_stories', []):
            md_content += f"- {story}\n"
        
        md_content += "\n### Technical Requirements\n"
        for req in prd_data.get('technical_requirements', []):
            md_content += f"- {req}\n"
        
        md_content += "\n### Non-Functional Requirements\n"
        for key, value in prd_data.get('non_functional_requirements', {}).items():
            md_content += f"- **{key}:** {value}\n"
        
        md_content += "\n### Out of Scope\n"
        for item in prd_data.get('out_of_scope', []):
            md_content += f"- {item}\n"
        
        md_content += "\n### Success Metrics\n"
        for metric in prd_data.get('success_metrics', []):
            md_content += f"- {metric}\n"
        
        return md_content
    
    async def process_ticket_documents(self, ticket_data: Dict[str, Any], prd_data: Optional[Dict[str, Any]] = None) -> Path:
        """Process all documents for a ticket"""
        ticket_key = ticket_data.get('key', 'unknown')
        logger.info(f"=== Processing Documents for Ticket {ticket_key} ===")
        
        ticket_folder = self.create_ticket_folder(ticket_key)
        logger.info(f"Created ticket folder: {ticket_folder}")
        
        # Save ticket metadata
        await self.save_ticket_metadata(ticket_data, ticket_folder)
        logger.info(f"Saved ticket metadata to: {ticket_folder}/metadata/ticket_data.json")
        
        # Download attachments
        attachments = ticket_data.get('attachments', [])
        downloaded_files = []
        
        logger.info(f"Found {len(attachments)} attachments to download")
        for i, attachment in enumerate(attachments):
            logger.info(f"Downloading attachment {i+1}/{len(attachments)}: {attachment.get('filename', 'unknown')}")
            file_path = await self.download_attachment(attachment, ticket_folder)
            if file_path:
                downloaded_files.append(file_path)
                logger.info(f"Successfully downloaded: {file_path}")
            else:
                logger.warning(f"Failed to download attachment: {attachment.get('filename', 'unknown')}")
        
        # Save PRD documents if provided
        if prd_data:
            await self.save_prd_documents(prd_data, ticket_key, ticket_folder)
            logger.info(f"Saved PRD documents to: {ticket_folder}/prd/")
        else:
            logger.info("No PRD data provided to save")
        
        # Create summary file
        await self._create_summary_file(ticket_folder, ticket_data, downloaded_files, prd_data)
        logger.info(f"Created summary file: {ticket_folder}/summary.json")
        
        logger.info(f"=== Completed Processing for Ticket {ticket_key} ===")
        logger.info(f"Total files created: {len(downloaded_files) + (2 if prd_data else 0) + 2}")  # attachments + PRD files + metadata + summary
        return ticket_folder
    
    async def _create_summary_file(self, ticket_folder: Path, ticket_data: Dict[str, Any], 
                                 downloaded_files: List[str], prd_data: Optional[Dict[str, Any]]):
        """Create a summary file with all document information"""
        try:
            summary = {
                "ticket_key": ticket_data.get('key', ''),
                "summary": ticket_data.get('summary', ''),
                "status": ticket_data.get('status', ''),
                "priority": ticket_data.get('priority', ''),
                "created": ticket_data.get('created', ''),
                "updated": ticket_data.get('updated', ''),
                "attachments_downloaded": len(downloaded_files),
                "attachment_files": downloaded_files,
                "prd_generated": prd_data is not None,
                "prd_title": prd_data.get('title', '') if prd_data else None,
                "folder_structure": {
                    "attachments": "attachments/",
                    "prd": "prd/",
                    "metadata": "metadata/"
                }
            }
            
            summary_file = ticket_folder / "summary.json"
            async with aiofiles.open(summary_file, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(summary, indent=2, ensure_ascii=False))
                
        except Exception as e:
            logger.error(f"Error creating summary file: {str(e)}")


# Global instance
ticket_doc_manager = TicketDocumentManager() 