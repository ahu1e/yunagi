const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const elements=new Map();
function element(){return {style:{setProperty(){}},classList:{contains(){return false},add(){},remove(){},toggle(){}},textContent:'',innerHTML:'',setAttribute(k,v){this[k]=v},append(){},replaceChildren(){},getBoundingClientRect(){return {width:100,height:100}},querySelector(){return element()},querySelectorAll(){return []}}}
const document={body:element(),querySelector(key){if(!elements.has(key))elements.set(key,element());return elements.get(key)},querySelectorAll(){return []}};
const store=new Map();
const context={AbortController,console,URL,URLSearchParams,structuredClone,Map,Set,Date,JSON,Math,Number,String,Object,Array,Promise,document,window:{matchMedia:()=>({matches:false})},setTimeout:()=>0,clearTimeout(){},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},assert};
vm.createContext(context);
let source=fs.readFileSync('newtab.js','utf8').replace(/init\(\);\s*$/,'');
source+=`\n(async()=>{
 settings=structuredClone(DEFAULTS); savedSettings=structuredClone(settings);
 const writes=[]; let listener;
 globalThis.chrome={storage:{local:{set:async p=>writes.push(structuredClone(p)),get:async()=>({})},onChanged:{addListener:fn=>listener=fn}}};
 settings.city='Paris'; await saveSettings(); assert.equal(Object.keys(writes[0]).join(),'city');
 settings.widgetSizes.clock=120;await saveSettings();assert.equal(writes[1].widgetSizes.clock,120);assert.equal(writes[1].city,undefined);
 setupSettingsSync();refreshSettingsView=()=>{};
 await listener({brightness:{newValue:90}},'local');assert.equal(settings.brightness,90);
 settings.city='London';await listener({city:{newValue:'Berlin'}},'local');assert.equal(settings.city,'London');
 const imported=normalizeImportedSettings({hiddenWidgets:['clock','unknown','clock'],position:'50% 37%'});assert.equal(imported.hiddenWidgets.join(),'clock');assert.equal(imported.position,'50% 37%');assert.equal(normalizeImportedSettings({surfaceStyle:'frosted'}).surfaceStyle,'frosted');assert.equal(normalizeImportedSettings({surfaceStyle:'invalid'}).surfaceStyle,'metal');
 settings.city='Tokyo';const data={city:'Tokyo',place:{name:'Tokyo',latitude:1,longitude:1},at:Date.now(),timeseries:[{time:new Date().toISOString(),data:{instant:{details:{air_temperature:18}},next_1_hours:{summary:{symbol_code:'clearsky_day'}}}}]};
 localStorage.setItem(WEATHER_CACHE_KEY,JSON.stringify(data));let requests=0;globalThis.fetch=async()=>{requests++;throw Error('offline')};
 await updateWeather();assert.equal(requests,0);assert.equal(document.querySelector('#weatherTemp').textContent,'18°');
 await updateWeather(true);assert.equal(requests,1);assert.equal(document.querySelector('#weatherTemp').textContent,'18°');assert.ok(document.querySelector('.weather-card').title.includes('Последний прогноз'));
 const zero=normalizeImportedSettings({shade:0,showCaption:false,brightness:Infinity});
 assert.equal(zero.shade,0);assert.equal(zero.showCaption,false);assert.equal(zero.brightness,DEFAULTS.brightness);
 const originalSet=chrome.storage.local.set;
 chrome.storage.local.set=async()=>{throw Error('storage quota')};
 const reported=[];const logError=console.error;console.error=(...args)=>reported.push(args);
 settings.shade=12;const failed=await saveSettings();console.error=logError;assert.equal(failed,false);assert.equal(reported.length,1);
 chrome.storage.local.set=originalSet;assert.equal(await saveSettings(),true);
 settings.focusNote='Last keystroke';focusNoteSaveTimer=123;pendingSaveTimer=0;
 flushPendingSave();await saveQueue;assert.equal(writes.at(-1).focusNote,'Last keystroke');
 assert.equal(focusNoteSaveTimer,0);
 assert.ok(weatherSvg('☀').includes('<svg'));assert.equal(compareVersions('2.0.1','2.0'),1);

 const panel=document.querySelector('#weatherPanel');let opened=0,closed=0;
 panel.showModal=()=>opened++;panel.close=()=>closed++;
 renderWeatherPanel=()=>{};hideIdleClock=()=>{};resetIdleTimer=()=>{};
 document.querySelector('#closeWeather').focus=()=>{};
 toggleWeatherPanel(true);assert.equal(opened,1);assert.equal(weatherPanelOpen,true);
 toggleWeatherPanel(false);assert.equal(closed,1);assert.equal(weatherPanelOpen,false);
 console.log('PASS: changed-field writes, nested edits, cross-tab updates, unsaved edit protection, backup normalization, weather cache, offline fallback, SVG and versions');
})()`;
vm.runInContext(source,context).catch(e=>{console.error(e);process.exitCode=1});

