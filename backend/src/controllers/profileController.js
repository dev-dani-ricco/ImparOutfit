import Joi from 'joi';
import { pool, query } from '../config/db.js';
import { withMedia } from '../services/imageService.js';
import { HttpError } from '../utils/http.js';

const unit=Joi.number().min(0).max(1);
const avatarControlsSchema=Joi.object({
  face:Joi.object({
    shape:Joi.string().valid('oval','round','square','diamond','triangular'),
    width:unit,jaw:unit,chin:unit,cheek:unit,forehead:unit,noseWidth:unit,noseLength:unit,noseProjection:unit,
    eyesSize:unit,eyesSpacing:unit,mouthWidth:unit,lipFullness:unit
  }).unknown(false),
  body:Joi.object({
    presentation:Joi.string().valid('feminine','masculine','neutral'),
    weight:unit,muscle:unit,shoulders:unit,chest:unit,waist:unit,hips:unit,belly:unit,arms:unit,thighs:unit,legsLength:unit
  }).unknown(false),
  appearance:Joi.object({
    skinTone:Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
    eyeColor:Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
    hairStyle:Joi.string().valid('buzzed','parted','long','buns'),
    hairColor:Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/)
  }).unknown(false)
}).unknown(false);
const realisticAvatarSchema=Joi.object({
  provider:Joi.string().valid('AVATURN').required(),
  url:Joi.string().uri({scheme:['https']}).max(2048).required(),
  urlType:Joi.string().max(80).allow('',null),
  avatarId:Joi.string().max(200).allow('',null),
  sessionId:Joi.string().max(200).allow('',null),
  bodyId:Joi.string().max(200).allow('',null),
  gender:Joi.string().max(80).allow('',null),
  supportsFaceAnimations:Joi.boolean(),
  exportedAt:Joi.date().iso(),
  version:Joi.number().integer().min(1).max(100)
}).unknown(false);

const profileSchema = Joi.object({
  name: Joi.string().min(2).max(120),
  age: Joi.number().integer().min(13).max(120).allow(null),
  profession: Joi.string().max(160).allow('', null),
  bodyShape: Joi.string().valid('Ampulheta', 'Triângulo', 'Triângulo invertido', 'Retângulo', 'Oval').allow(null),
  hairStyle: Joi.string().valid('Curto', 'Longo', 'Cacheado', 'Coque').allow(null),
  mannequinTop: Joi.string().max(30).allow('', null),
  mannequinBottom: Joi.string().max(30).allow('', null),
  bust: Joi.number().positive().max(300).allow(null),
  waist: Joi.number().positive().max(300).allow(null),
  hips: Joi.number().positive().max(300).allow(null),
  height: Joi.number().min(80).max(250).allow(null),
  avatarControls: avatarControlsSchema.allow(null),
  realisticAvatar: realisticAvatarSchema.allow(null),
  avatarEngine: Joi.string().valid('makehuman-parametric-v1','avaturn-realistic-v1','PARAMETRIC','AVATURN').allow(null),
  avatarConfiguredAt: Joi.date().iso().allow(null),
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
  mannequinTop: row.mannequin_top,
  mannequinBottom: row.mannequin_bottom,
  bust: row.bust_cm,
  waist: row.waist_cm,
  hips: row.hips_cm,
  height: row.height_cm,
  avatarConfig: row.avatar_config,
  avatarControls: row.avatar_config?.avatarControls || null,
  realisticAvatar: row.avatar_config?.realisticAvatar || null,
  avatarEngine: row.avatar_config?.avatarEngine || row.avatar_config?.renderer || null,
  avatarConfiguredAt: row.avatar_config?.avatarConfiguredAt || null,
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
        jsonb_strip_nulls(jsonb_build_object('renderer','human-glb-v1','hairStyle',$11::text)),now()
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
        value.hairStyle ?? null,
      ]
    );
    const clearable = {"age":"age","profession":"profession","bodyShape":"body_shape","mannequinTop":"mannequin_top","mannequinBottom":"mannequin_bottom","bust":"bust_cm","waist":"waist_cm","hips":"hips_cm","height":"height_cm"};
    for (const [key,column] of Object.entries(clearable)) {
      if (Object.hasOwn(value,key) && value[key] === null) await client.query('UPDATE customer_profiles SET '+column+'=NULL WHERE user_id=$1',[req.user.id]);
    }
    if (Object.hasOwn(value,'hairStyle') && value.hairStyle === null) {
      await client.query("UPDATE customer_profiles SET avatar_config=avatar_config-'hairStyle' WHERE user_id=$1",[req.user.id]);
    }
    const avatarPatch={};
    for(const key of ['avatarControls','realisticAvatar','avatarEngine','avatarConfiguredAt']){
      if(Object.hasOwn(value,key) && value[key] !== null) avatarPatch[key]=value[key];
    }
    if(Object.keys(avatarPatch).length){
      await client.query('UPDATE customer_profiles SET avatar_config=avatar_config || $2::jsonb,updated_at=now() WHERE user_id=$1',[req.user.id,JSON.stringify(avatarPatch)]);
    }
    for(const key of ['avatarControls','realisticAvatar','avatarEngine','avatarConfiguredAt']){
      if(Object.hasOwn(value,key) && value[key] === null) await client.query('UPDATE customer_profiles SET avatar_config=avatar_config-$2,updated_at=now() WHERE user_id=$1',[req.user.id,key]);
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
