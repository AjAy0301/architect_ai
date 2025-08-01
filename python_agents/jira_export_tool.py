#!/usr/bin/env python3
"""
Standalone Jira Export Tool
Fetches Jira ticket data and exports to Excel with image attachments
"""

import requests
import pandas as pd
import os
import re
from dotenv import load_dotenv

def get_jira_details_to_excel(issue_key, output_dir="jira_exports"):
    """
    Fetches details for a given Jira issue, saves them to an Excel file,
    and downloads all image attachments.
    """
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # --- 1. Configuration and Authentication ---
    load_dotenv()
    jira_email = os.getenv("JIRA_EMAIL")
    jira_api_token = os.getenv("JIRA_API_TOKEN")
    jira_base_url = "https://jira.telekom.de"

    if not jira_email or not jira_api_token:
        print("Error: JIRA_EMAIL or JIRA_API_TOKEN not found in .env file.")
        return

    api_url = f"{jira_base_url}/rest/api/2/issue/{issue_key}"
    auth = (jira_email, jira_api_token)
    headers = {"Accept": "application/json"}

    print(f"▶️  Fetching data for issue: {issue_key}...")

    # --- 2. Make API Request ---
    try:
        response = requests.get(api_url, headers=headers, auth=auth)
        response.raise_for_status()  # Raises an exception for bad status codes (4xx or 5xx)
    except requests.exceptions.HTTPError as err:
        print(f"HTTP Error: {err.response.status_code} - {err.response.reason}")
        if err.response.status_code == 401:
            print("   Please check your JIRA_EMAIL and JIRA_API_TOKEN in the .env file.")
        elif err.response.status_code == 404:
            print(f"   Issue '{issue_key}' not found. Please check the key.")
        return
    except requests.exceptions.RequestException as e:
        print(f"❌ A network error occurred: {e}")
        return

    data = response.json()
    fields = data.get('fields', {})
    print("✅ Data fetched successfully.")

    # --- 3. Extract Key Information ---

    # Basic fields
    description = fields.get('description', 'N/A')
    summary = fields.get('summary', 'N/A')
    
    # Value Stream (from customfield_23614)
    value_stream_list = fields.get('customfield_23614', [])
    value_stream = value_stream_list[0].get('value') if value_stream_list else 'N/A'

    # Design Link (from customfield_74641 or customfield_12310)
    design_link = fields.get('customfield_74641') or fields.get('customfield_12310', 'N/A')

    # Sprint (from customfield_12810)
    sprint_list = fields.get('customfield_12810', [])
    sprint_name = 'N/A'
    if sprint_list:
        # The sprint info is a string, so we parse it with regex
        sprint_string = sprint_list[0]
        match = re.search(r"name=([^,]+)", sprint_string)
        if match:
            sprint_name = match.group(1)

    # --- 4. Create DataFrame for Main Details ---
    details_data = {
        "Field": ["Issue Key", "Summary", "Description", "Value Stream", "Design Link", "Sprint"],
        "Value": [data.get('key', 'N/A'), summary, description, value_stream, design_link, sprint_name]
    }
    df_details = pd.DataFrame(details_data)

    # --- 5. Extract Issue Links ---
    issuelinks_data = []
    for link in fields.get('issuelinks', []):
        link_type = link.get('type', {}).get('name')
        if 'inwardIssue' in link:
            direction = link.get('type', {}).get('inward')
            linked_issue = link.get('inwardIssue', {})
        else: # 'outwardIssue'
            direction = link.get('type', {}).get('outward')
            linked_issue = link.get('outwardIssue', {})
            
        issuelinks_data.append({
            "Link Type": link_type,
            "Direction": direction,
            "Issue Key": linked_issue.get('key'),
            "Summary": linked_issue.get('fields', {}).get('summary'),
            "Status": linked_issue.get('fields', {}).get('status', {}).get('name')
        })
    df_links = pd.DataFrame(issuelinks_data)

    # --- 6. Extract and Download Attachments ---
    attachments_dir = os.path.join(output_dir, f"attachments_{issue_key}")
    os.makedirs(attachments_dir, exist_ok=True)
    attachments_data = []

    print(f"🗂️  Processing attachments...")
    for attachment in fields.get('attachment', []):
        filename = attachment.get('filename')
        mime_type = attachment.get('mimeType')
        content_url = attachment.get('content')
        download_status = "Skipped (not an image)"

        # Download if it's an image
        if mime_type and 'image' in mime_type:
            try:
                img_response = requests.get(content_url, auth=auth, stream=True)
                img_response.raise_for_status()
                with open(os.path.join(attachments_dir, filename), 'wb') as f:
                    for chunk in img_response.iter_content(chunk_size=8192):
                        f.write(chunk)
                download_status = f"Success - saved in '{attachments_dir}/'"
            except Exception as e:
                download_status = f"Download Failed: {e}"
        
        attachments_data.append({
            "Filename": filename,
            "MIME Type": mime_type,
            "URL": content_url,
            "Download Status": download_status
        })
    df_attachments = pd.DataFrame(attachments_data)
    print("✅ Attachments processed.")

    # --- 7. Write all DataFrames to a single Excel file ---
    output_filename = os.path.join(output_dir, f"{issue_key}_Jira_Details.xlsx")
    with pd.ExcelWriter(output_filename, engine='openpyxl') as writer:
        df_details.to_excel(writer, sheet_name='Ticket Details', index=False)
        df_links.to_excel(writer, sheet_name='Issue Links', index=False)
        df_attachments.to_excel(writer, sheet_name='Attachments', index=False)
        
        # Auto-adjust column widths for better readability
        for sheet_name in writer.sheets:
            worksheet = writer.sheets[sheet_name]
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(cell.value)
                    except:
                        pass
                adjusted_width = (max_length + 2)
                worksheet.column_dimensions[column_letter].width = adjusted_width

    print(f"\n🎉 Success! All details have been exported.")
    print(f"📄 Excel file saved as: {output_filename}")
    if any('image' in str(att.get('mimeType')) for att in fields.get('attachment', [])):
        print(f"🖼️  Image attachments downloaded to: {attachments_dir}/")
    
    return output_filename


if __name__ == "__main__":
    issue_key_input = input("Enter the Jira issue key (e.g., OAUS-4739 or DATAQA-7443): ")
    if issue_key_input:
        result = get_jira_details_to_excel(issue_key_input.strip())
        print(f"Export completed: {result}")
    else:
        print("No issue key entered. Exiting.")