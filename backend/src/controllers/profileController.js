import Joi from 'joi';
import { pool, query } from '../config/db.js';
import { withMedia } from '../services/imageService.js';
import { HttpError } from '../utils/http.js';

const profileSchema = Joi.object({
  name: Joi.string().min(2).max(120),
  age: Joi.number().integer().min(13).max(120).allow(null),
  profession: Joi.string().max(160).allow('', null),
  bodyShape: Joi.string().valid('Ampulheta', 'Triângulo', 'Triângulo invertido', 'Retângulo', 'Oval').allow(null),
  hairStyle: Joi.string().valid('Curto', 'Longo', 'Cacheado', 'Coque').allow(null),
  bodyPreset: Joi.string().valid('balanced', 'soft', 'athletic', 'petite').allow(null),
  faceShape: Joi.string().valid('oval', 'round', 'heart', 'square', 'long').allow(null),
  skinTone: Joi.string().valid('porcelain', 'light', 'medium', 'tan', 'deep', 'rich').allow(null),
  hairStyleId: Joi.string().valid('short', 'bob', 'long', 'waves', 'curls', 'bun', 'ponytail').allow(null),
  hairColor: Joi.string().valid('black', 'dark-brown', 'brown', 'auburn', 'blonde', 'platinum').allow(null),
  shoulders: Joi.number().min(-50).max(50).allow(null),
  torso: Joi.number().min(-50).max(50).allow(null),
  thighs: Joi.number().min(-50).max(50).allow(null),
  headWidth: Joi.number().min(-50).max(50).allow(null),
  jaw: Joi.number().min(-50).max(50).allow(null),
  chin: Joi.number().min(-50).max(50).allow(null),
  faceDepth: Joi.number().min(-50).max(50).allow(null),
  avatarProvider: Joi.string().valid('PARAMETRIC_LOCAL_V2', 'MAKEHUMAN_CC0', 'AVATURN').allow(null),
  avatarVersion: Joi.string().max(30).allow(null),
  mannequinTop: Joi.string().max(30).allow('', null),
  mannequinBottom: Joi.string().max(30).allow('', null),
  bust: Joi.number().positive().max(300).allow(null),
  waist: Joi.number().positive().max(300).allow(null),
  hips: Joi.number().positive().max(300).allow(null),
  height: Joi.number().min(80).max(250).allow(null),
}).min(1);

const toProfile = (row) => ({
  userId: row.id,
  name: row.name,
  email: row.email,
  personId: row.person_id,
  profilePhotoUrl: row.photo_media_id ? '/api/media/' + row.photo_media_id : null,
  age: row.age,
  profession: row.profession,
  bodyShape: row.body_shape,
  hairStyle: row.avatar_config?.hairStyle || 'Coque',
  bodyPreset: row.avatar_config?.bodyPreset || 'balanced',
  faceShape: row.avatar_config?.faceShape || 'oval',
  skinTone: row.avatar_config?.skinTone || 'medium',
  hairStyleId: row.avatar_config?.hairStyleId || 'bun',
  hairColor: row.avatar_config?.hairColor || 'dark-brown',
  shoulders: row.avatar_config?.shoulders ?? 0,
  torso: row.avatar_config?.torso ?? 0,
  thighs: row.avatar_config?.thighs ?? 0,
  headWidth: row.avatar_config?.headWidth ?? 0,
  jaw: row.avatar_config?.jaw ?? 0,
  chin: row.avatar_config?.chin ?? 0,
  faceDepth: row.avatar_config?.faceDepth ?? 0,
  avatarProvider: row.avatar_config?.avatarProvider || 'PARAMETRIC_LOCAL_V2',
  avatarVersion: row.avatar_config?.avatarVersion || '2.0.0',
  mannequinTop: row.mannequin_top,
  mannequinBottom: row.mannequin_bottom,
  bust: row.bust_cm,
  waist: row.waist_cm,
  hips: row.hips_cm,
  height: row.height_cm,
  avatarConfig: row.avatar_config,
  updatedAt: row.updated_at,
});

const profileSelect = `
  SELECT u.id, p.display_name name, u.email, a.person_id, profile.photo_media_id,
         profile.profile_photo_url, profile.age, profile.profession, profile.body_shape,
         profile.mannequin_top, profile.mannequin_bottom, profile.bust_cm,
         profile.waist_cm, profile.hips_cm, profile.height_cm,
         profile.avatar_config, profile.updated_at
    FROM users u
    JOIN accounts a ON a.id=u.id
    JOIN persons p ON p.id=a.person_id
    LEFT JOIN customer_profiles profile ON profile.user_id = u.id
   WHERE u.id = $1`;

export async function getProfile(req, res) {
  const row = (await query(profileSelect, [req.user.id])).rows[0];
  if (!row) throw new HttpError(404, 'Cliente não encontrada');
  res.json(toProfile(row));
}

export async function updateProfile(req, res) {
  const { value, error } = profileSchema.validate(req.body, { stripUnknown: true });
  if (error) throw new HttpError(400, error.message);

  const avatarKeys = [
    'hairStyle', 'bodyPreset', 'faceShape', 'skinTone', 'hairStyleId', 'hairColor',
    'shoulders', 'torso', 'thighs', 'headWidth', 'jaw', 'chin', 'faceDepth',
    'avatarProvider', 'avatarVersion',
  ];
  const avatarConfigPatch = Object.fromEntries(
    avatarKeys
      .filter((key) => Object.hasOwn(value, key) && value[key] !== null)
      .map((key) => [key, value[key]])
  );
  if (Object.keys(avatarConfigPatch).length) {
    avatarConfigPatch.renderer = 'human-parametric-v2';
    avatarConfigPatch.updatedAt = new Date().toISOString();
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (value.name) {
      await client.query('UPDATE persons SET display_name=$2 WHERE id=$1', [req.auth.personId, value.name]);
      await client.query('UPDATE users SET name=$2 WHERE id=$1', [req.user.id, value.name]);
    }
    await client.query(
      `INSERT INTO customer_profiles(
        user_id, age, profession, body_shape, mannequin_top, mannequin_bottom,
        bust_cm, waist_cm, hips_cm, height_cm, avatar_config, updated_at
      ) VALUES(
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11::jsonb,now()
      )
      ON CONFLICT(user_id) DO UPDATE SET
        age=COALESCE(EXCLUDED.age,customer_profiles.age),
        profession=COALESCE(EXCLUDED.profession,customer_profiles.profession),
        body_shape=COALESCE(EXCLUDED.body_shape,customer_profiles.body_shape),
        mannequin_top=COALESCE(EXCLUDED.mannequin_top,customer_profiles.mannequin_top),
        mannequin_bottom=COALESCE(EXCLUDED.mannequin_bottom,customer_profiles.mannequin_bottom),
        bust_cm=COALESCE(EXCLUDED.bust_cm,customer_profiles.bust_cm),
        waist_cm=COALESCE(EXCLUDED.waist_cm,customer_profiles.waist_cm),
        hips_cm=COALESCE(EXCLUDED.hips_cm,customer_profiles.hips_cm),
        height_cm=COALESCE(EXCLUDED.height_cm,customer_profiles.height_cm),
        avatar_config=customer_profiles.avatar_config || EXCLUDED.avatar_config,
        updated_at=now()`,
      [
        req.user.id,
        value.age ?? null,
        value.profession ?? null,
        value.bodyShape ?? null,
        value.mannequinTop ?? null,
        value.mannequinBottom ?? null,
        value.bust ?? null,
        value.waist ?? null,
        value.hips ?? null,
        value.height ?? null,
        JSON.stringify(avatarConfigPatch),
      ]
    );
    const clearable = {"age":"age","profession":"profession","bodyShape":"body_shape","mannequinTop":"mannequin_top","mannequinBottom":"mannequin_bottom","bust":"bust_cm","waist":"waist_cm","hips":"hips_cm","height":"height_cm"};
    for (const [key,column] of Object.entries(clearable)) {
      if (Object.hasOwn(value,key) && value[key] === null) await client.query('UPDATE customer_profiles SET '+column+'=NULL WHERE user_id=$1',[req.user.id]);
    }
    if (Object.hasOwn(value,'hairStyle') && value.hairStyle === null) {
      await client.query("UPDATE customer_profiles SET avatar_config=avatar_config-'hairStyle' WHERE user_id=$1",[req.user.id]);
    }
    const row = (await client.query(profileSelect, [req.user.id])).rows[0];
    await client.query('COMMIT');
    res.json(toProfile(row));
  } catch (requestError) {
    await client.query('ROLLBACK').catch(() => {});
    throw requestError;
  } finally {
    client.release();
  }
}

export async function uploadProfilePhoto(req,res) {
  if(!req.file) throw new HttpError(400,'Envie uma foto de perfil');
  const row=await withMedia([req.file],req.auth,'PROFILE',null,async(client,ids)=>{
    return (await client.query(`INSERT INTO customer_profiles(user_id,photo_media_id,profile_photo_url) VALUES($1,$2,NULL)
      ON CONFLICT(user_id) DO UPDATE SET photo_media_id=$2,profile_photo_url=NULL,updated_at=now() RETURNING photo_media_id,updated_at`,[req.user.id,ids[0]])).rows[0];
  });
  res.json({profilePhotoUrl:'/api/media/'+row.photo_media_id,updatedAt:row.updated_at});
}
