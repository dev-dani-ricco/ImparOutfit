import { resolve } from 'node:path';
import { LocalStorage } from './localStorage.js';
import { S3Storage } from './s3Storage.js';

export function createStorage(env=process.env){
  const external=Boolean(env.MEDIA_BUCKET&&env.AWS_ENDPOINT_URL_S3&&env.AWS_REGION);
  if(external) return new S3Storage({bucket:env.MEDIA_BUCKET,endpoint:env.AWS_ENDPOINT_URL_S3,region:env.AWS_REGION});
  return new LocalStorage(env.MEDIA_ROOT||resolve('private/media'));
}
