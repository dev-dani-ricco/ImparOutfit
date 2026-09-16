import {query} from '../config/db.js';
import {assertTask} from './tasks.js';
const unavailable=()=>Object.assign(new Error('PROMPT_NOT_AVAILABLE'),{code:'PROMPT_NOT_AVAILABLE'});
export async function resolvePublishedPrompt(task,db={query}){assertTask(task);const row=(await db.query(`SELECT v.* FROM prompt_definitions d JOIN prompt_versions v ON v.prompt_definition_id=d.id WHERE d.task=$1 AND v.status='PUBLISHED'`,[task])).rows[0];if(!row)throw unavailable();return row;}
export async function loadHistoricalPrompt(id,task,db={query}){assertTask(task);const row=(await db.query(`SELECT v.* FROM prompt_versions v JOIN prompt_definitions d ON d.id=v.prompt_definition_id WHERE v.id=$1 AND d.task=$2 AND v.status IN ('PUBLISHED','RETIRED')`,[id,task])).rows[0];if(!row)throw unavailable();return row;}
