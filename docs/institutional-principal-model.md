# Institutional Principal model

`Person` is the human subject and owner of private data. `Principal` is the identity that authenticates and executes an action. A HUMAN Principal has exactly one Person and every current Person has exactly one active HUMAN Principal.

Ownership remains expressed by `owner_person_id`. A Principal never grants access to another Person's private resource merely by holding an institutional capability.

Authentication resolves both the authenticated Person and its authenticated HUMAN Principal in one middleware path. Authorization evaluates the Principal's active HUMAN relationship to memberships, organizations, grants, capabilities, and resource scope. Authentication is not authorization; a capability is not private resource access.

ÍMPAR Analysis uses this model as its first execution consumer. Analysis remains owned and read privately by a Person. Its Result creation/finalization and Analysis completion record both existing Person provenance and additive Principal provenance. The first executor remains immutable under idempotent calls.

No machine, service, agent, API-key, or token authentication exists in this cycle. The schema intentionally permits only operational HUMAN Principals; future non-human identities require an explicit authentication and authorization design rather than a fictitious Person.

Person is not Principal. Owner is not Actor. Capability is not resource access. Provenance records the real Principal that executed a decision.
