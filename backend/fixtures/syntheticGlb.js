// Synthetic non-flat grid, exclusively for binary/renderer tests. Never a captured item.
export function syntheticGlb(){
 const n=16,positions=[],colors=[],indices=[];
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){positions.push(x/60-.125,y/50-.15,.025*Math.sin(x/3)+.015*Math.cos(y/4));colors.push(.2,.4+y/50,.8);}
 for(let y=0;y<n-1;y++)for(let x=0;x<n-1;x++){const a=y*n+x;indices.push(a,a+1,a+n,a+1,a+n+1,a+n);}
 const p=Buffer.from(new Float32Array(positions).buffer),c=Buffer.from(new Float32Array(colors).buffer),i=Buffer.from(new Uint32Array(indices).buffer),bin=Buffer.concat([p,c,i]);
 const doc={asset:{version:'2.0',generator:'SYNTHETIC_RENDERER_CONTROL'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],buffers:[{byteLength:bin.length}],
 bufferViews:[{buffer:0,byteOffset:0,byteLength:p.length},{buffer:0,byteOffset:p.length,byteLength:c.length},{buffer:0,byteOffset:p.length+c.length,byteLength:i.length}],
 accessors:[{bufferView:0,componentType:5126,count:n*n,type:'VEC3',min:[-.125,-.15,-.04],max:[.125,.15,.04]},{bufferView:1,componentType:5126,count:n*n,type:'VEC3'},{bufferView:2,componentType:5125,count:indices.length,type:'SCALAR'}],meshes:[{primitives:[{attributes:{POSITION:0,COLOR_0:1},indices:2,mode:4}]}]};
 let json=Buffer.from(JSON.stringify(doc));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);
 const h=Buffer.alloc(20);h.write('glTF');h.writeUInt32LE(2,4);h.writeUInt32LE(28+json.length+bin.length,8);h.writeUInt32LE(json.length,12);h.writeUInt32LE(0x4e4f534a,16);
 const bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);return Buffer.concat([h,json,bh,bin]);
}
