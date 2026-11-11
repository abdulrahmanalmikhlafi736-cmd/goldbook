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
        try {
            compose.setContent { MaterialTheme { SettingsContent(modifier=Modifier.fillMaxSize().verticalScroll(rememberScrollState()),viewModel=model) } }
            // Production categories are collapsed by default: open the actual section first.
            compose.onNodeWithText(app.getString(R.string.fpro_cat_engine)).performScrollTo().assertIsDisplayed().performClick()
            compose.waitForIdle()
            val title=app.getString(R.string.fpro_home_swipe_block_title)
            compose.onNodeWithText(title).performScrollTo().assertIsDisplayed().performSemanticsAction(SemanticsActions.OnClick) { it() }
            try { runBlocking { withTimeout(5000) { prefs.fproHomeSwipeBlock.first { !it } } } } catch (e: Exception) { throw AssertionError("OFF action did not persist; model=${model.fproHomeSwipeBlock.value}", e) }
            compose.waitForIdle()
            assertTrue(!model.fproHomeSwipeBlock.value)
            compose.onNodeWithText(title).performSemanticsAction(SemanticsActions.OnClick) { it() }
            try { runBlocking { withTimeout(5000) { prefs.fproHomeSwipeBlock.first { it } } } } catch (e: Exception) { throw AssertionError("ON action did not persist; model=${model.fproHomeSwipeBlock.value}", e) }
            compose.waitForIdle()
            assertTrue(model.fproHomeSwipeBlock.value)
        } finally {
            runBlocking { prefs.setFproHomeSwipeBlock(original);prefs.setFproEnhance(master) }
            model.viewModelScope.cancel()
        }
    }
}
