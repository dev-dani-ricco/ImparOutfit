import { runRequestOnce } from './requestWorker.js';
import { runProductionOnce } from './worker.js';
import { recoverExpired } from './jobService.js';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export function startAnalysisSupervisor({
  intervalMs = Number.parseInt(process.env.IMPAR_ANALYSIS_POLL_MS || '1500', 10)
} = {}) {
  let stopped = false;
  let running = false;

  async function tick() {
    if (stopped || running) return;
    running = true;
    try {
      await recoverExpired();
      let progressed = false;

      const request = await runRequestOnce();
      if (request) progressed = true;

      const job = await runProductionOnce();
      if (job) progressed = true;

      if (progressed) {
        // Drain newly available work without waiting for the normal poll interval.
        await delay(25);
      }
    } catch (error) {
      // Keep the supervisor alive; domain workers persist their own sanitized failure codes.
      console.error('Analysis supervisor cycle failed:', error?.message || 'unknown error');
    } finally {
      running = false;
      if (!stopped) setTimeout(tick, Math.max(250, intervalMs));
    }
  }

  tick();

  return {
    stop() { stopped = true; },
    get running() { return running; }
  };
}
