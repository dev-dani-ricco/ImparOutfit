import {query} from '../config/db.js';

const fail=()=>Object.assign(new Error('ANALYSIS_INPUT_NOT_AVAILABLE'),{code:'ANALYSIS_INPUT_NOT_AVAILABLE'});

export async function loadAnalysisInputSnapshot(job,db={query}){
  const look=(await db.query(`
    SELECT l.id,l.title,l.description,l.status,v.id AS version_id,v.version
    FROM look_versions v
    JOIN looks l ON l.id=v.look_id AND l.person_id=v.person_id
    WHERE v.id=$1 AND v.person_id=$2
  `,[job.look_version_id,job.owner_person_id])).rows[0];
  const context=(await db.query(`
    SELECT occasion,starts_at,location_text,climate_reference,formality,objective,notes,provenance
    FROM contexts WHERE id=$1 AND owner_person_id=$2
  `,[job.context_id,job.owner_person_id])).rows[0];
  if(!look||!context)throw fail();

  const items=(await db.query(`
    SELECT li.position,li.kind,
      COALESCE(w.name,p.name) AS name,
      COALESCE(w.category,p.category) AS category,
      COALESCE(w.color,p.color) AS color,
      CASE WHEN li.kind='OWNED_ITEM' THEN w.sizes ELSE p.sizes END AS sizes
    FROM look_items li
    LEFT JOIN wardrobe_items w ON w.id=li.wardrobe_item_id AND w.person_id=li.person_id
    LEFT JOIN products p ON p.id=li.product_id
    WHERE li.look_version_id=$1 AND li.person_id=$2
    ORDER BY li.position
  `,[job.look_version_id,job.owner_person_id])).rows;

  return {
    look:{
      id:look.id,
      title:look.title,
      description:look.description,
      status:look.status,
      versionId:look.version_id,
      version:look.version,
      items:items.map(item=>({
        position:item.position,
        kind:item.kind,
        name:item.name,
        category:item.category,
        color:item.color,
        sizes:item.sizes??[]
      }))
    },
    context:{
      occasion:context.occasion,
      startsAt:context.starts_at,
      locationText:context.location_text,
      climateReference:context.climate_reference,
      formality:context.formality,
      objective:context.objective,
      notes:context.notes,
      provenance:context.provenance
    }
  };
}
