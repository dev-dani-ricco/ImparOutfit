# Governed Knowledge Retrieval

For `IMPAR_ANALYSIS`, authorization precedes retrieval. The server derives an
exact, sorted snapshot of `AuthorizedKnowledgeVersion` IDs from the anchored
MethodologyVersion; clients, providers and retrievers cannot add sources,
candidates, versions or personal knowledge.

The private resolver receives only those IDs. The first implementation is
deterministic bounded lexical retrieval (`LEXICAL_SNAPSHOT_V1`), not semantic
search: it splits resolved authorized content into units, ranks lexically with
a stable ID tie-breaker, and applies server-controlled unit and character
limits. Resolved content with no usable unit fails honestly; it does not
substitute other knowledge or invent context.

The adapter receives selected knowledge as `knowledgeContext` data. PromptVersion
remains the instruction boundary. AIExecution records only strategy, version,
authorized IDs, selected unit IDs/hashes and count—not content, private refs,
composed prompts, CoT or credentials.

There is no vector database, embeddings, semantic vector search, Personal RAG,
web retrieval, Agent Registry or real LLM provider. The schema permits only
institutional `IMPAR` knowledge, forming the current Personal Knowledge firewall.
