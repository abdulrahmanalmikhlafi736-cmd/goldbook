"""Optional persisted official comment-sort UI preference; default OFF."""
from pathlib import Path
import sys, shutil
root=Path(sys.argv[1]);here=Path(__file__).parent;base=root/'app/src/main';k=base/'java/com/almekhlafi/materialbook'
def replace(p,old,new):
 s=p.read_text();assert old in s,(p,old);p.write_text(s.replace(old,new,1))
p=k/'data/local/SettingsDataStore.kt'
replace(p,'        val FPRO_HOME_SWIPE_BLOCK =','        val FPRO_ALL_COMMENTS = booleanPreferencesKey("fpro_all_comments")\n        val FPRO_HOME_SWIPE_BLOCK =')
replace(p,'    val fproHomeSwipeBlock =','    val fproAllComments = context.dataStore.data.map { it[FPRO_ALL_COMMENTS] ?: false }\n    suspend fun setFproAllComments(v:Boolean) { context.dataStore.edit { it[FPRO_ALL_COMMENTS] = v } }\n\n    val fproHomeSwipeBlock =')
p=k/'ui/viewmodel/SettingsViewModel.kt'
replace(p,'import com.almekhlafi.materialbook.data.local.SettingsDataStore.Companion.FPRO_HOME_SWIPE_BLOCK','import com.almekhlafi.materialbook.data.local.SettingsDataStore.Companion.FPRO_ALL_COMMENTS\nimport com.almekhlafi.materialbook.data.local.SettingsDataStore.Companion.FPRO_HOME_SWIPE_BLOCK')
replace(p,'    val fproHomeSwipeBlock =','    val fproAllComments = dataStore.fproAllComments.stateIn(scope=viewModelScope,initialValue=initialPrefs[FPRO_ALL_COMMENTS] ?: false,started=SharingStarted.WhileSubscribed())\n    val fproHomeSwipeBlock =')
replace(p,'    fun setFproHomeSwipeBlock(', '    fun setFproAllComments(v:Boolean) { viewModelScope.launch { dataStore.setFproAllComments(v) } }\n    fun setFproHomeSwipeBlock(')
p=k/'ui/components/settings/SettingsContent.kt'
replace(p,'    val fproHomeSwipeBlock =','    val fproAllComments = viewModel.fproAllComments.collectAsState()\n    val fproHomeSwipeBlock =')
s=p.read_text();a=s.index('title = stringResource(R.string.fpro_cat_engine)');i=s.index('                SettingsItem(',a);s=s[:i]+'''                SettingsItem(
                    icon = Icons.Outlined.SwapHoriz,
                    title = stringResource(R.string.fpro_all_comments_title),
                    supportingText = stringResource(R.string.fpro_all_comments_desc),
                    isActive = fproAllComments.value,
                    onClick = { viewModel.setFproAllComments(!fproAllComments.value) }
                ),
'''+s[i:];p.write_text(s)
p=k/'ui/screens/MaterialbookWV.kt'
replace(p,'import com.almekhlafi.materialbook.utils.HomeSwipeGuard','import com.almekhlafi.materialbook.utils.HomeSwipeGuard\nimport com.almekhlafi.materialbook.utils.CommentSortPreference')
replace(p,'    val fproHomeSwipeBlock by','    val fproAllComments by settingsVM.fproAllComments.collectAsState()\n    val fproHomeSwipeBlock by')
replace(p,'    LaunchedEffect(fproHomeSwipeBlock, mainWebView)', '    LaunchedEffect(fproAllComments, mainWebView) {\n        mainWebView?.let { CommentSortPreference.update(it, fproAllComments) }\n    }\n    LaunchedEffect(fproHomeSwipeBlock, mainWebView)')
replace(p,'            HomeSwipeGuard.install(webView, fproHomeSwipeBlock)','            HomeSwipeGuard.install(webView, fproHomeSwipeBlock)\n            CommentSortPreference.install(webView, fproAllComments)')
replace(p,'HomeSwipeGuard.stateScript(fproHomeSwipeBlock) + scripts','HomeSwipeGuard.stateScript(fproHomeSwipeBlock) + CommentSortPreference.stateScript(fproAllComments) + scripts')
shutil.copyfile(here/'CommentSortPreference.kt',k/'utils/CommentSortPreference.kt')
shutil.copyfile(here/'comment-sort.js',base/'assets/comment-sort.js')
p=k/'utils/FproAssets.kt';replace(p,'            readAsset(resources, "media-surface.js"),','            readAsset(resources, "comment-sort.js"),\n            readAsset(resources, "media-surface.js"),')
for folder,desc,title in [('values','Selects the official All comments option when clearly available. OFF stops future automation; it does not undo the current sort.','Show all comments automatically'),('values-ar','يختار الخيار الرسمي عند التعرّف عليه. الإلغاء يوقف الاختيار التلقائي ولا يعيد الفرز السابق.','عرض كل التعليقات تلقائيًا')]:
 (base/'res'/folder/'fpro_all_comments.xml').write_text(f'<resources>\n<string name="fpro_all_comments_title">{title}</string>\n<string name="fpro_all_comments_desc">{desc}</string>\n</resources>\n')
p=base/'res/values/fpro_all_comments.xml';s=p.read_text().replace('<resources>','<resources>\n<item name="fpro_comment_sort_registration" type="id" />');p.write_text(s)
