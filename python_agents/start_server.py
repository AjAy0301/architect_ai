#!/usr/bin/env python3
"""
FastAPI server for Python LangChain Agents
"""

import os
import logging
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Initialize FastAPI app
app = FastAPI()

# Configure CORS
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:8000",
    "*",  # WARNING: Allow all origins. ONLY for development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize recent workflows and recent HSD tickets
recent_workflows = []
recent_hsd_tickets = []

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# HSD Generation endpoint
@app.post("/generate-hsd")
async def generate_hsd(request: dict):
    global recent_hsd_tickets

    try:
        jira_ticket_id = request.get('jira_ticket_id')
        if not jira_ticket_id:
            raise ValueError("jira_ticket_id is required")

        logger.info(f"Starting HSD generation for ticket: {jira_ticket_id}")

        # Use the LangChainJiraAnalystAgent for HSD generation
        from agents import jira_analyst_agent

        # Create progress callback
        async def progress_callback(agent, message, progress):
            logger.info(f"[{agent}] {message} ({progress}%)")

        # Execute the agent with ticket ID
        result = await jira_analyst_agent.execute(
            {'jira_ticket_id': jira_ticket_id}, 
            progress_callback
        )

        # Store in recent tickets
        if 'error' not in result:
            recent_hsd_tickets.insert(0, result)
            # Keep only last 10 tickets
            recent_hsd_tickets = recent_hsd_tickets[:10]

        logger.info(f"HSD generation completed for ticket: {jira_ticket_id}")
        return result

    except Exception as e:
        logger.error(f"HSD generation failed: {str(e)}")
        return {"error": f"HSD generation failed: {str(e)}"}

# Recent HSD tickets endpoint
@app.get("/recent-hsd-tickets")
async def get_recent_hsd_tickets():
    return recent_hsd_tickets