import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function validateKey(key){
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|glb)$/.test(key)) throw new Error('Invalid storage key');
  return key;
}

export class S3Storage {
  constructor({bucket=process.env.MEDIA_BUCKET,endpoint=process.env.AWS_ENDPOINT_URL_S3,region=process.env.AWS_REGION}={}){
    if(!bucket||!endpoint||!region) throw new Error('S3 storage requires MEDIA_BUCKET, AWS_ENDPOINT_URL_S3 and AWS_REGION');
    this.bucket=bucket;
    this.client=new S3Client({endpoint,region,forcePathStyle:true});
  }
  async put(key,buffer,contentType='application/octet-stream'){
    await this.client.send(new PutObjectCommand({Bucket:this.bucket,Key:validateKey(key),Body:buffer,ContentType:contentType,CacheControl:'private, no-store'}));
  }
  async get(key){
    const result=await this.client.send(new GetObjectCommand({Bucket:this.bucket,Key:validateKey(key)}));
    if(!result.Body) throw new Error('Storage object has no body');
    return Buffer.from(await result.Body.transformToByteArray());
  }
  async delete(key){
    await this.client.send(new DeleteObjectCommand({Bucket:this.bucket,Key:validateKey(key)}));
  }
  async getSignedReadUrl(key,{expiresIn=60}={}){
    return getSignedUrl(this.client,new GetObjectCommand({Bucket:this.bucket,Key:validateKey(key)}),{expiresIn});
  }
}
