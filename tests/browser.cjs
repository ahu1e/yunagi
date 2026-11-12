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
    const geometry = await context.newPage();
    geometry.on('pageerror', error => errors.push(error.message));
    await geometry.goto(base+'/newtab.html');
    await geometry.waitForFunction(()=>document.body.classList.contains('assets-ready') && !document.body.classList.contains('page-enter'));
    for (const viewport of [{width:1280,height:800},{width:1920,height:1080},{width:2560,height:1440}]) {
      await geometry.setViewportSize(viewport);
      await geometry.evaluate(()=>{settings.layoutMode='free';settings.widgetLayout.search=structuredClone(WIDGET_LAYOUT_DEFAULTS.search);renderWidgetLayout();});
      const initial=await geometry.locator('.search-area').boundingBox();
      await geometry.locator('#toggleLayoutEdit').click();
      const entered=await geometry.locator('.search-area').boundingBox();
      for (const key of ['x','y','width','height']) assert.ok(Math.abs(entered[key]-initial[key])<1, 'editor preserves search '+key+' at '+viewport.width+' '+JSON.stringify({initial,entered,layout:await geometry.evaluate(()=>settings.widgetLayout.search)}));
      await geometry.locator('.search-area .layout-drag-handle').focus();
      await geometry.keyboard.press('ArrowDown');
      const moved=await geometry.locator('.search-area').boundingBox();
      assert.ok(moved.y>entered.y, 'search moves down');
      assert.ok(Math.abs(moved.width-initial.width)<1, 'moving does not resize search');
      await geometry.locator('#finishLayoutEdit').click();
      const finished=await geometry.locator('.search-area').boundingBox();
      assert.ok(Math.abs(finished.width-initial.width)<1, 'saved search width unchanged');
      await geometry.reload();
      await geometry.waitForFunction(()=>document.body.classList.contains('assets-ready') && !document.body.classList.contains('page-enter'));
      assert.ok(Math.abs((await geometry.locator('.search-area').boundingBox()).width-initial.width)<1, 'search width survives reload '+JSON.stringify({initial,after:await geometry.locator('.search-area').boundingBox(),layout:await geometry.evaluate(()=>settings.widgetLayout.search),mode:await geometry.evaluate(()=>settings.layoutMode)}));
      await geometry.locator('#toggleLayoutEdit').click();
      assert.ok(Math.abs((await geometry.locator('.search-area').boundingBox()).width-initial.width)<1, 'reenter preserves custom search width');
      const resize=await geometry.locator('.search-area .layout-resize-handle').boundingBox();
      await geometry.mouse.move(resize.x+10,resize.y+10);await geometry.mouse.down();await geometry.mouse.move(resize.x+180,resize.y+10,{steps:6});await geometry.mouse.up();
      assert.ok((await geometry.locator('.search-area').boundingBox()).width>initial.width, 'explicit resize still changes search width');
      await geometry.keyboard.press('Control+z');
      assert.ok(Math.abs((await geometry.locator('.search-area').boundingBox()).width-initial.width)<1, 'undo restores search width');
      await geometry.locator('#cancelLayoutEdit').click();
    }
    await geometry.evaluate(()=>{settings.clockDisplay='digital';renderWidgetLayout();});
    await geometry.waitForFunction(()=>getComputedStyle(document.querySelector('#digitalTime')).fontWeight==='550');
    assert.equal(await geometry.locator('#digitalTime').evaluate(el=>getComputedStyle(el).fontWeight),'550',JSON.stringify(await geometry.evaluate(()=>({mode:settings.clockDisplay,display:document.querySelector('#clockCard').dataset.display,selected:document.querySelector('.clock-card[data-display="digital"] .digital-time')!==null}))));
    await geometry.close();
    await page.setViewportSize({width:1280,height:800});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.evaluate(()=>{settings.snowEnabled=true;settings.snowAccumulation=true;setSnowEffect(true);syncSnowSurfaces(true);});
    await page.waitForFunction(()=>snowDrifts.surfaces.size>0);
    const ledge=await page.locator('.weather-card').boundingBox();
    const collision=await page.evaluate(rect=>{
      const surface=snowDrifts.surfaces.get('[data-layout-item="weather"]');
      const mass=()=>surface.heights.reduce((a,b)=>a+b,0);
      const before=mass(), flake=snowflakes[0], original={...flake};
      Object.assign(flake,{x:rect.x+rect.width/2,y:rect.y-20,speed:30,drift:0});
      drawSnowflakes(1);
      const landed=flake.y<0, after=mass();Object.assign(flake,original);
      return {before,after,landed};
    },ledge);
    assert.ok(collision.after>collision.before && collision.landed,'falling flakes land and restart above the viewport');
    const initialSnow=await page.evaluate(()=>[...snowDrifts.surfaces.values()][0].heights.reduce((a,b)=>a+b,0));
    await page.evaluate(rect=>{
      for(let n=0;n<20;n++)for(let x=rect.x+20;x<rect.x+rect.width-20;x+=10)snowDrifts.deposit(x,rect.y-30,rect.y+2,5);
      snowDrifts.draw(0);
    },ledge);
    const loadedSnow=await page.evaluate(()=>snowDrifts.surfaces.get('[data-layout-item="weather"]').heights.reduce((a,b)=>a+b,0));
    assert.ok(loadedSnow>initialSnow,'snow accumulates on the widget');
    await page.screenshot({animations:'disabled',path:path.join(root,'.test-artifacts','snow-before-brush.png')});
    const profileBefore=await page.evaluate(()=>Array.from(snowDrifts.surfaces.get('[data-layout-item="weather"]').heights));
    await page.mouse.move(ledge.x+ledge.width*.42,ledge.y-4);
    for (let i=1;i<=8;i++) {
      await page.waitForTimeout(30);
      await page.mouse.move(ledge.x+ledge.width*(.42+.02*i),ledge.y-4);
    }
    const stirred=await page.evaluate(()=>({profile:Array.from(snowDrifts.surfaces.get('[data-layout-item="weather"]').heights),debris:snowDrifts.debris.length}));
    assert.equal(stirred.debris,0,'center stirring does not spawn falling snow');
    assert.ok(Math.abs(stirred.profile.reduce((a,b)=>a+b,0)-loadedSnow)<loadedSnow*.02,'center stirring preserves snow volume');
    assert.notDeepEqual(stirred.profile,profileBefore,'center motion reshapes snow');
    await page.screenshot({animations:'disabled',path:path.join(root,'.test-artifacts','snow-stirred.png')});
    const powder=await page.evaluate(rect=>{
      snowDrifts.forgetPointer();
      for (const [fraction, timeStamp] of [[.45,100],[.6,108]]) {
        const event=new PointerEvent('pointermove',{clientX:rect.x+rect.width*fraction,clientY:rect.y-4});
        Object.defineProperty(event,'timeStamp',{value:timeStamp});
        document.dispatchEvent(event);
      }
      snowDrifts.forgetPointer();
      return snowDrifts.debris.filter(p=>p.powder).length;
    },ledge);
    assert.ok(powder>0 && powder<=5,'rapid pointer contact raises a small puff');
    await page.mouse.move(ledge.x-25,ledge.y-4);
    await page.mouse.move(ledge.x+ledge.width+25,ledge.y-4,{steps:16});
    const brushed=await page.evaluate(()=>({mass:snowDrifts.surfaces.get('[data-layout-item="weather"]').heights.reduce((a,b)=>a+b,0),debris:snowDrifts.debris.length,spills:snowDrifts.spills.length}));
    assert.ok(brushed.mass<loadedSnow*.03,'one pointer sweep pushes the whole bank off the ledge '+JSON.stringify({loadedSnow,brushed}));
    assert.ok(brushed.spills>0 && brushed.spills<=12,'brush creates a stream from the ledge');
    assert.ok(brushed.debris<=140,'falling fragments stay bounded');
    assert.equal(await page.locator('#buildSnowman').count(),0);
    await page.screenshot({animations:'disabled',path:path.join(root,'.test-artifacts','snow-after-brush.png')});
    assert.equal(await page.locator('#snowDriftCanvas').evaluate(el=>getComputedStyle(el).pointerEvents),'none');
    await page.locator('.weather-card').click();
    await page.locator('#weatherPanel').waitFor({state:'visible'});
    await page.waitForFunction(()=>snowDrifts.surfaces.size===0);
    await page.keyboard.press('Escape');
    await page.evaluate(()=>{settings.snowAccumulation=false;syncSnowSurfaces(true);});
    assert.equal(await page.evaluate(()=>snowDrifts.surfaces.size),0);
    await page.evaluate(()=>{settings.snowAccumulation=true;});
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(()=>snowDrifts.surfaces.size===0);
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.locator('#openGeneralSettings').click();
    await page.getByRole('button',{name:'Внешний вид',exact:true}).click();
    const density=page.getByRole('slider',{name:'Плотность снега'});
    const wind=page.getByRole('slider',{name:'Сила ветра'});
    await density.scrollIntoViewIfNeeded({timeout:5000});
    assert.equal(await density.isEnabled(),true);
    await density.press('Home');
    const sparse=await page.evaluate(()=>snowflakes.length);
    await density.press('End');
    assert.ok(await page.evaluate(()=>snowflakes.length)>sparse*10,'density slider changes the live flake count');
    await wind.focus({timeout:5000});
    await wind.press('End');
    assert.equal(await page.evaluate(()=>settings.snowWind),100);
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('yunagi-settings')).snowWind===100);
    await page.locator('#closeDrawer').click();
    await page.evaluate(()=>{settings.snowEnabled=false;setSnowEffect(false);});
    assert.equal(await page.evaluate(()=>snowDrifts.debris.length),0);

    assert.deepEqual(await page.evaluate(()=>window.__cspViolations),[],'no CSP violations');
    assert.deepEqual(errors,[],'no runtime errors');
    console.log('PASS: real Chrome, CSP, favorites editing, city selection, themes, modal, drag, keyboard/undo, deletion/restore, responsive settings and reload');
  } catch (error) { fs.mkdirSync(path.join(root,'.test-artifacts'),{recursive:true}); await page.screenshot({animations:"disabled",path:path.join(root,'.test-artifacts','failure.png')}).catch(()=>{}); console.error('Page errors:',errors); throw error; } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
