import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import bcrypt from 'bcryptjs';
import { pool } from '../src/config/db.js';

const ids={
  person:'00000000-0000-4000-8000-000000000101',
  principal:'00000000-0000-4000-8000-000000000102',
  organization:'00000000-0000-4000-8000-000000000103',
  membership:'00000000-0000-4000-8000-000000000104',
  methodology:'00000000-0000-4000-8000-000000000201',
  methodologyVersion:'00000000-0000-4000-8000-000000000202',
  knowledgeSource:'00000000-0000-4000-8000-000000000301',
  knowledgeCandidate:'00000000-0000-4000-8000-000000000302',
  knowledgeVersion:'00000000-0000-4000-8000-000000000303',
  policy:'00000000-0000-4000-8000-000000000401',
  policyVersion:'00000000-0000-4000-8000-000000000402',
  promptDefinition:'00000000-0000-4000-8000-000000000501',
  promptVersion:'00000000-0000-4000-8000-000000000502'
};

const root=resolve(process.env.IMPAR_PRIVATE_CONTENT_ROOT||'./private/content');
const files={
  methodology:resolve(root,'methodology/impar-analysis-bootstrap-v1.txt'),
  prompt:resolve(root,'prompt/impar-analysis-bootstrap-v1.txt')
};
const content={};
for(const [key,file] of Object.entries(files)) content[key]=await readFile(file,'utf8');
const sha=value=>createHash('sha256').update(value).digest('hex');
const hashes=Object.fromEntries(Object.entries(content).map(([k,v])=>[k,sha(v)]));
const knowledgeRef=process.env.DANI_KNOWLEDGE_BOOTSTRAP_REF||'';
const knowledgeHash=(process.env.DANI_KNOWLEDGE_BOOTSTRAP_HASH||'').toLowerCase();
if(!knowledgeRef.startsWith('dani-knowledge://')||!/^[0-9a-f]{64}$/.test(knowledgeHash)){
  throw new Error('DANI_KNOWLEDGE_BOOTSTRAP_NOT_CONFIGURED');
}

const c=await pool.connect();
try{
  await c.query('BEGIN');
  const passwordHash=await bcrypt.hash(randomBytes(32).toString('hex'),12);

  await c.query(`INSERT INTO users(id,name,email,password_hash,profile_type)
    VALUES($1,'UNIVERSO IMPAR Runtime','runtime-executor@local.invalid',$2,'PERSON')
    ON CONFLICT(id) DO NOTHING`,[ids.person,passwordHash]);
  await c.query(`INSERT INTO persons(id,display_name) VALUES($1,'UNIVERSO IMPAR Runtime')
    ON CONFLICT(id) DO NOTHING`,[ids.person]);
  await c.query(`INSERT INTO accounts(id,person_id,status) VALUES($1,$1,'ACTIVE')
    ON CONFLICT(id) DO NOTHING`,[ids.person]);
  await c.query(`INSERT INTO identifiers(person_id,kind,value)
    VALUES($1,'EMAIL','runtime-executor@local.invalid') ON CONFLICT DO NOTHING`,[ids.person]);
  await c.query(`INSERT INTO principals(id,principal_type,person_id,status)
    VALUES($1,'HUMAN',$2,'ACTIVE') ON CONFLICT(id) DO NOTHING`,[ids.principal,ids.person]);

  await c.query(`INSERT INTO organizations(id,name,created_by_person_id,kind,status)
    VALUES($1,'UNIVERSO IMPAR Local Runtime',$2,'INSTITUTIONAL','ACTIVE')
    ON CONFLICT(id) DO NOTHING`,[ids.organization,ids.person]);
  await c.query(`INSERT INTO memberships(id,person_id,organization_id,status,created_by_person_id)
    VALUES($1,$2,$3,'ACTIVE',$2) ON CONFLICT(id) DO NOTHING`,
    [ids.membership,ids.person,ids.organization]);
  for(const capability of ['impar.analysis.execute','impar.analysis.methodology.assign']){
    await c.query(`INSERT INTO grants(membership_id,capability_code,granted_by_person_id)
      VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,
      [ids.membership,capability,ids.person]);
  }

  await c.query(`INSERT INTO methodologies(id,key,technical_name,status)
    VALUES($1,'IMPAR_TECHNICAL_BOOTSTRAP','Technical bootstrap - non proprietary','ACTIVE')
    ON CONFLICT(id) DO UPDATE SET status='ACTIVE'`,[ids.methodology]);
  await c.query(`INSERT INTO methodology_versions(
      id,methodology_id,version,status,content_ref,content_hash,created_by_principal_id,published_by_principal_id,published_at
    ) VALUES($1,$2,1,'PUBLISHED','private://methodology/impar-analysis-bootstrap-v1.txt',$3,$4,$4,now())
    ON CONFLICT(id) DO UPDATE SET status='PUBLISHED',content_hash=EXCLUDED.content_hash`,
    [ids.methodologyVersion,ids.methodology,hashes.methodology,ids.principal]);

  await c.query(`INSERT INTO knowledge_sources(
      id,knowledge_scope,source_type,label,private_content_ref,content_hash,status,created_by_principal_id
    ) VALUES($1,'IMPAR','CURATED_DATASET','Technical bootstrap',$2,$3,'ACTIVE',$4)
    ON CONFLICT(id) DO UPDATE SET private_content_ref=EXCLUDED.private_content_ref,content_hash=EXCLUDED.content_hash,status='ACTIVE'`,
    [ids.knowledgeSource,knowledgeRef,knowledgeHash,ids.principal]);

  await c.query(`INSERT INTO knowledge_candidates(
      id,source_id,knowledge_scope,candidate_version,private_content_ref,content_hash,status,created_by_principal_id
    ) VALUES($1,$2,'IMPAR',1,$3,$4,'PUBLISHED',$5)
    ON CONFLICT(id) DO UPDATE SET private_content_ref=EXCLUDED.private_content_ref,content_hash=EXCLUDED.content_hash,status='PUBLISHED'`,
    [ids.knowledgeCandidate,ids.knowledgeSource,knowledgeRef,knowledgeHash,ids.principal]);

  await c.query(`INSERT INTO authorized_knowledge_versions(
      id,candidate_id,knowledge_scope,version,status,private_content_ref,content_hash,published_by_principal_id,published_at
    ) VALUES($1,$2,'IMPAR',1,'PUBLISHED',$3,$4,$5,now())
    ON CONFLICT(id) DO UPDATE SET private_content_ref=EXCLUDED.private_content_ref,content_hash=EXCLUDED.content_hash,status='PUBLISHED'`,
    [ids.knowledgeVersion,ids.knowledgeCandidate,knowledgeRef,knowledgeHash,ids.principal]);

  await c.query(`INSERT INTO methodology_version_knowledge(methodology_version_id,authorized_knowledge_version_id)
    VALUES($1,$2) ON CONFLICT DO NOTHING`,[ids.methodologyVersion,ids.knowledgeVersion]);
  await c.query(`INSERT INTO ai_policies(id,task,created_by_principal_id)
    VALUES($1,'IMPAR_ANALYSIS',$2)
    ON CONFLICT(id) DO NOTHING`,[ids.policy,ids.principal]);
  await c.query(`INSERT INTO ai_policy_versions(
      id,ai_policy_id,version,status,provider_identifier,model_identifier,timeout_ms,parameters,
      created_by_principal_id,published_by_principal_id,published_at
    ) VALUES($1,$2,1,'PUBLISHED','omniroute',$3,$4,'{}'::jsonb,$5,$5,now())
    ON CONFLICT(id) DO UPDATE SET
      status='PUBLISHED',
      provider_identifier=EXCLUDED.provider_identifier,
      model_identifier=EXCLUDED.model_identifier,
      timeout_ms=EXCLUDED.timeout_ms`,
    [
      ids.policyVersion,
      ids.policy,
      process.env.IMPAR_ANALYSIS_MODEL||'openai/gpt-oss-120b',
      Math.min(Number.parseInt(process.env.IMPAR_ANALYSIS_PROVIDER_TIMEOUT_MS||'110000',10)||110000,120000),
      ids.principal
    ]);

  await c.query(`INSERT INTO prompt_definitions(id,task,created_by_principal_id)
    VALUES($1,'IMPAR_ANALYSIS',$2)
    ON CONFLICT(id) DO NOTHING`,[ids.promptDefinition,ids.principal]);
  await c.query(`INSERT INTO prompt_versions(
      id,prompt_definition_id,version,status,content_hash,private_content_ref,
      created_by_principal_id,published_by_principal_id,published_at
    ) VALUES($1,$2,1,'PUBLISHED',$3,'private://prompt/impar-analysis-bootstrap-v1.txt',$4,$4,now())
    ON CONFLICT(id) DO UPDATE SET status='PUBLISHED',content_hash=EXCLUDED.content_hash`,
    [ids.promptVersion,ids.promptDefinition,hashes.prompt,ids.principal]);

  await c.query('COMMIT');
  console.log('BOOTSTRAP=PASS');
  console.log(`EXECUTION_PRINCIPAL_ID=${ids.principal}`);
  console.log('DEFAULT_METHODOLOGY_KEY=IMPAR_TECHNICAL_BOOTSTRAP');
} catch(error){
  await c.query('ROLLBACK');
  console.error('BOOTSTRAP=FAIL');
  console.error(error.message);
  process.exitCode=1;
} finally {
  c.release();
  await pool.end();
}
