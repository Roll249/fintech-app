package com.group6.fintechapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.group6.fintechapp.core.settings.SettingsDataStore
import com.group6.fintechapp.core.settings.ThemeMode
import com.group6.fintechapp.ui.theme.FintechAppTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val settingsDataStore = SettingsDataStore.getInstance(this)
        
        setContent {
            val themeMode by settingsDataStore.themeModeFlow.collectAsState(initial = ThemeMode.SYSTEM)
            
            FintechAppTheme(themeMode = themeMode) {
                FintechApp()
            }
        }
    }
}
