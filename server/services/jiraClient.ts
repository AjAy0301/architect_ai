export interface JiraTicket {
  key: string;
  summary: string;
  description: string;
  status: string;
  assignee?: string;
  priority: string;
  components: string[];
  labels: string[];
  acceptanceCriteria?: string;
  issueType: string;
  created: string;
  updated: string;
}

export class JiraClientService {
  private baseUrl: string;
  private username: string;
  private apiToken: string;

  constructor() {
    this.baseUrl = process.env.JIRA_INSTANCE_URL || 'https://example.atlassian.net';
    this.username = process.env.JIRA_USERNAME || '';
    this.apiToken = process.env.JIRA_API_TOKEN || '';
  }

  private getAuthHeaders(): Record<string, string> {
    const auth = Buffer.from(`${this.username}:${this.apiToken}`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    };
  }

  async getTicket(ticketId: string): Promise<JiraTicket> {
    // For demonstration, return mock data if no real credentials
    if (!this.username || !this.apiToken) {
      return this.getMockTicket(ticketId);
    }

    try {
      const response = await fetch(`${this.baseUrl}/rest/api/3/issue/${ticketId}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      return this.transformJiraResponse(data);
    } catch (error) {
      console.error('Error fetching Jira ticket:', error);
      // Fall back to mock data
      return this.getMockTicket(ticketId);
    }
  }

  private transformJiraResponse(jiraData: any): JiraTicket {
    const fields = jiraData.fields;
    return {
      key: jiraData.key,
      summary: fields.summary || '',
      description: fields.description?.content?.[0]?.content?.[0]?.text || fields.description || '',
      status: fields.status?.name || 'Unknown',
      assignee: fields.assignee?.displayName,
      priority: fields.priority?.name || 'Medium',
      components: fields.components?.map((c: any) => c.name) || [],
      labels: fields.labels || [],
      acceptanceCriteria: fields.customfield_10025 || '', // Common AC field
      issueType: fields.issuetype?.name || 'Task',
      created: fields.created,
      updated: fields.updated,
    };
  }

  private getMockTicket(ticketId: string): JiraTicket {
    const mockTickets: Record<string, JiraTicket> = {
      'PROJ-1234': {
        key: 'PROJ-1234',
        summary: 'Implement user authentication with biometric support',
        description: 'Users need to be able to log in using fingerprint or face recognition on mobile devices. This should integrate with existing OAuth flow and provide fallback to password authentication.',
        status: 'In Progress',
        assignee: 'John Doe',
        priority: 'High',
        components: ['mobile-app', 'authentication'],
        labels: ['security', 'mobile', 'user-experience'],
        acceptanceCriteria: 'Given a user with biometric capabilities, when they attempt to login, then they should be presented with biometric authentication option',
        issueType: 'Story',
        created: '2024-01-15T10:00:00.000Z',
        updated: '2024-01-16T14:30:00.000Z',
      },
      'PROJ-1235': {
        key: 'PROJ-1235',
        summary: 'Fix payment processing timeout issues',
        description: 'Payment processing is timing out for transactions over $500. This affects approximately 15% of our high-value transactions.',
        status: 'Open',
        assignee: 'Jane Smith',
        priority: 'Critical',
        components: ['payment-service', 'api'],
        labels: ['bug', 'payment', 'performance'],
        acceptanceCriteria: 'Given a payment over $500, when processed, then it should complete within 30 seconds',
        issueType: 'Bug',
        created: '2024-01-16T09:00:00.000Z',
        updated: '2024-01-16T15:45:00.000Z',
      },
    };

    return mockTickets[ticketId] || {
      key: ticketId,
      summary: 'Sample ticket for demonstration',
      description: 'This is a sample ticket used for demonstration purposes when Jira credentials are not provided.',
      status: 'Open',
      priority: 'Medium',
      components: ['general'],
      labels: ['sample'],
      issueType: 'Task',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };
  }

  async validateConnection(): Promise<boolean> {
    if (!this.username || !this.apiToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/rest/api/3/myself`, {
        headers: this.getAuthHeaders(),
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const jiraClient = new JiraClientService();
