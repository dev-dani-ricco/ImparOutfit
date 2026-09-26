import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pool} from '../config/db.js';
import {migrate} from '../db/migrate.js';

const sha=value=>createHash('sha256').update(value).digest('hex');
const privateRoot=resolve(process.env.IMPAR_PRIVATE_CONTENT_ROOT||'./private/content');
const refs={
  prompt:'private://prompt/impar-analysis-v1.txt',
  knowledge:'private://knowledge/impar-visual-v1.txt',
  methodology:'private://methodology/impar-visual-v1.txt'
};
const fileFor=ref=>resolve(privateRoot,ref.slice('private://'.length).replaceAll('/',requireSeparator()));
const requireSeparator=()=>process.platform==='win32'?'\\':'/';

async function material(ref){
  const content=await readFile(fileFor(ref),'utf8');
  if(!content.trim())throw new Error('Private bootstrap material is empty');
  return {ref,hash:sha(content)};
}

async function one(client,sql,params=[]){return (await client.query(sql,params)).rows[0];}

async function setEnvValue(name,value){
  const envPath=resolve('.env');
  let text=await readFile(envPath,'utf8').catch(()=> '');
  const line=`${name}=${value}`;
  const re=new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}=.*$`,'m');
  text=re.test(text)?text.replace(re,line):text.replace(/\s*$/,'')+'\n'+line+'\n';
  await writeFile(envPath,text,'utf8');
}

const client=await pool.connect();
try{
  await migrate(client);
  const prompt=await material(refs.prompt);
  const knowledge=await material(refs.knowledge);
  const methodologyMaterial=await material(refs.methodology);

  await client.exec('BEGIN');

  let executor=await one(client,`
    SELECT p.id AS person_id,pr.id AS principal_id
    FROM identifiers i
    JOIN persons p ON p.id=i.person_id
    LEFT JOIN principals pr ON pr.person_id=p.id AND pr.principal_type='HUMAN'
    WHERE i.kind='EXTERNAL' AND i.value='system:impar-executor'
  `);
  if(!executor){
    const person=await one(client,"INSERT INTO persons(display_name) VALUES('Universo IMPAR Executor') RETURNING id");
    await client.query("INSERT INTO identifiers(person_id,kind,value,verified_at) VALUES($1,'EXTERNAL','system:impar-executor',now())",[person.id]);
    const principal=await one(client,"INSERT INTO principals(principal_type,person_id) VALUES('HUMAN',$1) RETURNING id",[person.id]);
    executor={person_id:person.id,principal_id:principal.id};
  }else if(!executor.principal_id){
    const principal=await one(client,"INSERT INTO principals(principal_type,person_id) VALUES('HUMAN',$1) RETURNING id",[executor.person_id]);
    executor.principal_id=principal.id;
  }

  let organization=await one(client,"SELECT id FROM organizations WHERE kind='INSTITUTIONAL' AND name='Universo IMPAR' ORDER BY created_at LIMIT 1");
  if(!organization){
    organization=await one(client,"INSERT INTO organizations(name,created_by_person_id,kind,status) VALUES('Universo IMPAR',$1,'INSTITUTIONAL','ACTIVE') RETURNING id",[executor.person_id]);
  }else{
    await client.query("UPDATE organizations SET status='ACTIVE' WHERE id=$1",[organization.id]);
  }

  let membership=await one(client,"SELECT id FROM memberships WHERE person_id=$1 AND organization_id=$2",[executor.person_id,organization.id]);
  if(!membership){
    membership=await one(client,"INSERT INTO memberships(person_id,organization_id,status,created_by_person_id) VALUES($1,$2,'ACTIVE',$1) RETURNING id",[executor.person_id,organization.id]);
  }else{
    await client.query("UPDATE memberships SET status='ACTIVE' WHERE id=$1",[membership.id]);
  }
  for(const capability of ['impar.analysis.execute','impar.analysis.methodology.assign']){
    await client.query(`
      INSERT INTO grants(membership_id,capability_code,granted_by_person_id)
      SELECT $1,$2,$3
      WHERE NOT EXISTS(
        SELECT 1 FROM grants WHERE membership_id=$1 AND capability_code=$2 AND resource_id IS NULL AND revoked_at IS NULL
      )
    `,[membership.id,capability,executor.person_id]);
  }

  let methodology=await one(client,"SELECT id FROM methodologies WHERE key='impar-visual-presence'");
  if(!methodology){
    methodology=await one(client,"INSERT INTO methodologies(key,technical_name,status) VALUES('impar-visual-presence','IMPAR Visual Presence','ACTIVE') RETURNING id");
  }
  let methodologyVersion=await one(client,'SELECT id,content_hash,status FROM methodology_versions WHERE methodology_id=$1 AND version=1',[methodology.id]);
  if(!methodologyVersion){
    methodologyVersion=await one(client,`
      INSERT INTO methodology_versions(methodology_id,version,status,content_ref,content_hash,created_by_principal_id,published_by_principal_id,published_at)
      VALUES($1,1,'PUBLISHED',$2,$3,$4,$4,now()) RETURNING id,content_hash,status
    `,[methodology.id,methodologyMaterial.ref,methodologyMaterial.hash,executor.principal_id]);
  }else if(methodologyVersion.content_hash!==methodologyMaterial.hash){
    throw new Error('METHODOLOGY_V1_HASH_MISMATCH');
  }

  let source=await one(client,"SELECT id,content_hash FROM knowledge_sources WHERE label='IMPAR Visual Knowledge V1' ORDER BY created_at LIMIT 1");
  if(!source){
    source=await one(client,`
      INSERT INTO knowledge_sources(knowledge_scope,source_type,label,private_content_ref,content_hash,created_by_principal_id)
      VALUES('IMPAR','CURATED_DATASET','IMPAR Visual Knowledge V1',$1,$2,$3) RETURNING id,content_hash
    `,[knowledge.ref,knowledge.hash,executor.principal_id]);
  }else if(source.content_hash!==knowledge.hash){
    throw new Error('KNOWLEDGE_SOURCE_V1_HASH_MISMATCH');
  }

  let candidate=await one(client,'SELECT id,content_hash,status FROM knowledge_candidates WHERE source_id=$1 AND candidate_version=1',[source.id]);
  if(!candidate){
    candidate=await one(client,`
      INSERT INTO knowledge_candidates(source_id,knowledge_scope,candidate_version,private_content_ref,content_hash,status,created_by_principal_id)
      VALUES($1,'IMPAR',1,$2,$3,'PUBLISHED',$4) RETURNING id,content_hash,status
    `,[source.id,knowledge.ref,knowledge.hash,executor.principal_id]);
  }else if(candidate.content_hash!==knowledge.hash){
    throw new Error('KNOWLEDGE_CANDIDATE_V1_HASH_MISMATCH');
  }

  let authorized=await one(client,"SELECT id,candidate_id,content_hash FROM authorized_knowledge_versions WHERE knowledge_scope='IMPAR' AND version=1");
  if(!authorized){
    authorized=await one(client,`
      INSERT INTO authorized_knowledge_versions(candidate_id,knowledge_scope,version,status,private_content_ref,content_hash,published_by_principal_id,published_at)
      VALUES($1,'IMPAR',1,'PUBLISHED',$2,$3,$4,now()) RETURNING id,candidate_id,content_hash
    `,[candidate.id,knowledge.ref,knowledge.hash,executor.principal_id]);
  }else if(authorized.candidate_id!==candidate.id||authorized.content_hash!==knowledge.hash){
    throw new Error('AUTHORIZED_KNOWLEDGE_V1_CONFLICT');
  }
  await client.query(
    'INSERT INTO methodology_version_knowledge(methodology_version_id,authorized_knowledge_version_id) VALUES($1,$2) ON CONFLICT DO NOTHING',
    [methodologyVersion.id,authorized.id]
  );
