const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
function node() {
  const classes = new Set();
  return {
    listeners: {}, children: [], dataset: {}, style: {},
    classList: { add: (...names) => names.forEach(n => classes.add(n)), remove: (...names) => names.forEach(n => classes.delete(n)), contains: n => classes.has(n), toggle(n, on) { if (on) classes.add(n); else classes.delete(n); } },
    append(...children) { this.children.push(...children); },
    setAttribute() {},
    addEventListener(name, fn) { this.listeners[name] = fn; },
    getBoundingClientRect: () => ({width: 192, height: 100})
  };
}
const item = node(); item.dataset.layoutItem = 'weather';
const body = node(); body.classList.add('layout-editing');
const canvas = node(); canvas.clientWidth = 2400; canvas.clientHeight = 1200;
const selection = node(), bar = node(), undo = node();
const document = {
  body, listeners: {}, createElement: node,
  querySelector: selector => ({'.canvas':canvas,'#editorSelection':selection,'#layoutEditBar':bar,'#undoLayoutEdit':undo})[selector] || null,
  querySelectorAll: selector => selector === '[data-layout-item]' ? [item] : selector === '.is-layout-selected' && item.classList.contains('is-layout-selected') ? [item] : [],
  addEventListener(name, fn) { this.listeners[name] = fn; },
  removeEventListener(name, fn) { if (this.listeners[name] === fn) delete this.listeners[name]; }
};
const context = {document,window:{matchMedia:()=>({matches:false})},setTimeout:()=>0,clearTimeout(){},structuredClone,console,assert,getComputedStyle:()=>({paddingLeft:'0',paddingRight:'0',paddingTop:'0',paddingBottom:'0'})};
vm.createContext(context);
const source = fs.readFileSync('newtab.js','utf8').replace(/init\(\);\s*$/, '');
vm.runInContext(source + `
settings = structuredClone(DEFAULTS);
renderWidgetLayout = () => {};
scheduleWidgetLayout = () => {};
saveSettings = () => {};
resetIdleTimer = () => {};
setupWidgetEditor();
`, context);
const down = {button:0,clientX:100,clientY:100,preventDefault(){},stopPropagation(){}};
item.children[0].listeners.pointerdown(down);
assert.ok(document.listeners.pointermove, 'drag starts without throwing');
document.listeners.pointermove({clientX:300,clientY:200});
assert.equal(vm.runInContext('settings.widgetLayout.weather.x',context),3);
assert.equal(vm.runInContext('settings.widgetLayout.weather.y',context),2);
document.listeners.pointerup();
assert.equal(document.listeners.pointermove,undefined);
item.children[1].listeners.pointerdown(down);
document.listeners.pointermove({clientX:200,clientY:200});
assert.equal(vm.runInContext('settings.widgetLayout.weather.w',context),3);
document.listeners.pointercancel();
assert.equal(body.classList.contains('layout-dragging'),false);
vm.runInContext('toggleLayoutEditor(false)', context);
assert.equal(item.classList.contains('is-layout-selected'),false);
assert.equal(bar.inert,true);
vm.runInContext('undoLayout()', context);
assert.equal(vm.runInContext('settings.widgetLayout.weather.w',context),2);
vm.runInContext('undoLayout()', context);
assert.equal(vm.runInContext('settings.widgetLayout.weather.x',context),1);
assert.equal(undo.disabled,true);
console.log('PASS: drag, resize, pointer cancellation, editor exit and undo history');
