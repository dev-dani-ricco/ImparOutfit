import 'dotenv/config';
import { query, pool } from '../src/config/db.js';

const checks = {
  methodology: "SELECT count(*)::int n FROM methodology_versions WHERE status='PUBLISHED'",
  knowledge: "SELECT count(*)::int n FROM authorized_knowledge_versions WHERE status='PUBLISHED'",
  prompt: "SELECT count(*)::int n FROM prompt_versions WHERE status='PUBLISHED'",
  policy: "SELECT count(*)::int n FROM ai_policy_versions WHERE status='PUBLISHED'",
  requests: "SELECT count(*)::int n FROM impar_analysis_requests",
  jobs: "SELECT count(*)::int n FROM impar_analysis_jobs"
};

let ok = true;
try {
  for (const [name, sql] of Object.entries(checks)) {
    try {
      const n = (await query(sql)).rows[0]?.n ?? 0;
      console.log(`${name.toUpperCase()}=${n}`);
      if (['methodology','knowledge','prompt','policy'].includes(name) && Number(n) < 1) ok = false;
    } catch (error) {
      ok = false;
      console.log(`${name.toUpperCase()}=ERROR`);
    }
  }
  console.log(`PRIVATE_CONTENT_ROOT=${process.env.IMPAR_PRIVATE_CONTENT_ROOT ? 'CONFIGURED' : 'MISSING'}`);
  console.log(`OMNIROUTE=${process.env.OMNIROUTE_BASE_URL && process.env.OMNIROUTE_API_KEY ? 'CONFIGURED' : 'MISSING'}`);
  console.log(`READY=${ok ? 'YES' : 'NO'}`);
} finally {
  await pool.end();
}
