interface OllamaResponse {
  response: string;
  done: boolean;
  context?: number[];
}

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  context?: number[];
  options?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
}

export class OllamaService {
  private baseUrl: string;
  private activeModel: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.activeModel = process.env.OLLAMA_DEFAULT_MODEL || 'codellama:7b';
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      console.error('Ollama health check failed:', error);
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      console.error('Failed to list models:', error);
      return [];
    }
  }

  async generate(prompt: string, options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    const request: OllamaGenerateRequest = {
      model: options?.model || this.activeModel,
      prompt,
      stream: false,
      options: {
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 2048,
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout for complex operations

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data: OllamaResponse = await response.json();
      return data.response || '';
    } catch (error) {
      console.error('Ollama generation failed:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Ollama request timed out. Please try again.');
      }
      throw new Error(`Failed to generate response: ${error}`);
    }
  }

  async generatePRD(description: string, priority: string, components: string[]): Promise<string> {
    const prompt = `Generate a comprehensive Digital Telco Product Requirements Document (PRD) for: ${description}

CRITICAL: You MUST include ALL tables below. Tables are MANDATORY and must be included in every PRD.

## 📄 **Product Requirements Document (PRD)**

### **Document Metadata**
| Field | Value |
|-------|-------|
| **Document Title** | PRD: ${description} |
| **Issue Key** | DATAQA-7888 |
| **Priority** | ${priority} |
| **Status** | Planned |
| **Assignee** | vikas.singh@telekom-digital.com |
| **Epic** | Unified Commerce Fabric + Trust & Compliance Infrastructure |
| **Story Points** | 130 |
| **Sprints** | Sprint 17 – Sprint 21 |

### **1. 📋 Business Requirements**

**Business Objective:**
${description}

**Success Criteria:**
| # | Criteria | Measurement | Target | Status |
|---|----------|-------------|--------|--------|
| 1 | System Uptime | 99.999% availability | 99.999% | Pending |
| 2 | Response Time | <50ms latency | <50ms | Pending |
| 3 | Concurrent Users | 10M+ sessions | 10M+ | Pending |
| 4 | Data Compliance | GDPR/PIPL compliance | 100% | Pending |
| 5 | Security Score | SOC2, ISO 27001 | Pass | Pending |

**Business Value:**
| # | Value Proposition | Impact | ROI | Timeline |
|---|------------------|--------|-----|---------|
| 1 | Unified Commerce Platform | 40% cost reduction | High | 6 months |
| 2 | Autonomous Operations | 60% operational efficiency | High | 3 months |
| 3 | Blockchain Audit Trail | 100% compliance | Critical | 4 months |
| 4 | Multi-cloud Deployment | 99.9% uptime | High | 5 months |

### **2. 🎯 Capabilities/Impacted Systems**

**Core Capabilities:**
| # | Capability | Description | Priority | Complexity | Owner |
|---|------------|-------------|----------|------------|-------|
| 1 | Decentralized Identity (DID) | W3C DID standard implementation | High | High | Blockchain Team |
| 2 | Blockchain Audit Trail | Immutable order logging | Critical | High | Security Team |
| 3 | Autonomous AI Operations | ML-driven auto-scaling | High | Medium | AI/ML Team |
| 4 | Multi-cloud Orchestration | Cross-cloud deployment | High | High | DevOps Team |
| 5 | Privacy & Compliance | GDPR/PIPL data routing | Critical | High | Legal Team |

**Impacted Systems:**
| # | System | Current State | Target State | Migration Complexity | Timeline |
|---|--------|---------------|--------------|-------------------|----------|
| 1 | Identity Management | Centralized | Decentralized (DID) | High | 4 months |
| 2 | Order Management | Traditional | Blockchain-based | High | 6 months |
| 3 | Compliance Engine | Manual | Automated | Medium | 3 months |
| 4 | Infrastructure | Single Cloud | Multi-cloud | High | 5 months |
| 5 | Analytics | Batch | Real-time | Medium | 2 months |

### **3. ⚠️ Risks, Assumptions & Dependencies**

**Risk Assessment:**
| # | Risk Description | Impact | Probability | Mitigation | Owner | Status |
|---|------------------|--------|-------------|-----------|-------|--------|
| 1 | Blockchain network latency | High | Medium | Implement caching layer | DevOps | Active |
| 2 | Multi-cloud complexity | High | High | Use Terraform + ArgoCD | DevOps | Active |
| 3 | DID adoption challenges | Medium | Medium | Provide OIDC fallback | Product | Active |
| 4 | AI model accuracy | Medium | Low | Implement A/B testing | AI/ML | Active |
| 5 | Compliance violations | Critical | Low | Automated compliance checks | Legal | Active |

**Assumptions:**
| # | Assumption | Validation Required | Owner | Status | Timeline |
|---|------------|-------------------|-------|--------|----------|
| 1 | Hyperledger Indy availability | Yes | Blockchain Team | Validated | Sprint 17 |
| 2 | Multi-cloud provider SLAs | Yes | DevOps Team | Pending | Sprint 18 |
| 3 | GDPR compliance requirements | Yes | Legal Team | Validated | Sprint 17 |
| 4 | AI/ML model performance | Yes | Data Science Team | Pending | Sprint 19 |
| 5 | User adoption of DID | Yes | Product Team | Pending | Sprint 20 |

**Dependencies:**
| # | Dependency | Type | Owner | Timeline | Status |
|---|------------|------|-------|----------|--------|
| 1 | Terraform infrastructure setup | Technical | DevOps | Sprint 17 | Pending |
| 2 | Hyperledger Fabric deployment | Technical | Blockchain | Sprint 18 | Pending |
| 3 | AI/ML model training | Technical | Data Science | Sprint 19 | Pending |
| 4 | Legal compliance approval | Business | Legal | Sprint 17 | Pending |
| 5 | Security audit completion | Business | Security | Sprint 18 | Pending |

### **4. 🏗️ Technical Architecture**

**System Components:**
| # | Component | Technology | Purpose | Deployment | Owner | Status |
|---|-----------|------------|---------|------------|-------|--------|
| 1 | IdentityService | Hyperledger Indy | DID management | Multi-cloud | Blockchain Team | Pending |
| 2 | ComplianceFabricService | AWS Macie/Azure Purview | Data compliance | Multi-region | Legal Team | Pending |
| 3 | AutonomousAIOpsService | SageMaker/AzureML/Vertex AI | ML operations | Multi-cloud | AI/ML Team | Pending |
| 4 | BlockchainAuditService | Hyperledger Fabric/Polygon | Immutable logging | Blockchain | Security Team | Pending |
| 5 | CrossCloudOrchestrator | Terraform + ArgoCD | Multi-cloud deployment | Multi-cloud | DevOps Team | Pending |

**Infrastructure Requirements:**
| # | Requirement | Specification | Provider | Cost | Status |
|---|-------------|---------------|----------|------|--------|
| 1 | Compute | Kubernetes clusters | AWS EKS, Azure AKS, GCP GKE | $50K/month | Pending |
| 2 | Storage | Global sharded databases | PostgreSQL, Cassandra, MongoDB | $30K/month | Pending |
| 3 | Networking | Service mesh | Istio with mTLS | $20K/month | Pending |
| 4 | Security | Zero trust network | Vault, Keycloak, Indy Agent | $40K/month | Pending |
| 5 | Monitoring | Observability stack | Prometheus, Loki, Tempo, Grafana | $15K/month | Pending |
| 6 | AI/ML | Model serving | Triton Inference Server | $25K/month | Pending |

**Performance Targets:**
| # | Metric | Target | Measurement | Current | Status |
|---|--------|--------|-------------|---------|--------|
| 1 | Latency | <50ms | 95th percentile | TBD | Pending |
| 2 | Throughput | 10M+ concurrent sessions | Load testing | TBD | Pending |
| 3 | Availability | 99.999% | Uptime monitoring | TBD | Pending |
| 4 | Compliance | 100% | Automated audits | TBD | Pending |
| 5 | Security | Zero vulnerabilities | Security scanning | TBD | Pending |

**Implementation Timeline:**
| # | Phase | Duration | Key Deliverables | Owner | Status |
|---|------|----------|------------------|-------|--------|
| 1 | Planning | 2 weeks | Architecture design, Security review | Tech Lead | In Progress |
| 2 | Development | 8 weeks | Core services, API development | Development Team | Pending |
| 3 | Testing | 4 weeks | Unit tests, Integration tests | QA Team | Pending |
| 4 | Deployment | 2 weeks | Multi-cloud deployment | DevOps Team | Pending |
| 5 | Go-Live | 1 week | Production launch | Product Team | Pending |

**API Endpoints:**
| # | Endpoint | Method | Description | Authentication | Status |
|---|----------|--------|-------------|----------------|--------|
| 1 | /api/did/issue | POST | Issue decentralized identity | OAuth 2.0 | Pending |
| 2 | /api/did/verify/{id} | GET | Verify DID authenticity | Bearer Token | Pending |
| 3 | /api/compliance/user | POST | Check regional compliance | API Key | Pending |
| 4 | /api/audit/order | POST | Log order to blockchain | JWT | Pending |
| 5 | /api/anomaly/event | POST | Report AI anomaly | API Key | Pending |

**Data Models:**
| # | Model | Fields | Relationships | Validation | Status |
|---|-------|--------|--------------|------------|--------|
| 1 | User | id, did, region, compliance_status | Orders, Audits | Required fields | Pending |
| 2 | Order | id, user_id, amount, blockchain_hash | User, Audit | Amount > 0 | Pending |
| 3 | Audit | id, order_id, timestamp, hash | Order | Immutable | Pending |
| 4 | Compliance | user_id, region, status, timestamp | User | Regional rules | Pending |
| 5 | Anomaly | id, type, severity, prediction_score | User, Order | ML validation | Pending |

## 📋 **Tables Section**

### **Document Metadata Table**
| Field | Value |
|-------|-------|
| **Document Title** | PRD: ${description} |
| **Issue Key** | DATAQA-7888 |
| **Priority** | ${priority} |
| **Status** | Planned |
| **Assignee** | vikas.singh@telekom-digital.com |
| **Epic** | Unified Commerce Fabric + Trust & Compliance Infrastructure |
| **Story Points** | 130 |
| **Sprints** | Sprint 17 – Sprint 21 |

### **Success Criteria Table**
| # | Criteria | Measurement | Target | Status |
|---|----------|-------------|--------|--------|
| 1 | System Uptime | 99.999% availability | 99.999% | Pending |
| 2 | Response Time | <50ms latency | <50ms | Pending |
| 3 | Concurrent Users | 10M+ sessions | 10M+ | Pending |
| 4 | Data Compliance | GDPR/PIPL compliance | 100% | Pending |
| 5 | Security Score | SOC2, ISO 27001 | Pass | Pending |

### **Business Value Table**
| # | Value Proposition | Impact | ROI | Timeline |
|---|------------------|--------|-----|---------|
| 1 | Unified Commerce Platform | 40% cost reduction | High | 6 months |
| 2 | Autonomous Operations | 60% operational efficiency | High | 3 months |
| 3 | Blockchain Audit Trail | 100% compliance | Critical | 4 months |
| 4 | Multi-cloud Deployment | 99.9% uptime | High | 5 months |

### **Core Capabilities Table**
| # | Capability | Description | Priority | Complexity | Owner |
|---|------------|-------------|----------|------------|-------|
| 1 | Decentralized Identity (DID) | W3C DID standard implementation | High | High | Blockchain Team |
| 2 | Blockchain Audit Trail | Immutable order logging | Critical | High | Security Team |
| 3 | Autonomous AI Operations | ML-driven auto-scaling | High | Medium | AI/ML Team |
| 4 | Multi-cloud Orchestration | Cross-cloud deployment | High | High | DevOps Team |
| 5 | Privacy & Compliance | GDPR/PIPL data routing | Critical | High | Legal Team |

### **Impacted Systems Table**
| # | System | Current State | Target State | Migration Complexity | Timeline |
|---|--------|---------------|--------------|-------------------|----------|
| 1 | Identity Management | Centralized | Decentralized (DID) | High | 4 months |
| 2 | Order Management | Traditional | Blockchain-based | High | 6 months |
| 3 | Compliance Engine | Manual | Automated | Medium | 3 months |
| 4 | Infrastructure | Single Cloud | Multi-cloud | High | 5 months |
| 5 | Analytics | Batch | Real-time | Medium | 2 months |

### **Risk Assessment Table**
| # | Risk Description | Impact | Probability | Mitigation | Owner | Status |
|---|------------------|--------|-------------|-----------|-------|--------|
| 1 | Blockchain network latency | High | Medium | Implement caching layer | DevOps | Active |
| 2 | Multi-cloud complexity | High | High | Use Terraform + ArgoCD | DevOps | Active |
| 3 | DID adoption challenges | Medium | Medium | Provide OIDC fallback | Product | Active |
| 4 | AI model accuracy | Medium | Low | Implement A/B testing | AI/ML | Active |
| 5 | Compliance violations | Critical | Low | Automated compliance checks | Legal | Active |

### **Assumptions Table**
| # | Assumption | Validation Required | Owner | Status | Timeline |
|---|------------|-------------------|-------|--------|----------|
| 1 | Hyperledger Indy availability | Yes | Blockchain Team | Validated | Sprint 17 |
| 2 | Multi-cloud provider SLAs | Yes | DevOps Team | Pending | Sprint 18 |
| 3 | GDPR compliance requirements | Yes | Legal Team | Validated | Sprint 17 |
| 4 | AI/ML model performance | Yes | Data Science Team | Pending | Sprint 19 |
| 5 | User adoption of DID | Yes | Product Team | Pending | Sprint 20 |

### **Dependencies Table**
| # | Dependency | Type | Owner | Timeline | Status |
|---|------------|------|-------|----------|--------|
| 1 | Terraform infrastructure setup | Technical | DevOps | Sprint 17 | Pending |
| 2 | Hyperledger Fabric deployment | Technical | Blockchain | Sprint 18 | Pending |
| 3 | AI/ML model training | Technical | Data Science | Sprint 19 | Pending |
| 4 | Legal compliance approval | Business | Legal | Sprint 17 | Pending |
| 5 | Security audit completion | Business | Security | Sprint 18 | Pending |

### **System Components Table**
| # | Component | Technology | Purpose | Deployment | Owner | Status |
|---|-----------|------------|---------|------------|-------|--------|
| 1 | IdentityService | Hyperledger Indy | DID management | Multi-cloud | Blockchain Team | Pending |
| 2 | ComplianceFabricService | AWS Macie/Azure Purview | Data compliance | Multi-region | Legal Team | Pending |
| 3 | AutonomousAIOpsService | SageMaker/AzureML/Vertex AI | ML operations | Multi-cloud | AI/ML Team | Pending |
| 4 | BlockchainAuditService | Hyperledger Fabric/Polygon | Immutable logging | Blockchain | Security Team | Pending |
| 5 | CrossCloudOrchestrator | Terraform + ArgoCD | Multi-cloud deployment | Multi-cloud | DevOps Team | Pending |

### **Infrastructure Requirements Table**
| # | Requirement | Specification | Provider | Cost | Status |
|---|-------------|---------------|----------|------|--------|
| 1 | Compute | Kubernetes clusters | AWS EKS, Azure AKS, GCP GKE | $50K/month | Pending |
| 2 | Storage | Global sharded databases | PostgreSQL, Cassandra, MongoDB | $30K/month | Pending |
| 3 | Networking | Service mesh | Istio with mTLS | $20K/month | Pending |
| 4 | Security | Zero trust network | Vault, Keycloak, Indy Agent | $40K/month | Pending |
| 5 | Monitoring | Observability stack | Prometheus, Loki, Tempo, Grafana | $15K/month | Pending |
| 6 | AI/ML | Model serving | Triton Inference Server | $25K/month | Pending |

### **Performance Targets Table**
| # | Metric | Target | Measurement | Current | Status |
|---|--------|--------|-------------|---------|--------|
| 1 | Latency | <50ms | 95th percentile | TBD | Pending |
| 2 | Throughput | 10M+ concurrent sessions | Load testing | TBD | Pending |
| 3 | Availability | 99.999% | Uptime monitoring | TBD | Pending |
| 4 | Compliance | 100% | Automated audits | TBD | Pending |
| 5 | Security | Zero vulnerabilities | Security scanning | TBD | Pending |

### **Implementation Timeline Table**
| # | Phase | Duration | Key Deliverables | Owner | Status |
|---|------|----------|------------------|-------|--------|
| 1 | Planning | 2 weeks | Architecture design, Security review | Tech Lead | In Progress |
| 2 | Development | 8 weeks | Core services, API development | Development Team | Pending |
| 3 | Testing | 4 weeks | Unit tests, Integration tests | QA Team | Pending |
| 4 | Deployment | 2 weeks | Multi-cloud deployment | DevOps Team | Pending |
| 5 | Go-Live | 1 week | Production launch | Product Team | Pending |

### **API Endpoints Table**
| # | Endpoint | Method | Description | Authentication | Status |
|---|----------|--------|-------------|----------------|--------|
| 1 | /api/did/issue | POST | Issue decentralized identity | OAuth 2.0 | Pending |
| 2 | /api/did/verify/{id} | GET | Verify DID authenticity | Bearer Token | Pending |
| 3 | /api/compliance/user | POST | Check regional compliance | API Key | Pending |
| 4 | /api/audit/order | POST | Log order to blockchain | JWT | Pending |
| 5 | /api/anomaly/event | POST | Report AI anomaly | API Key | Pending |

### **Data Models Table**
| # | Model | Fields | Relationships | Validation | Status |
|---|-------|--------|--------------|------------|--------|
| 1 | User | id, did, region, compliance_status | Orders, Audits | Required fields | Pending |
| 2 | Order | id, user_id, amount, blockchain_hash | User, Audit | Amount > 0 | Pending |
| 3 | Audit | id, order_id, timestamp, hash | Order | Immutable | Pending |
| 4 | Compliance | user_id, region, status, timestamp | User | Regional rules | Pending |
| 5 | Anomaly | id, type, severity, prediction_score | User, Order | ML validation | Pending |

MANDATORY: You MUST include ALL tables above. Do NOT skip any tables. Ensure all tables are properly formatted with headers and data. Tables are REQUIRED for every PRD.`;

    return this.generate(prompt, { model: 'codellama:7b', temperature: 0.2 });
  }

  async generateCode(prdContent: string, language: string, framework?: string): Promise<string> {
    const prompt = `Based on the following PRD content, generate production-ready ${language} code${framework ? ` using ${framework}` : ''}:

PRD Content:
${prdContent}

Generate clean, well-documented, and production-ready code that implements the requirements. Include:
- Proper error handling
- Input validation
- Security considerations
- Clear documentation/comments
- Following best practices for ${language}${framework ? ` and ${framework}` : ''}`;

    return this.generate(prompt, { model: 'codellama:7b', temperature: 0.2 });
  }

  async generateEnterpriseSequenceDiagram(content: string, componentName?: string): Promise<string> {
    const context = componentName 
      ? `Create a sequence diagram for the ${componentName} component`
      : `Create a sequence diagram showing system interactions`;

    const prompt = `${context} based on this architecture content: ${content.substring(0, 2000)}...

Generate a Mermaid sequence diagram with these requirements:

1. **Participants**: Include key services like User, APIGateway, and relevant components
2. **Flow**: Show a clear request-response flow
3. **Syntax**: Use -> for calls, --> for responses
4. **Format**: Return ONLY the Mermaid code, no explanations
5. **Validation**: Ensure proper syntax with no extra spaces or characters

Example format:
sequenceDiagram
    participant User
    participant APIGateway
    participant Service
    User->>APIGateway: Request
    APIGateway->>Service: Process
    Service-->>APIGateway: Response
    APIGateway-->>User: Result

IMPORTANT: Return ONLY the Mermaid code starting with 'sequenceDiagram', no markdown formatting.`;

    const result = await this.generate(prompt, { model: 'codellama:7b', temperature: 0.3 });
    
    // Clean up the result to ensure proper Mermaid syntax
    let cleanedResult = result.trim();
    
    // Remove markdown code blocks if present
    if (cleanedResult.includes('```mermaid')) {
      cleanedResult = cleanedResult.replace(/```mermaid\n?/, '').replace(/\n?```$/, '');
    } else if (cleanedResult.includes('```')) {
      cleanedResult = cleanedResult.replace(/```\n?/, '').replace(/\n?```$/, '');
    }
    
    // Find the actual sequenceDiagram start
    const sequenceDiagramIndex = cleanedResult.indexOf('sequenceDiagram');
    if (sequenceDiagramIndex !== -1) {
      cleanedResult = cleanedResult.substring(sequenceDiagramIndex);
    }
    
    // Ensure it starts with sequenceDiagram
    if (!cleanedResult.startsWith('sequenceDiagram')) {
      cleanedResult = `sequenceDiagram
    participant User
    participant APIGateway
    participant Service
    User->>APIGateway: Request
    APIGateway->>Service: Process
    Service-->>APIGateway: Response
    APIGateway-->>User: Result`;
    }
    
    return cleanedResult;
  }

  async extractEntities(content: string): Promise<Array<{ name: string; type: string; description: string }>> {
    const prompt = `Analyze the following text and extract technical entities such as services, APIs, databases, and components. Return the results as a JSON array with objects containing 'name', 'type', and 'description' fields:

Text:
${content}

Focus on identifying:
- Microservices and applications
- APIs and endpoints
- Databases and data stores
- Third-party integrations
- Infrastructure components

Return only valid JSON, no additional text.`;

    try {
      const response = await this.generate(prompt, { model: 'llama3.1:latest', temperature: 0.1 });
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to extract entities:', error);
      return [];
    }
  }

  async analyzeDependencies(entities: Array<{ name: string; type: string }>): Promise<Array<{ source: string; target: string; type: string }>> {
    const prompt = `Given the following technical entities, analyze and identify the dependencies between them. Return the results as a JSON array with objects containing 'source', 'target', and 'type' fields:

Entities:
${entities.map(e => `- ${e.name} (${e.type})`).join('\n')}

Identify relationships such as:
- API calls (calls)
- Data dependencies (depends_on)
- Service dependencies (uses)
- Integration points (integrates_with)

Return only valid JSON, no additional text.`;

    try {
      const response = await this.generate(prompt, { model: 'mistral:7b', temperature: 0.1 });
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to analyze dependencies:', error);
      return [];
    }
  }

  setActiveModel(model: string): void {
    this.activeModel = model;
  }

  getActiveModel(): string {
    return this.activeModel;
  }
}

export const ollamaService = new OllamaService();

export async function getMissingInfoQuestions(content: string): Promise<string[]> {
  const prompt = `You are an assistant that helps users prepare documents for software development. Given the following content, list any missing information required to generate a PRD, code, architecture, and workflows. For each missing item, write a clear question a non-technical user can answer. Return only the questions as a JSON array of strings.\n\nContent:\n${content}`;
  try {
    const response = await ollamaService.generate(prompt, { model: 'llama3.1:latest', temperature: 0.2 });
    // Try to parse as JSON array
    return JSON.parse(response);
  } catch (err) {
    console.error('Failed to get missing info questions:', err);
    return [];
  }
}
