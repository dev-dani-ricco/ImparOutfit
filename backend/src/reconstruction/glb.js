// Restricted self-contained GLB profile produced by the local worker; no external URIs.
export function inspectGlb(buffer){
 if(buffer.length<28||buffer.toString('ascii',0,4)!=='glTF'||buffer.readUInt32LE(4)!==2||buffer.readUInt32LE(8)!==buffer.length)throw new Error('INVALID_GLB');
 const n=buffer.readUInt32LE(12);
 if(n>4*1024*1024||20+n+8>buffer.length||buffer.readUInt32LE(16)!==0x4e4f534a)throw new Error('INVALID_GLB_JSON');
 const doc=JSON.parse(buffer.toString('utf8',20,20+n));
 if(doc.buffers?.length!==1||doc.buffers[0].uri||doc.images?.some(i=>i.uri)||doc.extensionsRequired?.length)throw new Error('EXTERNAL_OR_UNSUPPORTED_GLB');
 const offset=20+n,bin=buffer.subarray(offset+8);
 if(buffer.readUInt32LE(offset+4)!==0x004e4942||buffer.readUInt32LE(offset)!==bin.length)throw new Error('INVALID_GLB_BIN');
 const bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
 let triangles=0,vertices=0,invalidGeometry=0;
 function access(id,size){
  const a=doc.accessors?.[id],v=doc.bufferViews?.[a?.bufferView];
  if(!a||!v||v.buffer!==0||a.sparse||!Number.isInteger(a.count)||a.count<1)throw new Error('INVALID_ACCESSOR');
  const start=(v.byteOffset??0)+(a.byteOffset??0),stride=v.byteStride??size;
  if(![start,stride,v.byteLength,v.byteOffset??0,a.byteOffset??0].every(Number.isSafeInteger)||stride<size||start<0||v.byteLength<0||start+(a.count-1)*stride+size>bin.length||start+(a.count-1)*stride+size>(v.byteOffset||0)+v.byteLength)throw new Error('ACCESSOR_BOUNDS');
  return {a,start,stride};
 }
 for(const mesh of doc.meshes||[])for(const p of mesh.primitives||[]){
  if((p.mode??4)!==4)throw new Error('NOT_TRIANGLES');
  const {a,start,stride}=access(p.attributes.POSITION,12);
  if(a.componentType!==5126||a.type!=='VEC3')throw new Error('POSITION_PROFILE');
  for(let i=0;i<a.count;i++)for(let axis=0;axis<3;axis++){
   const x=bin.readFloatLE(start+i*stride+axis*4);if(!Number.isFinite(x))throw new Error('NONFINITE_GEOMETRY');
   bounds.min[axis]=Math.min(bounds.min[axis],x);bounds.max[axis]=Math.max(bounds.max[axis],x);
  }
  vertices+=a.count;
  const ix=doc.accessors[p.indices];const size=ix?.componentType===5125?4:ix?.componentType===5123?2:0;
  if(!size||ix.type!=='SCALAR'||ix.count%3)throw new Error('INDEX_PROFILE');
  const ia=access(p.indices,size);
  for(let i=0;i<ix.count;i++){const at=ia.start+i*ia.stride;const v=size===4?bin.readUInt32LE(at):bin.readUInt16LE(at);if(v>=a.count)throw new Error('INDEX_BOUNDS');}
  const index=i=>size===4?bin.readUInt32LE(ia.start+i*ia.stride):bin.readUInt16LE(ia.start+i*ia.stride);
  const point=i=>[0,1,2].map(k=>bin.readFloatLE(start+i*stride+k*4));
  for(let i=0;i<ix.count;i+=3){
   const [a,b,c]=[index(i),index(i+1),index(i+2)].map(point);
   const u=b.map((v,k)=>v-a[k]),v=c.map((v,k)=>v-a[k]);
   const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
   if(cross.every(v=>v===0)||cross.some(v=>!Number.isFinite(v)))invalidGeometry++;
  }
  triangles+=ix.count/3;
 }
 if(!vertices||bounds.max.some((v,i)=>v-bounds.min[i]<=1e-6))throw new Error('NO_SPATIAL_GEOMETRY');
 // Worker bakes transforms; avoid scale ambiguity from arbitrary scene graphs.
 if(doc.nodes?.some(n=>n.matrix||n.translation||n.rotation||n.scale))throw new Error('UNBAKED_TRANSFORMS');
 return {vertices,triangles,bounds,invalidGeometry,material:'VERTEX_COLOR',format:'GLB_2'};
}
