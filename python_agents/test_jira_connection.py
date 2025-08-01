#!/usr/bin/env python3
"""Test Jira API connection"""

import asyncio
import requests
import config

async def test_jira_connection():
    """Test the Jira API connection"""
    print("=== Testing Jira API Connection ===")
    
    # Test credentials
    username = config.os_username
    password = config.os_password
    base_url = config.base_url.rstrip('/')
    
    print(f"Base URL: {base_url}")
    print(f"Username: {username}")
    print(f"Password: {'*' * len(password)}")
    
    # Test URL
    test_url = f"{base_url}/rest/api/2/issue/OAUS-4739"
    print(f"Test URL: {test_url}")
    
    try:
        print("\n=== Making HTTP Request ===")
        response = requests.get(
            test_url,
            auth=(username, password),
            headers={'Accept': 'application/json'},
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n=== Success! Ticket Data ===")
            print(f"Key: {data.get('key', 'N/A')}")
            print(f"Summary: {data.get('fields', {}).get('summary', 'N/A')}")
            print(f"Status: {data.get('fields', {}).get('status', {}).get('name', 'N/A')}")
            print(f"Type: {data.get('fields', {}).get('issuetype', {}).get('name', 'N/A')}")
        else:
            print(f"\n=== Error Response ===")
            print(f"Response Text: {response.text}")
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out")
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Connection error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    asyncio.run(test_jira_connection()) 