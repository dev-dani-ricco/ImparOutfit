# Methodology Registry

The Registry stores only sanitized institutional metadata. A Methodology has a stable key. A MethodologyVersion has an explicit numeric version, lifecycle state, opaque private `content_ref`, optional SHA-256 hash, and Principal publication provenance.

Private methodology content is never stored in this repository or returned by Registry APIs. The content resolver is intentionally not configured and returns a service-unavailable error rather than synthetic content.

Only PUBLISHED versions can be explicitly bound to a DRAFT ÍMPAR Analysis. There is no automatic latest selection. DRAFT and RETIRED versions cannot be assigned. Once an Analysis has Results, a different methodology cannot replace its binding. Historical legacy references remain unchanged.

Registry metadata is not proprietary knowledge. Future knowledge promotion is: raw source, candidate, review, approval, version, authorized knowledge. This cycle implements only the published-version Registry consumer.
