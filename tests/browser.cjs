const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8').replace(/^\uFEFF/, ''));
const server = http.createServer((req, res) => {
  const filename = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!filename.startsWith(root + path.sep) || !fs.existsSync(filename) || fs.statSync(filename).isDirectory()) { res.writeHead(404); res.end(); return; }
  const type = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'}[path.extname(filename)] || 'application/octet-stream';
  res.writeHead(200, {'Content-Type':type,'Content-Security-Policy':manifest.content_security_policy.extension_pages}); res.end(fs.readFileSync(filename));
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const executablePath = process.env.CHROME_PATH || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);
  const browser = await chromium.launch({headless:true, ...(executablePath ? {executablePath} : {})});
  const context = await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  await context.addInitScript(() => { window.__cspViolations=[]; document.addEventListener('securitypolicyviolation', event => window.__cspViolations.push(event.violatedDirective)); });
  const errors = [];
  const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
  const places = [{name:'Париж',latitude:48.85,longitude:2.35,admin1:'Иль-де-Франс',country:'Франция'},{name:'Париж',latitude:33.66,longitude:-95.55,admin1:'Техас',country:'США'}];
  await context.route('https://**/*', async route => {
    const url=route.request().url();
    if(url.includes('geocoding-api')) return route.fulfill({json:{results:places}});
    if(url.includes('api.met.no')) return route.fulfill({json:{properties:{timeseries:Array.from({length:8},(_,i)=>({time:new Date(Date.now()+i*3600000).toISOString(),data:{instant:{details:{air_temperature:10+i,relative_humidity:80,wind_speed:3}},next_1_hours:{summary:{symbol_code:'rain'}}}}))}}});
    if(url.includes('raw.githubusercontent.com')) return route.fulfill({json:{version:manifest.version}});
    return route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')});
  });
  try {
    await page.goto(base+'/newtab.html');
    await page.locator('#weatherTemp').filter({hasText:'10°'}).waitFor();
    await page.waitForFunction(()=>document.body.classList.contains('assets-ready'));
    await page.locator('#openGeneralSettings').click();
    await page.locator('#drawerNav button').filter({hasText:'Избранное'}).click();
    await page.locator('.bookmark-edit-row input[type="text"]').first().fill('Video');
    await page.locator('.bookmark-edit-row input[type="url"]').first().focus();
    assert.equal(await page.locator('#bookmarkGrid .bookmark-name').first().textContent(),'Video');
    await page.locator('.bookmark-icon-details summary').first().click();
    await page.locator('.bookmark-edit-tools input[type="text"]').first().fill('★');
    await page.locator('.bookmark-edit-tools input[type="color"]').first().focus();
    assert.equal(await page.locator('#bookmarkGrid .bookmark-icon').first().textContent(),'★');
    await page.locator('#drawerNav button').filter({hasText:'Погода'}).click();
    await page.getByRole('searchbox',{name:'Найти город'}).fill('Париж');
    await page.locator('.city-result').filter({hasText:'Техас'}).click();
    await page.waitForFunction(()=>settings.cityLocation?.longitude === -95.55);
    await page.locator('#drawerNav button').filter({hasText:'Общие'}).click();
    await page.getByRole('button',{name:'Внешний вид',exact:true}).click();
    for(const theme of ['metal','frosted','clear']) {
      await page.locator(`[data-surface-choice="${theme}"]`).click();
      assert.equal(await page.locator('html').getAttribute('data-surface'),theme);
    }
    await page.locator('#closeDrawer').click();
    fs.mkdirSync(path.join(root,'.test-artifacts'),{recursive:true});
    for (const theme of ['metal','frosted','clear']) {
      await page.evaluate(theme => { settings.surfaceStyle=theme; applyAppearanceVars(); }, theme);
      for (const backdrop of ['bright','dark']) {
        await page.evaluate(backdrop => { document.querySelector('.wallpaper').style.backgroundImage = backdrop === 'bright' ? 'linear-gradient(45deg,#fff,#e6edf3)' : 'linear-gradient(45deg,#07090b,#171a20)'; }, backdrop);
        await page.screenshot({animations:"disabled",path:path.join(root,'.test-artifacts',theme+'-'+backdrop+'.png')});
      }
    }
    await page.evaluate(()=>{updateWallpaperImage(); document.querySelector('.wallpaper').style.backgroundImage='url("Image.webp")';});
    await page.locator('.weather-card').click();
    await page.locator('#weatherPanel').waitFor({state:'visible'});
    assert.ok(await page.evaluate(()=>{const p=document.querySelector('#weatherPanel');return p.scrollWidth<=p.clientWidth+1}),'weather has no horizontal overflow');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#weatherPanel').isVisible(),false);
    await page.locator('#toggleLayoutEdit').click();
    const before=await page.evaluate(()=>structuredClone(settings.widgetLayout.weather));
    await page.locator('[data-layout-item="weather"] .layout-drag-handle').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(()=>settings.widgetLayout.weather.x),before.x+1);
    await page.keyboard.press('Control+z');
    assert.equal(await page.evaluate(()=>settings.widgetLayout.weather.x),before.x);
    const handle=await page.locator('[data-layout-item="weather"] .layout-drag-handle').boundingBox();
    await page.mouse.move(handle.x+10,handle.y+10);await page.mouse.down();await page.mouse.move(handle.x+140,handle.y+95,{steps:8});await page.mouse.up();
    assert.notEqual(await page.evaluate(()=>settings.widgetLayout.weather.x),before.x);
    await page.locator('#cancelLayoutEdit').click();
    assert.equal(await page.evaluate(()=>settings.widgetLayout.weather.x),before.x);
    await page.locator('#bookmarkGrid a').first().click({button:'right'});
    await page.getByRole('menuitem',{name:'Удалить',exact:true}).click();
    assert.equal(await page.locator('#bookmarkGrid a').count(),5);
    await page.getByRole('button',{name:'Вернуть',exact:true}).click();
    assert.equal(await page.locator('#bookmarkGrid a').count(),6);
    await page.locator('#openGeneralSettings').click();
    await page.getByRole('button',{name:'Данные и приватность',exact:true}).click();
    const downloadPromise=page.waitForEvent('download');
    await page.getByRole('button',{name:'↓  Экспортировать настройки',exact:true}).click();
    const download=await downloadPromise;
    const backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
    backup.settings.shade=0;backup.settings.showCaption=false;
    await page.locator('input[type="file"][accept=".json,application/json"]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
    await page.waitForFunction(()=>settings.shade===0 && settings.showCaption===false);
    assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('hide-caption')),true);
    await page.locator('#closeDrawer').click();
    fs.mkdirSync(path.join(root,'.test-artifacts'),{recursive:true});
    for(const viewport of [{width:1440,height:900},{width:800,height:600},{width:390,height:720}]) {
      await page.setViewportSize(viewport);
      await page.locator('#openGeneralSettings').click();
      for(const kind of ['Общие','Погода','Часы и дата','Избранное']) {
        await page.locator('#drawerNav button').filter({hasText:kind}).click();
        assert.ok(await page.evaluate(()=>{const p=document.querySelector('#drawerContent');return p.scrollWidth <= p.clientWidth+1}),'settings fit '+kind+' '+viewport.width);
      }
      await page.screenshot({animations:"disabled",path:path.join(root,'.test-artifacts',`settings-${viewport.width}.png`)});
      await page.locator('#closeDrawer').click();
      await page.locator('.weather-card').click();
      await page.screenshot({animations:"disabled",path:path.join(root,'.test-artifacts',`weather-${viewport.width}.png`)});
      assert.ok(await page.evaluate(()=>{const p=document.querySelector('#weatherPanel');return p.scrollWidth<=p.clientWidth+1}),'weather fits '+viewport.width);
      await page.keyboard.press('Escape');
    }
    for (const viewport of [{width:1440,height:900},{width:800,height:600},{width:390,height:720}]) {
      await page.setViewportSize(viewport);
      await page.locator('#toggleFocusMode').click();
      assert.ok(await page.evaluate(()=>{const p=document.querySelector('#focusPanel');return p.scrollWidth<=p.clientWidth+1}), 'focus has no horizontal overflow');
      assert.ok(await page.evaluate(()=>{const p=document.querySelector('#focusPanel');return p.scrollHeight<=p.clientHeight+1}), 'empty focus has no vertical overflow');
      await page.locator('#focusNote').fill('Проверка сохранения заметки');
      await page.locator('#taskInput').fill('Проверить фокус');
      await page.locator('#taskForm button').click();
      await page.locator('#taskList input').last().check();
      await page.screenshot({animations:"disabled",path:path.join(root,'.test-artifacts', 'focus-'+viewport.width+'.png')});
      await page.locator('#closeFocusMode').click();
    }
    await page.reload();await page.waitForFunction(()=>settings.cityLocation?.longitude === -95.55);
    assert.equal(await page.locator('#bookmarkGrid .bookmark-name').first().textContent(),'Video');
    await page.locator('#toggleFocusMode').click();
    assert.equal(await page.locator('#focusNote').inputValue(),'Проверка сохранения заметки');
    assert.equal(await page.locator('#taskList li').count(),3);
    await page.locator('#closeFocusMode').click();
    assert.deepEqual(await page.evaluate(()=>window.__cspViolations),[],'no CSP violations');
    assert.deepEqual(errors,[],'no runtime errors');
    console.log('PASS: real Chrome, CSP, favorites editing, city selection, themes, modal, drag, keyboard/undo, deletion/restore, responsive settings and reload');
  } catch (error) { fs.mkdirSync(path.join(root,'.test-artifacts'),{recursive:true}); await page.screenshot({animations:"disabled",path:path.join(root,'.test-artifacts','failure.png')}).catch(()=>{}); console.error('Page errors:',errors); throw error; } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
