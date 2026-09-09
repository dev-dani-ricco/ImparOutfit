import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import SwaggerParser from '@apidevtools/swagger-parser';
import YAML from 'yaml';

test('OpenAPI validates and covers every implemented API method/path',async()=>{
  const spec=YAML.parse(await readFile(new URL('../../docs/openapi.yaml',import.meta.url),'utf8'));
  await SwaggerParser.validate(structuredClone(spec));
  const source=await readFile(new URL('../src/routes/index.js',import.meta.url),'utf8');
  for(const match of source.matchAll(/r\.(get|post|put|delete)\('([^']+)'/g)) {
    const path=match[2].replace(/:([A-Za-z]+)/g,'{$1}');
    assert.ok(spec.paths[path]?.[match[1]],match[1]+' '+path+' missing from contract');
  }
  assert.equal(spec.paths['/items/{id}/copy-to-wardrobe'].post.deprecated,true);
  assert.ok(spec.paths['/items/{id}/copy-to-wardrobe'].post.responses['410']);
  assert.ok(spec.components.securitySchemes.bearerAuth);
});
