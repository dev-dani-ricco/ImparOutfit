import cloudinary from '../config/cloudinary.js';
export async function uploadBuffer(buffer, folder='imparoutfit'){
  if(!process.env.CLOUDINARY_CLOUD_NAME) return { url: `https://placehold.co/800x1000?text=${folder}`, publicId: null };
  return new Promise((resolve,reject)=>{
    const stream = cloudinary.uploader.upload_stream({ folder }, (err,result)=> err ? reject(err) : resolve({ url: result.secure_url, publicId: result.public_id }));
    stream.end(buffer);
  });
}
