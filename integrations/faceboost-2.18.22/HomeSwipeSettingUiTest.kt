package com.almekhlafi.materialbook.ui.screens

import android.app.Application
import androidx.compose.material3.MaterialTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.semantics.SemanticsActions
import androidx.lifecycle.viewModelScope
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.almekhlafi.materialbook.R
import com.almekhlafi.materialbook.data.local.SettingsDataStore
import com.almekhlafi.materialbook.ui.components.settings.SettingsContent
import com.almekhlafi.materialbook.ui.viewmodel.SettingsViewModel
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class HomeSwipeSettingUiTest {
    @get:Rule val compose = createComposeRule()

    @Test fun goldenEngineRowTogglesPersistedPreferenceEvenWithMasterOff() {
        val app=ApplicationProvider.getApplicationContext<Application>()
        val prefs=SettingsDataStore(app)
        val original=runBlocking { prefs.fproHomeSwipeBlock.first() }
        val master=runBlocking { prefs.fproEnhance.first() }
        runBlocking { prefs.setFproHomeSwipeBlock(true);prefs.setFproEnhance(false) }
        val model=SettingsViewModel(app)
        // Observe persisted values off the UI/test thread; waitUntil keeps Compose's
        // test clock progressing while the production viewModelScope write completes.
        val observationScope=CoroutineScope(SupervisorJob()+Dispatchers.IO)
        val persisted=prefs.fproHomeSwipeBlock.stateIn(observationScope,SharingStarted.Eagerly,true)
        try {
            compose.setContent { MaterialTheme { SettingsContent(modifier=Modifier.fillMaxSize().verticalScroll(rememberScrollState()),viewModel=model) } }
            // Production categories are collapsed by default: open the actual section first.
            compose.onNodeWithText(app.getString(R.string.fpro_cat_engine)).performScrollTo().assertIsDisplayed().performClick()
            compose.waitForIdle()
            val title=app.getString(R.string.fpro_home_swipe_block_title)
            compose.onNodeWithText(title).performScrollTo().assertIsDisplayed().performSemanticsAction(SemanticsActions.OnClick) { it() }
            try { compose.waitUntil(15000) { !persisted.value && !model.fproHomeSwipeBlock.value } } catch (e: Exception) { throw AssertionError("OFF action did not persist; observed=${persisted.value}; model=${model.fproHomeSwipeBlock.value}; snapshot=${runBlocking { withTimeout(5000) { prefs.prefs.first() } }}", e) }
            assertTrue(!runBlocking { withTimeout(5000) { prefs.fproHomeSwipeBlock.first() } })
            compose.waitForIdle()
            assertTrue(!model.fproHomeSwipeBlock.value)
            compose.onNodeWithText(title).performSemanticsAction(SemanticsActions.OnClick) { it() }
            try { compose.waitUntil(15000) { persisted.value && model.fproHomeSwipeBlock.value } } catch (e: Exception) { throw AssertionError("ON action did not persist; observed=${persisted.value}; model=${model.fproHomeSwipeBlock.value}; snapshot=${runBlocking { withTimeout(5000) { prefs.prefs.first() } }}", e) }
            assertTrue(runBlocking { withTimeout(5000) { prefs.fproHomeSwipeBlock.first() } })
            compose.waitForIdle()
            assertTrue(model.fproHomeSwipeBlock.value)
        } finally {
            runBlocking { prefs.setFproHomeSwipeBlock(original);prefs.setFproEnhance(master) }
            observationScope.cancel()
            model.viewModelScope.cancel()
        }
    }
    @Test fun foregroundClipboardAndPackageShareCarryTheSameValidatedUrl(){
        val app=ApplicationProvider.getApplicationContext<Application>()
        compose.setContent { androidx.compose.material3.Text("FPRO download contract") }
        compose.waitForIdle()
        compose.runOnIdle {
            val url="https://www.facebook.com/watch/?v=987654"
            val selected=com.almekhlafi.materialbook.utils.FproNavigation.publicFirstSource("https://video.fbcdn.net/direct.mp4",url)
            org.junit.Assert.assertEquals(url,selected)
            val downloader=com.almekhlafi.materialbook.utils.ExternalDownloader
            assertTrue(downloader.copySource(app,url))
            val clipboard=app.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
            org.junit.Assert.assertEquals(url,clipboard.primaryClip!!.getItemAt(0).text.toString())
            val intent=downloader.shareIntent(url,"com.junkfood.seal")
            org.junit.Assert.assertEquals(android.content.Intent.ACTION_SEND,intent.action)
            org.junit.Assert.assertEquals("text/plain",intent.type)
            org.junit.Assert.assertEquals("com.junkfood.seal",intent.`package`)
            org.junit.Assert.assertEquals(url,intent.getStringExtra(android.content.Intent.EXTRA_TEXT))
            for(bad in listOf("https://facebook.com/","http://facebook.com/reel/123/","https://facebook.com.evil.test/reel/123/","https://user@facebook.com/reel/123/","https://facebook.com/watch/?v=oops")) {
                org.junit.Assert.assertNull(com.almekhlafi.materialbook.utils.FproNavigation.publicVideoLink(bad))
            }
            org.junit.Assert.assertNull(com.almekhlafi.materialbook.utils.FproNavigation.publicFirstSource("https://video.fbcdn.net/direct.mp4",""))
            org.junit.Assert.assertNull(com.almekhlafi.materialbook.utils.FproNavigation.publicFirstSource("blob:private",""))
        }
    }

}
