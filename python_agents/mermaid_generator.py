
import json
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class MermaidDiagram:
    chart: str
    title: str
    description: str

class MermaidGenerator:
    """Generate Mermaid diagrams from PRD and architecture data"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def generate_sequence_diagram(self, user_story: str, components: List[str] = None) -> MermaidDiagram:
        """Generate a sequence diagram from user story"""
        if not components:
            components = ["User", "System", "Backend"]
        
        title = f"Sequence Diagram: {user_story[:50]}..."
        
        # Create basic sequence diagram
        chart = "sequenceDiagram\n"
        
        # Add participants
        for component in components[:4]:  # Limit to 4 participants
            chart += f"    participant {component.replace(' ', '')}\n"
        
        # Add interactions based on user story content
        if "login" in user_story.lower():
            chart += """    User->>System: Login Request
    System->>Backend: Authenticate User
    Backend-->>System: Authentication Result
    System-->>User: Login Response
"""
        elif "payment" in user_story.lower():
            chart += """    User->>System: Payment Request
    System->>Backend: Process Payment
    Backend->>PaymentGateway: Charge Card
    PaymentGateway-->>Backend: Payment Status
    Backend-->>System: Transaction Result
    System-->>User: Payment Confirmation
"""
        elif "search" in user_story.lower():
            chart += """    User->>System: Search Query
    System->>Backend: Execute Search
    Backend->>Database: Query Data
    Database-->>Backend: Search Results
    Backend-->>System: Formatted Results
    System-->>User: Display Results
"""
        else:
            # Generic flow
            chart += """    User->>System: User Action
    System->>Backend: Process Request
    Backend-->>System: Response Data
    System-->>User: Updated View
"""
        
        return MermaidDiagram(
            chart=chart,
            title=title,
            description=user_story
        )
    
    def generate_architecture_diagram(self, components: List[Dict[str, Any]]) -> MermaidDiagram:
        """Generate an architecture diagram from components"""
        title = "System Architecture Overview"
        
        chart = "graph TD\n"
        
        # Add nodes for each component
        for i, component in enumerate(components):
            node_id = f"A{i}"
            component_name = component.get('name', f'Component {i}')[:20]
            component_type = component.get('type', 'service')
            
            # Style based on component type
            if component_type == 'frontend':
                chart += f"    {node_id}[{component_name}]\n"
                chart += f"    {node_id} --> B0[Backend Services]\n"
            elif component_type == 'api':
                chart += f"    {node_id}{{{{API: {component_name}}}}}\n"
            elif component_type == 'database':
                chart += f"    {node_id}[({component_name})]\n"
            else:
                chart += f"    {node_id}[{component_name}]\n"
        
        # Add some basic connections
        if len(components) > 1:
            for i in range(len(components) - 1):
                chart += f"    A{i} --> A{i+1}\n"
        
        return MermaidDiagram(
            chart=chart,
            title=title,
            description="High-level system architecture showing component relationships"
        )
    
    def generate_workflow_diagram(self, user_stories: List[str]) -> MermaidDiagram:
        """Generate a workflow diagram from user stories"""
        title = "User Workflow"
        
        chart = "flowchart LR\n"
        
        # Create workflow steps from user stories
        for i, story in enumerate(user_stories[:6]):  # Limit to 6 steps
            step_name = self._extract_action_from_story(story)
            chart += f"    A{i}[{step_name}]\n"
            
            if i > 0:
                chart += f"    A{i-1} --> A{i}\n"
        
        # Add decision points if multiple stories
        if len(user_stories) > 2:
            chart += f"    A1 --> Decision{{Success?}}\n"
            chart += f"    Decision -->|Yes| A2\n"
            chart += f"    Decision -->|No| Error[Error State]\n"
        
        return MermaidDiagram(
            chart=chart,
            title=title,
            description="User workflow showing the sequence of actions"
        )
    
    def generate_impact_diagram(self, impact_analysis: List[Dict[str, Any]]) -> MermaidDiagram:
        """Generate an impact analysis diagram"""
        title = "Impact Analysis"
        
        chart = "graph TB\n"
        
        # Group by risk level
        high_risk = [item for item in impact_analysis if item.get('riskLevel') == 'high']
        medium_risk = [item for item in impact_analysis if item.get('riskLevel') == 'medium']
        low_risk = [item for item in impact_analysis if item.get('riskLevel') == 'low']
        
        chart += "    subgraph High Risk\n"
        for i, item in enumerate(high_risk):
            component = item.get('component', f'Component {i}')[:15]
            chart += f"        H{i}[{component}]\n"
        chart += "    end\n"
        
        chart += "    subgraph Medium Risk\n"
        for i, item in enumerate(medium_risk):
            component = item.get('component', f'Component {i}')[:15]
            chart += f"        M{i}[{component}]\n"
        chart += "    end\n"
        
        chart += "    subgraph Low Risk\n"
        for i, item in enumerate(low_risk):
            component = item.get('component', f'Component {i}')[:15]
            chart += f"        L{i}[{component}]\n"
        chart += "    end\n"
        
        # Add styling
        chart += """
    classDef highRisk fill:#ff6b6b,stroke:#d63031,color:#fff
    classDef mediumRisk fill:#fdcb6e,stroke:#e17055,color:#2d3436
    classDef lowRisk fill:#6c5ce7,stroke:#a29bfe,color:#fff
"""
        
        for i in range(len(high_risk)):
            chart += f"    class H{i} highRisk;\n"
        for i in range(len(medium_risk)):
            chart += f"    class M{i} mediumRisk;\n"
        for i in range(len(low_risk)):
            chart += f"    class L{i} lowRisk;\n"
        
        return MermaidDiagram(
            chart=chart,
            title=title,
            description="Visual representation of implementation risks and impacts"
        )
    
    def _extract_action_from_story(self, user_story: str) -> str:
        """Extract the main action from a user story"""
        # Simple extraction - look for "I want to" pattern
        story_lower = user_story.lower()
        
        if "i want to" in story_lower:
            start = story_lower.find("i want to") + 10
            end = story_lower.find(" so that", start)
            if end == -1:
                end = len(story_lower)
            action = user_story[start:end].strip()
            return action[:20] + "..." if len(action) > 20 else action
        
        # Fallback to first few words
        words = user_story.split()[:3]
        return " ".join(words) + "..."
    
    def render_mermaid_to_html(self, diagram: MermaidDiagram) -> str:
        """Render Mermaid diagram to HTML"""
        html = f"""
<div class="mermaid-container">
    <h3>{diagram.title}</h3>
    <p>{diagram.description}</p>
    <div class="mermaid">
{diagram.chart}
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
<script>
    mermaid.initialize({{ startOnLoad: true }});
</script>
"""
        return html

# Global instance
mermaid_generator = MermaidGenerator()
