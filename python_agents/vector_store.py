"""Vector store implementation for RAG pipeline"""

import os
import json
import numpy as np
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


@dataclass
class Document:
    """Document representation for vector storage"""
    id: str
    content: str
    metadata: Dict[str, Any]
    embedding: Optional[np.ndarray] = None


@dataclass
class SearchResult:
    """Search result with similarity score"""
    document: Document
    score: float


class SimpleVectorStore:
    """Simple in-memory vector store using TF-IDF for similarity search"""
    
    def __init__(self):
        self.documents: Dict[str, Document] = {}
        self.vectorizer = TfidfVectorizer(
            stop_words='english',
            max_features=5000,
            ngram_range=(1, 2)
        )
        self._fitted = False
        self._doc_vectors = None
    
    def add_document(self, doc_id: str, content: str, metadata: Dict[str, Any] = None):
        """Add a document to the vector store"""
        if metadata is None:
            metadata = {}
        
        document = Document(
            id=doc_id,
            content=content,
            metadata=metadata
        )
        
        self.documents[doc_id] = document
        self._fitted = False  # Need to refit when new documents are added
    
    def _fit_vectorizer(self):
        """Fit the vectorizer on all documents"""
        if not self.documents:
            return
        
        all_content = [doc.content for doc in self.documents.values()]
        self._doc_vectors = self.vectorizer.fit_transform(all_content)
        self._fitted = True
    
    def search_similar(self, query: str, k: int = 5, filters: Dict[str, Any] = None) -> List[SearchResult]:
        """Search for similar documents"""
        if not self.documents:
            return []
        
        if not self._fitted:
            self._fit_vectorizer()
        
        # Vectorize the query
        query_vector = self.vectorizer.transform([query])
        
        # Calculate similarities
        similarities = cosine_similarity(query_vector, self._doc_vectors).flatten()
        
        # Get document list for filtering
        doc_list = list(self.documents.values())
        
        # Apply metadata filters
        if filters:
            filtered_indices = []
            for i, doc in enumerate(doc_list):
                if all(doc.metadata.get(key) == value for key, value in filters.items()):
                    filtered_indices.append(i)
        else:
            filtered_indices = list(range(len(doc_list)))
        
        # Get top-k similar documents from filtered set
        filtered_similarities = [(i, similarities[i]) for i in filtered_indices]
        top_indices = sorted(filtered_similarities, key=lambda x: x[1], reverse=True)[:k]
        
        results = []
        for doc_idx, score in top_indices:
            if score > 0:  # Only return documents with some similarity
                results.append(SearchResult(
                    document=doc_list[doc_idx],
                    score=float(score)
                ))
        
        return results
    
    def get_document_count(self) -> int:
        """Get the number of documents in the store"""
        return len(self.documents)
    
    def load_sample_documents(self):
        """Load sample documents for testing"""
        sample_docs = [
            {
                "id": "arch-001",
                "content": "Microservices architecture pattern implementation with API Gateway, service discovery, and load balancing. Best practices for service communication and data consistency.",
                "metadata": {"type": "architecture", "component": "backend", "tags": ["microservices", "api"]}
            },
            {
                "id": "db-001", 
                "content": "Database migration strategy for PostgreSQL. Schema versioning, zero-downtime deployments, and rollback procedures for production systems.",
                "metadata": {"type": "database", "component": "infrastructure", "tags": ["postgresql", "migration"]}
            },
            {
                "id": "auth-001",
                "content": "OAuth 2.0 and JWT implementation for secure user authentication. Token management, refresh strategies, and security best practices.",
                "metadata": {"type": "security", "component": "auth", "tags": ["oauth", "jwt", "security"]}
            },
            {
                "id": "ui-001",
                "content": "React component architecture with TypeScript. State management patterns, component composition, and performance optimization techniques.",
                "metadata": {"type": "frontend", "component": "ui", "tags": ["react", "typescript", "components"]}
            },
            {
                "id": "api-001",
                "content": "RESTful API design principles. Resource modeling, HTTP status codes, error handling, and API versioning strategies for scalable systems.",
                "metadata": {"type": "api", "component": "backend", "tags": ["rest", "design", "versioning"]}
            }
        ]
        
        for doc in sample_docs:
            self.add_document(doc["id"], doc["content"], doc["metadata"])


# Global vector store instance
vector_store = SimpleVectorStore()