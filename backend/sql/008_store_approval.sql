ALTER TABLE organizations ADD COLUMN kind TEXT NOT NULL DEFAULT 'COMMERCIAL' CHECK(kind IN ('COMMERCIAL','INSTITUTIONAL'));
ALTER TABLE organizations ADD COLUMN status TEXT NOT NULL DEFAULT 'PENDING_REVIEW' CHECK(status IN ('DRAFT','PENDING_REVIEW','ACTIVE','SUSPENDED','REJECTED'));
ALTER TABLE store_requests DROP CONSTRAINT store_requests_status_check;
ALTER TABLE store_requests ALTER COLUMN status SET DEFAULT 'DRAFT';
UPDATE store_requests SET status='PENDING_REVIEW' WHERE status IN ('PENDING','APPROVED');
ALTER TABLE store_requests ADD CONSTRAINT store_requests_status_check CHECK(status IN ('DRAFT','PENDING_REVIEW','ACTIVE','SUSPENDED','REJECTED'));
ALTER TABLE store_requests ADD COLUMN details JSONB NOT NULL DEFAULT '{}';
-- Existing stores had no institutional approval evidence; preserve data pending review.
INSERT INTO store_requests(person_id,name,status,organization_id)
 SELECT a.person_id,s.store_name,'PENDING_REVIEW',s.organization_id FROM stores s JOIN accounts a ON a.id=s.owner_user_id
 WHERE NOT EXISTS(SELECT 1 FROM store_requests r WHERE r.organization_id=s.organization_id);
CREATE UNIQUE INDEX store_request_org ON store_requests(organization_id) WHERE organization_id IS NOT NULL;
INSERT INTO capabilities(code,description) VALUES ('store_requests.review','Revisar solicitações de loja em contexto institucional');
-- Deliberately not included in any merchant bundle; bootstrap is an operator responsibility.
CREATE TABLE store_request_events (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), request_id UUID NOT NULL REFERENCES store_requests(id),
 actor_person_id UUID NOT NULL REFERENCES persons(id), from_status TEXT, to_status TEXT NOT NULL,
 reason TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX store_request_events_request ON store_request_events(request_id,created_at);
