import { query } from '../config/db.js';

export async function followStore(req, res) {
  await query(
    'INSERT INTO follows(follower_user_id,store_id) VALUES($1,$2) ON CONFLICT DO NOTHING',
    [req.user.id, req.params.id]
  );
  res.status(204).end();
}

export async function unfollowStore(req, res) {
  await query(
    'DELETE FROM follows WHERE follower_user_id=$1 AND store_id=$2',
    [req.user.id, req.params.id]
  );
  res.status(204).end();
}

export async function followUser(req, res) {
  await query(
    'INSERT INTO follows(follower_user_id,followed_user_id) VALUES($1,$2) ON CONFLICT DO NOTHING',
    [req.user.id, req.params.id]
  );
  res.status(204).end();
}

export async function feed(req, res) {
  const rows = (await query(
    `SELECT *
       FROM (
         SELECT 'STORE_ITEM' AS type,
                item.id,
                item.name AS title,
                item.category AS description,
                COALESCE((SELECT '/api/products/'||item.id||'/media/'||pm.media_id FROM product_media pm WHERE pm.product_id=item.id LIMIT 1),item.legacy_image_urls[1]) AS image_url,
                item.created_at,
                store.store_name AS author,
                store.id AS store_id
           FROM products item
           JOIN follows follow ON follow.store_id = item.store_id
           JOIN stores store ON store.id = item.store_id
           JOIN organizations org ON org.id=store.organization_id AND org.status='ACTIVE'
          WHERE follow.follower_user_id = $1
            AND item.status = 'PUBLISHED'
         UNION ALL
         SELECT 'SHOWCASE' AS type,
                showcase.id,
                showcase.title,
                showcase.description,
                NULL::text AS image_url,
                showcase.created_at,
                store.store_name AS author,
                store.id AS store_id
           FROM showcases showcase
           JOIN follows follow ON follow.store_id = showcase.store_id
           JOIN stores store ON store.id = showcase.store_id
           JOIN organizations org ON org.id=store.organization_id AND org.status='ACTIVE'
          WHERE follow.follower_user_id = $1
       ) store_feed
      ORDER BY created_at DESC
      LIMIT 100`,
    [req.user.id]
  )).rows;
  res.json(rows);
}
