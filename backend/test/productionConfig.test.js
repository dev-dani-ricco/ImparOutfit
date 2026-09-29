import test from 'node:test';
import assert from 'node:assert/strict';
import { productionConfigErrors, assertProductionConfig } from '../src/config/productionGuard.js';

const valid={
  NODE_ENV:'production',
  DATABASE_URL:'postgres://app:strong@db.internal:5432/impar',
  JWT_SECRET:'x'.repeat(64),
  MEDIA_ROOT:'C:\\durable\\impar-media',
  CORS_ORIGIN:'https://app.imparoutfit.com',
  TRUST_PROXY_HOPS:'1',
  HOST:'0.0.0.0'
};

test('production config accepts explicit distributed settings',()=>{
  assert.deepEqual(productionConfigErrors(valid),[]);
  assert.equal(assertProductionConfig(valid),true);
});

test('production config accepts Neon-compatible private S3 storage',()=>{
  const external={...valid,MEDIA_ROOT:undefined,MEDIA_BUCKET:'impar-media',AWS_ENDPOINT_URL_S3:'https://storage.example.com',AWS_REGION:'us-east-2',AWS_ACCESS_KEY_ID:'key',AWS_SECRET_ACCESS_KEY:'secret-value'};
  assert.deepEqual(productionConfigErrors(external),[]);
});

test('production config rejects local, weak or unsafe fallbacks',()=>{
  const errors=productionConfigErrors({
    ...valid,
    DATABASE_URL:'postgres://app:pass@localhost:5432/impar',
    JWT_SECRET:'change-me-with-a-long-random-secret',
    MEDIA_ROOT:'./private/media',
    CORS_ORIGIN:'http://localhost:8081',
    TRUST_PROXY_HOPS:'0',
    PGLITE_DATA_DIR:'memory://',
    HOST:'127.0.0.1'
  });
  for(const code of [
    'DATABASE_URL_LOOPBACK_FORBIDDEN',
    'JWT_SECRET_WEAK_OR_MISSING',
    'MEDIA_ROOT_MUST_BE_ABSOLUTE',
    'CORS_ORIGIN_HTTPS_REQUIRED',
    'TRUST_PROXY_HOPS_REQUIRED',
    'PGLITE_FORBIDDEN_IN_PRODUCTION',
    'HOST_MUST_BIND_ALL_INTERFACES'
  ]) assert.ok(errors.includes(code),code);
});
