export interface VectorDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface SearchResult {
  document: VectorDocument;
  score: number;
}

export class InMemoryVectorStore {
  private documents: Map<string, VectorDocument>;
  private embeddings: Map<string, number[]>;

  constructor() {
    this.documents = new Map();
    this.embeddings = new Map();
    this.initializeWithSampleData();
  }

  private initializeWithSampleData() {
    // Initialize with some sample technical documents for RAG context
    const sampleDocs = [
      {
        id: 'doc1',
        content: 'Authentication service uses JWT tokens with 24-hour expiration. Refresh tokens are stored in Redis with 7-day TTL.',
        metadata: { component: 'authentication', type: 'technical_spec' }
      },
      {
        id: 'doc2',
        content: 'Payment processing integration with Stripe requires webhook validation and idempotency keys for transaction safety.',
        metadata: { component: 'payment', type: 'technical_spec' }
      },
      {
        id: 'doc3',
        content: 'Database migration strategy follows blue-green deployment with automated rollback on failure detection.',
        metadata: { component: 'database', type: 'deployment_guide' }
      },
      {
        id: 'doc4',
        content: 'API rate limiting implemented using Redis sliding window with 1000 requests per minute per user.',
        metadata: { component: 'api', type: 'technical_spec' }
      },
      {
        id: 'doc5',
        content: 'Mobile app login flow includes biometric authentication fallback and offline capability for cached credentials.',
        metadata: { component: 'mobile', type: 'feature_spec' }
      },
    ];

    sampleDocs.forEach(doc => {
      this.documents.set(doc.id, doc);
      // Simple mock embedding - in production would use actual embedding model
      this.embeddings.set(doc.id, this.generateMockEmbedding(doc.content));
    });
  }

  private generateMockEmbedding(text: string): number[] {
    // Simple hash-based mock embedding for demonstration
    const embedding = new Array(384).fill(0);
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      embedding[i % 384] += charCode / 1000;
    }
    return embedding;
  }

  async addDocument(document: VectorDocument): Promise<void> {
    this.documents.set(document.id, document);
    if (document.embedding) {
      this.embeddings.set(document.id, document.embedding);
    } else {
      // Generate embedding for the document
      const embedding = this.generateMockEmbedding(document.content);
      this.embeddings.set(document.id, embedding);
    }
  }

  async searchSimilar(query: string, k: number = 5, filters?: Record<string, any>): Promise<SearchResult[]> {
    const queryEmbedding = this.generateMockEmbedding(query);
    const results: SearchResult[] = [];

    for (const [docId, document] of this.documents.entries()) {
      // Apply metadata filters if provided
      if (filters) {
        const matches = Object.entries(filters).every(([key, value]) => 
          document.metadata[key] === value
        );
        if (!matches) continue;
      }

      const docEmbedding = this.embeddings.get(docId);
      if (!docEmbedding) continue;

      // Calculate cosine similarity
      const score = this.cosineSimilarity(queryEmbedding, docEmbedding);
      results.push({ document, score });
    }

    // Sort by score and return top k
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async getAllDocuments(): Promise<VectorDocument[]> {
    return Array.from(this.documents.values());
  }
}

export const vectorStore = new InMemoryVectorStore();
