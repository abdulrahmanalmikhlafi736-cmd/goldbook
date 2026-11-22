"""Add one persisted golden-engine option and visible branding only."""
from pathlib import Path
import re, shutil, sys
root=Path(sys.argv[1]); here=Path(__file__).resolve().parent
base=root/'app/src/main'; kotlin=base/'java/com/almekhlafi/materialbook'
def replace(path,old,new):
    s=path.read_text(); assert old in s,(path,old); path.write_text(s.replace(old,new,1))
p=kotlin/'data/local/SettingsDataStore.kt'
replace(p,'        val FPRO_DOUBLE_TAP =', '        val FPRO_HOME_SWIPE_BLOCK = booleanPreferencesKey("fpro_home_swipe_block")\n        val FPRO_DOUBLE_TAP =')
replace(p,'    val fproDoubleTap =', '    val fproHomeSwipeBlock = context.dataStore.data.map { it[FPRO_HOME_SWIPE_BLOCK] ?: true }\n    suspend fun setFproHomeSwipeBlock(v: Boolean) { context.dataStore.edit { it[FPRO_HOME_SWIPE_BLOCK] = v } }\n\n    val fproDoubleTap =')
p=kotlin/'ui/viewmodel/SettingsViewModel.kt'
replace(p,'import com.almekhlafi.materialbook.data.local.SettingsDataStore.Companion.FPRO_DOUBLE_TAP','import com.almekhlafi.materialbook.data.local.SettingsDataStore.Companion.FPRO_HOME_SWIPE_BLOCK\nimport com.almekhlafi.materialbook.data.local.SettingsDataStore.Companion.FPRO_DOUBLE_TAP')
replace(p,'    val fproDoubleTap =', '    val fproHomeSwipeBlock = dataStore.fproHomeSwipeBlock.stateIn(scope = viewModelScope, initialValue = initialPrefs[FPRO_HOME_SWIPE_BLOCK] ?: true, started = SharingStarted.WhileSubscribed())\n    val fproDoubleTap =')
replace(p,'    fun setFproDoubleTap(', '    fun setFproHomeSwipeBlock(v: Boolean) { viewModelScope.launch { dataStore.setFproHomeSwipeBlock(v) } }\n    fun setFproDoubleTap(')
p=kotlin/'ui/components/settings/SettingsContent.kt'
replace(p,'    val fproDoubleTap =', '    val fproHomeSwipeBlock = viewModel.fproHomeSwipeBlock.collectAsState()\n    val fproDoubleTap =')
s=p.read_text();start=s.index('title = stringResource(R.string.fpro_cat_engine)');at=s.index('                if (fproEnhance.value) SettingsItem(',start)
s=s[:at]+'''                SettingsItem(
                    icon = Icons.Outlined.SwapHoriz,
                    title = stringResource(R.string.fpro_home_swipe_block_title),
                    supportingText = stringResource(R.string.fpro_home_swipe_block_desc),
                    isActive = fproHomeSwipeBlock.value,
                    onClick = { viewModel.setFproHomeSwipeBlock(!fproHomeSwipeBlock.value) }
                ),
'''+s[at:];p.write_text(s)
p=kotlin/'ui/screens/MaterialbookWV.kt'
replace(p,'    val fproThirdPartyCookies by', '    val fproHomeSwipeBlock by settingsVM.fproHomeSwipeBlock.collectAsState()\n    val fproThirdPartyCookies by')
replace(p,'    val textZoom by', '    LaunchedEffect(fproHomeSwipeBlock, mainWebView) {\n        mainWebView?.let { HomeSwipeGuard.update(it, fproHomeSwipeBlock) }\n    }\n    val textZoom by')
replace(p,'HomeSwipeGuard.install(webView)','HomeSwipeGuard.install(webView, fproHomeSwipeBlock)')
replace(p,'navigator.evaluateJavaScript(scripts) {','navigator.evaluateJavaScript(HomeSwipeGuard.stateScript(fproHomeSwipeBlock) + scripts) {')
resources=base/'res'
(resources/'values/fpro_home_swipe.xml').write_text('''<resources>
    <item name="fpro_home_swipe_registration" type="id" />
    <string name="fpro_home_swipe_block_title">Block Create Story swipe on home</string>
    <string name="fpro_home_swipe_block_desc">Blocks the home-page swipe only. Progress-bar gesture isolation remains enabled.</string>
</resources>
''')
(resources/'values-ar/fpro_home_swipe.xml').write_text('''<resources>
    <string name="fpro_home_swipe_block_title">منع فتح إنشاء قصة بالسحب في الرئيسية</string>
    <string name="fpro_home_swipe_block_desc">يمنع سحبة الصفحة في الرئيسية فقط، ولا يغيّر عزل شريط التقدّم.</string>
</resources>
''')
count=0
for p in resources.glob('values*/*.xml'):
    s=p.read_text()
    if p.name=='brand_strings.xml':s=s.replace('Faceboost','FPRO 🔥')
    s,n=re.subn(r'(<string\b[^>]*\bname="app_name"[^>]*>).*?(</string>)',r'\g<1>FPRO 🔥\2',s,flags=re.S)
    count+=n
    if s!=p.read_text():p.write_text(s)
assert count>=12,count
ui=root/'app/src/androidTest/java/com/almekhlafi/materialbook/ui/screens/HomeSwipeSettingUiTest.kt'
shutil.copyfile(here/'HomeSwipeSettingUiTest.kt',ui)
print(f'Added persisted home gesture option; renamed {count} localized application labels.')
# Keep a visible debug distinction, but never retain the old product name.
debug_manifest=root/'app/src/debug/AndroidManifest.xml'
if debug_manifest.exists():
    debug_manifest.write_text(debug_manifest.read_text().replace('Faceboost Debug','FPRO 🔥 Debug'))
for p in (root/'app/src/debug/res').glob('values*/*.xml'):
    s=p.read_text()
    s=re.sub(r'(<string\b[^>]*\bname="app_name"[^>]*>).*?(</string>)',r'\g<1>FPRO 🔥\2',s,flags=re.S)
    p.write_text(s)
