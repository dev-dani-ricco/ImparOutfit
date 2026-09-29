import { createApp } from '../src/app.js';
import { assertAuthConfig } from '../src/middleware/auth.js';
import { assertProductionConfig } from '../src/config/productionGuard.js';

assertAuthConfig();
assertProductionConfig();

export default createApp();
