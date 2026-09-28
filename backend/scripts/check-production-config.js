import 'dotenv/config';
import { assertProductionConfig } from '../src/config/productionGuard.js';

assertProductionConfig();
console.log('PRODUCTION_CONFIG_GUARD=PASS');
