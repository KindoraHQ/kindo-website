// TESTNET fixture migration only. No signer, upload, or broadcast capability.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { AbiCoder, keccak256, concat } from 'ethers';
import { KINDO_ALLOCATION, PUBLIC_SUPPLY, TOTAL_SUPPLY, publicRarityNumber } from './kindo-allocation.mjs';
const cid = 'bafybeihc354mcflw3tlfo26brl4sipvesygp6a4qfwdo7wolyne6yy6ygq';
const out = path.resolve('testnet/epoch-package');
const cache = path.resolve('testnet/epoch-source');
const names = ['Common','Uncommon','Rare','Epic','Legendary','Mythic','Genius'];
const rarity = publicRarityNumber;
const abi = AbiCoder.defaultAbiCoder();
// Optional original upload directory avoids public-gateway throttling. No secrets.
const sourceDir = process.argv[2] ? path.resolve(process.argv[2]) : null;
await fs.mkdir(path.join(out,'metadata'),{recursive:true});
await fs.mkdir(cache,{recursive:true});
async function source(id) {
  if(sourceDir) return JSON.parse(await fs.readFile(path.join(sourceDir,id<=553?'metadata':'reserved',`${id}.json`),'utf8'));
  const file=path.join(cache,`${id}.json`);
  try { return JSON.parse(await fs.readFile(file,'utf8')); } catch(e) { if(e.code!=='ENOENT') throw e; }
  const route=id<=553?'metadata':'reserved';
  for(let attempt=0;attempt<6;attempt++) {
    try {
      const r=await fetch(`https://gateway.pinata.cloud/ipfs/${cid}/${route}/${id}.json`,{signal:AbortSignal.timeout(25000)});
      if(!r.ok) throw Error(`HTTP ${r.status}`);
      const raw=await r.text(); const j=JSON.parse(raw);
      await fs.writeFile(file,raw,{flag:'wx'}); return j;
    } catch(e) { if(attempt===5) throw Error(`Source ${id}: ${e.message}`); await new Promise(r=>setTimeout(r,Math.min(2000*2**attempt,30000))); }
  }
}
const entries=Array(TOTAL_SUPPLY); const changes=[]; let next=1,done=0;
await Promise.all(Array.from({length:1},async()=>{
  for(;;){const id=next++;if(id>TOTAL_SUPPLY)return;
    const j=await source(id); const attr=j.attributes.find(x=>x.trait_type==='Rarity');
    assert(attr,`Missing rarity ${id}`); const old=attr.value; const wanted=names[rarity(id)-1];
    assert(j.image.startsWith('data:image/svg+xml;base64,'),`Unexpected image ${id}`);
    let svg=Buffer.from(j.image.split(',')[1],'base64').toString('utf8');
    assert(!/<script|<foreignObject|href\s*=/i.test(svg),`Unsafe SVG ${id}`);
    if(old!==wanted){
      assert(svg.includes(`>${old}<`),`Missing image rarity label ${id}`);
      svg=svg.replace(`>${old}<`,`>${wanted}<`); attr.value=wanted;
      j.image='data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64');
      changes.push({id,from:old,to:wanted});
    }
    const bytes=Buffer.from(JSON.stringify(j,null,2)+'\n');
    await fs.writeFile(path.join(out,'metadata',`${id}.json`),bytes);
    const hash=keccak256(bytes);
    entries[id-1]={id,rarity:rarity(id),name:wanted,metadataHash:hash,leaf:keccak256(keccak256(abi.encode(['uint256','uint8','bytes32'],[id,rarity(id),hash])))};
    if(++done%50===0)console.log(`Prepared ${done}/555`);
  }
}));
const layers=[entries.map(e=>e.leaf)];
while(layers.at(-1).length>1){const prev=layers.at(-1),row=[];for(let i=0;i<prev.length;i+=2)row.push(i+1===prev.length?prev[i]:keccak256(concat([prev[i],prev[i+1]].sort())));layers.push(row);}
const root=layers.at(-1)[0];
for(const e of entries){let index=e.id-1;e.proof=[];for(const row of layers.slice(0,-1)){const sibling=index^1;if(sibling<row.length)e.proof.push(row[sibling]);index=Math.floor(index/2);}let h=e.leaf;for(const p of e.proof)h=keccak256(concat([h,p].sort()));assert.equal(h,root);}
const counts=Object.fromEntries(names.map(n=>[n,entries.filter(e=>e.name===n).length]));
assert.deepEqual(counts,KINDO_ALLOCATION);
const manifest={schema:'KINDO-EPOCH-TESTNET-PACKAGE-V1',sourceCID:cid,chainId:46630,publicSupply:PUBLIC_SUPPLY,reserved:[554,555],publicGenius:553,root,counts,metadataEncoding:'Exact UTF-8 JSON.stringify(object,null,2) plus LF; hash uploaded bytes, not reparsed JSON',leaf:'keccak256(keccak256(abi.encode(uint256 id,uint8 rarity,bytes32 keccak256(metadataBytes))))',node:'keccak256(sorted raw bytes32 pair)',oddNode:'promote unchanged',leaves:'555 leaves in ascending package ID',entries};
await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile(path.resolve('testnet/epoch-package-changes.json'),JSON.stringify({contractChanged:false,sourceCID:cid,root,counts,rarityChanges:changes.sort((a,b)=>a.id-b.id),reservedPathChange:'reserved/554.json and reserved/555.json -> metadata/554.json and metadata/555.json',uploadStatus:'PENDING - new CID required'},null,2)+'\n');
console.log(JSON.stringify({root,counts,rarityChanges:changes.length,proofsVerified:555,output:out,uploadStatus:'PENDING'}));
