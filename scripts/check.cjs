const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
process.chdir(root);
const read=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/^\uFEFF/,'');
const manifest=JSON.parse(read('manifest.json'));
assert.equal(manifest.manifest_version,3);
assert.match(manifest.version,/^\d+(\.\d+){0,3}$/);
assert.deepEqual(manifest.permissions,['storage','unlimitedStorage']);
const html=read('newtab.html'),css=read('styles.css');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'HTML ids must be unique');
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if(!/^(https?:|data:|blob:)/.test(match[1])) assert.ok(fs.existsSync(path.join(root,match[1])),'Missing '+match[1]);
}
for(const match of css.replace(/url\("data:[^"]*"\)/g, "").matchAll(/url\(["']?([^\s"')]+)["']?\)/g)) {
  if(!/^(https?:|data:|blob:|#)/.test(match[1])) assert.ok(fs.existsSync(path.join(root,match[1])),'Missing CSS asset '+match[1]);
}
for(const [size,file] of Object.entries(manifest.icons)) {
  const png=fs.readFileSync(path.join(root,file));
  assert.equal(png.subarray(1,4).toString(),'PNG');
  assert.equal(png.readUInt32BE(16),Number(size));assert.equal(png.readUInt32BE(20),Number(size));
}
for(const file of ['newtab.js','snow-drifts.js','tests/browser.cjs','scripts/package.cjs']) {
  const result=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});assert.equal(result.status,0,file+' syntax');
}
for(const file of ['tests/settings-weather.cjs','tests/layout-editor.cjs','tests/bookmark-actions.cjs','tests/snow-drifts.cjs','tests/snowfall.cjs']) {
  const result=spawnSync(process.execPath,[file],{stdio:'inherit'});assert.equal(result.status,0,file);
}
console.log('PASS: manifest, unique IDs, local assets, release icons, syntax and regression tests');
