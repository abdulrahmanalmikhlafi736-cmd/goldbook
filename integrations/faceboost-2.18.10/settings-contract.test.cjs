const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=process.env.FACEBOOST_SOURCE;
test('saved preference, golden-engine UI, native/live config and localized names are wired',()=>{
 assert.ok(root,'FACEBOOST_SOURCE required');const base=path.join(root,'app/src/main');const read=p=>fs.readFileSync(path.join(base,p),'utf8');
 const ui=read('java/com/almekhlafi/materialbook/ui/components/settings/SettingsContent.kt');const section=ui.indexOf('title = stringResource(R.string.fpro_cat_engine)');const option=ui.indexOf('R.string.fpro_home_swipe_title');assert.ok(option>section&&option<ui.indexOf('SettingsSection(',section));
 assert.match(ui,/setFproHomeSwipe\(!fproHomeSwipe.value\)/);
 assert.match(read('java/com/almekhlafi/materialbook/data/local/SettingsDataStore.kt'),/it\[FPRO_HOME_SWIPE\] \?: true/);
 assert.match(read('java/com/almekhlafi/materialbook/ui/viewmodel/SettingsViewModel.kt'),/initialPrefs\[FPRO_HOME_SWIPE\] \?: true/);
 assert.match(read('java/com/almekhlafi/materialbook/ui/viewmodel/MainViewModel.kt'),/homeSwipeGuard.*settings.fproHomeSwipe.value/);
 assert.match(read('java/com/almekhlafi/materialbook/utils/FproAssets.kt'),/if\(!window.__fproHomeSwipeNative\)/);
 assert.match(read('java/com/almekhlafi/materialbook/ui/screens/MaterialbookWV.kt'),/LaunchedEffect\(mainWebView, fproHomeSwipe\)/);
 let names=0;for(const dir of fs.readdirSync(path.join(base,'res')).filter(x=>x.startsWith('values'))){for(const file of fs.readdirSync(path.join(base,'res',dir)).filter(x=>x.endsWith('.xml'))){const text=fs.readFileSync(path.join(base,'res',dir,file),'utf8');for(const m of text.matchAll(/<string\b[^>]*name="app_name"[^>]*>(.*?)<\/string>/gs)){names++;assert.equal(m[1],'FPRO 🔥',dir+'/'+file);}}}assert.ok(names>1);
});
