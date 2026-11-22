const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=process.env.FACEBOOST_SOURCE;assert.ok(root,'FACEBOOST_SOURCE is required');
const base=path.join(root,'app/src/main');const read=p=>fs.readFileSync(path.join(base,p),'utf8');
test('golden-engine option is backed by its own persisted default-on key and live WebView delivery',()=>{
 const data=read('java/com/almekhlafi/materialbook/data/local/SettingsDataStore.kt');
 assert.match(data,/FPRO_HOME_SWIPE_BLOCK = booleanPreferencesKey\("fpro_home_swipe_block"\)/);assert.match(data,/fproHomeSwipeBlock = .*FPRO_HOME_SWIPE_BLOCK.*\?: true/);
 const view=read('java/com/almekhlafi/materialbook/ui/components/settings/SettingsContent.kt');const section=view.indexOf('title = stringResource(R.string.fpro_cat_engine)');const option=view.indexOf('title = stringResource(R.string.fpro_home_swipe_block_title)');assert.ok(option>section);assert.match(view,/viewModel.setFproHomeSwipeBlock\(!fproHomeSwipeBlock.value\)/);
 const vm=read('java/com/almekhlafi/materialbook/ui/viewmodel/SettingsViewModel.kt');assert.match(vm,/initialValue = initialPrefs\[FPRO_HOME_SWIPE_BLOCK\] \?: true/);
 const web=read('java/com/almekhlafi/materialbook/ui/screens/MaterialbookWV.kt');assert.match(web,/LaunchedEffect\(fproHomeSwipeBlock, mainWebView\)/);assert.match(web,/HomeSwipeGuard.install\(webView, fproHomeSwipeBlock\)/);assert.match(web,/HomeSwipeGuard.stateScript\(fproHomeSwipeBlock\) \+ scripts/);
});
test('all localized app labels are FPRO flame while update package stays unchanged',()=>{
 let count=0;for(const dir of fs.readdirSync(path.join(base,'res')).filter(x=>x.startsWith('values'))){for(const file of fs.readdirSync(path.join(base,'res',dir)).filter(x=>x.endsWith('.xml'))){const text=read('res/'+dir+'/'+file);for(const match of text.matchAll(/<string\b[^>]*name="app_name"[^>]*>(.*?)<\/string>/gs)){count++;assert.equal(match[1],'FPRO 🔥');}}}
 const debug=fs.readFileSync(path.join(root,'app/src/debug/res/values/strings.xml'),'utf8');assert.match(debug,/<string name="app_name">FPRO 🔥<\/string>/);
 assert.equal(count,12);assert.match(fs.readFileSync(path.join(root,'app/build.gradle.kts'),'utf8'),/applicationId = "com.almekhlafi"/);
});
