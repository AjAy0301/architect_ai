#!/usr/bin/env python3
"""
Startup script for Python LangChain Agents server
"""

import os
import sys
import subprocess

def install_requirements():
    """Install Python requirements"""
    print("Installing Python requirements...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])

def start_server():
    """Start the FastAPI server"""
    port = os.getenv("PYTHON_AGENTS_PORT", "8001")
    print(f"Starting Python LangChain Agents server on port {port}")
    
    # Start uvicorn server
    subprocess.run([
        sys.executable, "-m", "uvicorn",
        "main:app",
        "--host", "0.0.0.0",
        "--port", port,
        "--reload",
        "--log-level", "info"
    ])

if __name__ == "__main__":
    # Check if requirements should be installed
    if "--install" in sys.argv:
        install_requirements()
    
    start_server()