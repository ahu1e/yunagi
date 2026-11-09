// Dependency-free release ZIP with an explicit runtime-only file list.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');process.chdir(root);
const checked=spawnSync(process.execPath,['scripts/check.cjs'],{stdio:'inherit'});
if(checked.status!==0)process.exit(checked.status||1);
const manifest=JSON.parse(fs.readFileSync('manifest.json','utf8'));
const assets=fs.readdirSync('assets').filter(file=>fs.statSync(path.join('assets',file)).isFile()).map(file=>'assets/'+file);
const files=['manifest.json','newtab.html','newtab.js','snow-drifts.js','styles.css','Image.webp',...assets].sort();
const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0});
const crc32=buffer=>{let crc=0xffffffff;for(const byte of buffer)crc=crcTable[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0};
const local=[],central=[];let offset=0;
for(const file of files){
  const name=Buffer.from(file),data=fs.readFileSync(file),compressed=zlib.deflateRawSync(data,{level:9}),crc=crc32(data);
  const header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt16LE(8,8);header.writeUInt16LE(33,12);header.writeUInt32LE(crc,14);header.writeUInt32LE(compressed.length,18);header.writeUInt32LE(data.length,22);header.writeUInt16LE(name.length,26);
  local.push(header,name,compressed);
  const directory=Buffer.alloc(46);directory.writeUInt32LE(0x02014b50);directory.writeUInt16LE(20,4);directory.writeUInt16LE(20,6);directory.writeUInt16LE(0x800,8);directory.writeUInt16LE(8,10);directory.writeUInt16LE(33,14);directory.writeUInt32LE(crc,16);directory.writeUInt32LE(compressed.length,20);directory.writeUInt32LE(data.length,24);directory.writeUInt16LE(name.length,28);directory.writeUInt32LE(offset,42);central.push(directory,name);offset+=header.length+name.length+compressed.length;
}
const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
const zip=Buffer.concat([...local,directory,end]);fs.mkdirSync('dist',{recursive:true});
const output=`dist/yunagi-${manifest.version}.zip`;fs.writeFileSync(output,zip);fs.writeFileSync(output+'.sha256',crypto.createHash('sha256').update(zip).digest('hex')+'  '+path.basename(output)+'\n');
console.log(`Built ${output} (${zip.length} bytes, ${files.length} files); tests, docs and development files excluded.`);
