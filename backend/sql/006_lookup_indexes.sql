CREATE INDEX look_items_wardrobe_idx ON look_items(wardrobe_item_id);
CREATE INDEX ownership_evidence_idx ON ownership_events(evidence_media_id);
CREATE INDEX grants_expiration_idx ON grants(membership_id,expires_at) WHERE revoked_at IS NULL;
