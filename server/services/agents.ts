import { ollamaService } from './ollama.js';
import { vectorStore } from './vectorStore.js';
import { jiraClient, type JiraTicket } from './jiraClient.js';
import { prdSchema, type PRD } from '@shared/schema';

export interface WorkflowState {
  jiraTicketId: string;
  jiraTicketData?: JiraTicket;
  ragContext?: string[];
  impactAnalysis?: string;
  solutionArchitecture?: string;
  prd?: PRD;
  error?: string;
}

export class JiraAnalystAgent {
  async execute(state: WorkflowState): Promise<Partial<WorkflowState>> {
    try {
      console.log(`JiraAnalystAgent: Analyzing ticket ${state.jiraTicketId}`);
      
      // Fetch Jira ticket data
      const jiraTicketData = await jiraClient.getTicket(state.jiraTicketId);
      
      // Formulate query for RAG
      const query = `${jiraTicketData.summary}\n\n${jiraTicketData.description}`;
      
      // Retrieve context from vector store
      const searchResults = await vectorStore.searchSimilar(query, 5, {
        component: jiraTicketData.components[0] // Filter by component if available
      });
      
      const ragContext = searchResults.map(result => result.document.content);
      
      console.log(`JiraAnalystAgent: Retrieved ${ragContext.length} context documents`);
      
      return {
        jiraTicketData,
        ragContext,
      };
    } catch (error) {
      const errorMessage = `JiraAnalystAgent failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage);
      return { error: errorMessage };
    }
  }
}

export class TechnicalArchitectAgent {
  async execute(state: WorkflowState): Promise<Partial<WorkflowState>> {
    try {
      console.log('TechnicalArchitectAgent: Generating impact analysis and solution architecture');
      
      if (!state.jiraTicketData) {
        throw new Error('Jira ticket data not available');
      }

      const { jiraTicketData, ragContext } = state;
      
      const prompt = this.buildArchitectPrompt(jiraTicketData, ragContext || []);
      
      const response = await ollamaService.generateResponse(prompt);
      
      // Parse the response to extract impact analysis and solution architecture
      const sections = this.parseArchitectResponse(response);
      
      console.log('TechnicalArchitectAgent: Generated impact analysis and solution architecture');
      
      return {
        impactAnalysis: sections.impactAnalysis,
        solutionArchitecture: sections.solutionArchitecture,
      };
    } catch (error) {
      const errorMessage = `TechnicalArchitectAgent failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage);
      return { error: errorMessage };
    }
  }

  private buildArchitectPrompt(ticket: JiraTicket, ragContext: string[]): string {
    return `You are a world-class Staff Software Architect. Your task is to analyze a Jira ticket and provide a detailed impact analysis and a high-level solution architecture.

**Jira Ticket Details:**
Summary: ${ticket.summary}
Description: ${ticket.description}
Components: ${ticket.components.join(', ')}
Priority: ${ticket.priority}
Issue Type: ${ticket.issueType}
Acceptance Criteria: ${ticket.acceptanceCriteria || 'Not specified'}

**Context from Previous Releases:**
${ragContext.join('\n---\n')}

**Your Task:**
First, generate an **Impact Analysis**. Think step-by-step:
1. Identify all system components, services, or modules potentially affected by this change.
2. For each component, describe the nature of the impact (e.g., database schema change, API modification, UI update).
3. Assess the risk level (Low, Medium, High) for each impact and provide a brief justification.
4. Identify any dependencies on other teams or services.

Second, based on your impact analysis, generate a **Solution Architecture**.
1. Outline the proposed technical solution at a high level.
2. Describe any new components, database changes, or API endpoints required.
3. Provide a sequence diagram or a clear description of the data flow if applicable.
4. Mention any key technologies, libraries, or patterns that should be used.

Respond with two distinct sections in Markdown format: '## Impact Analysis' and '## Solution Architecture'.`;
  }

  private parseArchitectResponse(response: string): { impactAnalysis: string; solutionArchitecture: string } {
    const sections = response.split('## Solution Architecture');
    const impactAnalysis = sections[0].replace('## Impact Analysis', '').trim();
    const solutionArchitecture = sections[1] ? `## Solution Architecture${sections[1]}`.trim() : '';
    
    return { impactAnalysis, solutionArchitecture };
  }
}

export class ProductManagerAgent {
  async execute(state: WorkflowState): Promise<Partial<WorkflowState>> {
    try {
      console.log('ProductManagerAgent: Generating PRD');
      
      if (!state.jiraTicketData || !state.impactAnalysis || !state.solutionArchitecture) {
        throw new Error('Required data not available for PRD generation');
      }

      const prompt = this.buildPRDPrompt(state);
      
      const prd = await ollamaService.generateStructuredResponse<PRD>(prompt, prdSchema);
      
      console.log('ProductManagerAgent: Generated structured PRD');
      
      return { prd };
    } catch (error) {
      const errorMessage = `ProductManagerAgent failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage);
      return { error: errorMessage };
    }
  }

  private buildPRDPrompt(state: WorkflowState): string {
    return `You are a Senior Product Manager. Your task is to create a comprehensive Product Requirements Document (PRD) based on the provided Jira ticket, impact analysis, and solution architecture.

**Jira Ticket:**
Summary: ${state.jiraTicketData!.summary}
Description: ${state.jiraTicketData!.description}
Acceptance Criteria: ${state.jiraTicketData!.acceptanceCriteria || 'Not specified'}

**Impact Analysis:**
${state.impactAnalysis}

**Solution Architecture:**
${state.solutionArchitecture}

Please generate the PRD by filling out the following JSON schema. Ensure all fields are properly filled with relevant, actionable content:

{
  "title": "string - The title of the feature or change",
  "introduction": "string - Brief overview of the project's purpose and goals",
  "problem_statement": "string - Clear description of the problem being solved",
  "user_stories": ["array of strings - User stories in 'As a [user type], I want [goal] so that [benefit]' format"],
  "technical_requirements": ["array of strings - Specific technical requirements from the solution architecture"],
  "non_functional_requirements": {"object - Performance, Security, Scalability requirements"},
  "out_of_scope": ["array of strings - Items explicitly not part of this project"],
  "success_metrics": ["array of strings - Quantifiable metrics to measure success"]
}`;
  }
}

export const jiraAnalystAgent = new JiraAnalystAgent();
export const technicalArchitectAgent = new TechnicalArchitectAgent();
export const productManagerAgent = new ProductManagerAgent();
