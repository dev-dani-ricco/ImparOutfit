const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const ratio=(value,base)=>Number(value||base)/base;

const categoryConfig={
 TOP:{ease:[1.04,1.015,1.055],anchor:[0,.72,.01],label:'Parte superior'},
 PANTS:{ease:[1.045,1.01,1.055],anchor:[0,.405,.005],label:'Parte inferior'},
 DRESS:{ease:[1.055,1.012,1.065],anchor:[0,.56,.01],label:'Vestido'},
 FOOTWEAR:{ease:[1.02,1,1.02],anchor:[.10,.055,.025],label:'Calçado'},
 BAG:{ease:[1,1,1],anchor:[.29,.44,.07],label:'Bolsa'},
 ACCESSORY:{ease:[1,1,1],anchor:[0,.80,.09],label:'Acessório'},
};

export const FABRIC_CLASSES={
 RIGID:{label:'Rígido',ease:[1.012,1,1.012],allowance:1.18},
 STRUCTURED:{label:'Estruturado',ease:[1.008,1,1.01],allowance:1.08},
 KNIT:{label:'Malha',ease:[.995,1,.995],allowance:.72},
 FLUID:{label:'Fluido',ease:[1.004,1,1.008],allowance:.9},
};

export function garmentFitProfile(category,spec={},options={}){
 const c=categoryConfig[category]||categoryConfig.TOP;
 const m=spec.measurements||{};
 const b=spec.body||{};
 const bust=ratio(m.bust,94),waist=ratio(m.waist,76),hips=ratio(m.hips,104),height=ratio(spec.heightCm,168);
 let bodyScale=[1,1,1];
 if(category==='TOP') bodyScale=[Math.max(bust,.92+(b.shoulders||.5)*.16),height,bust];
 else if(category==='PANTS') bodyScale=[hips,height,Math.max(waist,hips)];
 else if(category==='DRESS') bodyScale=[Math.max(bust,hips),height,Math.max(bust,hips)];
 else if(category==='FOOTWEAR') bodyScale=[1,Math.sqrt(height),1];

 const fabricKey=String(options.fabricClass||'STRUCTURED').toUpperCase();
 const fabric=FABRIC_CLASSES[fabricKey]||FABRIC_CLASSES.STRUCTURED;
 const scale=bodyScale.map((v,i)=>clamp(v*c.ease[i]*fabric.ease[i],.82,1.30));
 const baseAllowance=category==='TOP'||category==='DRESS'
   ? clamp(.008+Math.max(0,bust-1)*.018,.006,.026)
   : category==='PANTS'
     ? clamp(.008+Math.max(0,hips-1)*.018,.006,.026)
     : .004;
 const silhouetteAllowance=clamp(baseAllowance*fabric.allowance,.003,.032);

 return {
   version:3,
   label:c.label,
   scale,
   anchor:c.anchor,
   fabricClass:fabricKey,
   fabricLabel:fabric.label,
   silhouetteAllowance,
   method:'MEASUREMENT_FABRIC_EASE_V3',
   disclaimer:'Prévia proporcional por medidas, categoria e classe de tecido; não simula pressão, queda, deformação ou colisão física.'
 };
}

export function normalizeGarmentMaterials(root){
 root?.traverse?.((object)=>{
   if(!object.isMesh)return;
   const materials=(Array.isArray(object.material)?object.material:[object.material]).filter(Boolean);
   const next=materials.map((material)=>{
     const m=material.clone?.()||material;
     if('metalness' in m && !Number.isFinite(m.metalness))m.metalness=0;
     if('roughness' in m)m.roughness=clamp(Number.isFinite(m.roughness)?m.roughness:.62,.18,.96);
     if(m.map)m.map.colorSpace='srgb';
     m.needsUpdate=true;
     return m;
   });
   object.material=Array.isArray(object.material)?next:next[0];
   object.castShadow=true;
   object.receiveShadow=true;
 });
 return root;
}
