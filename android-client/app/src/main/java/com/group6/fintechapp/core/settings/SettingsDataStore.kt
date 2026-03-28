package com.group6.fintechapp.core.settings

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

data class AppSettings(
    val isDarkMode: Boolean = false,
    val themeMode: ThemeMode = ThemeMode.SYSTEM,
    val language: String = "Vietnamese",
    val currency: String = "VND",
    val isBiometricEnabled: Boolean = false,
    val is2FAEnabled: Boolean = false,
    val pushNotifications: Boolean = true,
    val emailNotifications: Boolean = true,
    val budgetAlerts: Boolean = true,
    val transactionAlerts: Boolean = true
)

enum class ThemeMode {
    LIGHT, DARK, SYSTEM
}

class SettingsDataStore(private val context: Context) {
    
    companion object {
        private val THEME_MODE = stringPreferencesKey("theme_mode")
        private val LANGUAGE = stringPreferencesKey("language")
        private val CURRENCY = stringPreferencesKey("currency")
        private val BIOMETRIC_ENABLED = booleanPreferencesKey("biometric_enabled")
        private val TWO_FA_ENABLED = booleanPreferencesKey("2fa_enabled")
        private val PUSH_NOTIFICATIONS = booleanPreferencesKey("push_notifications")
        private val EMAIL_NOTIFICATIONS = booleanPreferencesKey("email_notifications")
        private val BUDGET_ALERTS = booleanPreferencesKey("budget_alerts")
        private val TRANSACTION_ALERTS = booleanPreferencesKey("transaction_alerts")
        
        @Volatile
        private var INSTANCE: SettingsDataStore? = null
        
        fun getInstance(context: Context): SettingsDataStore {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: SettingsDataStore(context.applicationContext).also { INSTANCE = it }
            }
        }
    }
    
    val settingsFlow: Flow<AppSettings> = context.dataStore.data.map { preferences ->
        AppSettings(
            themeMode = ThemeMode.valueOf(preferences[THEME_MODE] ?: ThemeMode.SYSTEM.name),
            isDarkMode = preferences[THEME_MODE] == ThemeMode.DARK.name,
            language = preferences[LANGUAGE] ?: "Vietnamese",
            currency = preferences[CURRENCY] ?: "VND",
            isBiometricEnabled = preferences[BIOMETRIC_ENABLED] ?: false,
            is2FAEnabled = preferences[TWO_FA_ENABLED] ?: false,
            pushNotifications = preferences[PUSH_NOTIFICATIONS] ?: true,
            emailNotifications = preferences[EMAIL_NOTIFICATIONS] ?: true,
            budgetAlerts = preferences[BUDGET_ALERTS] ?: true,
            transactionAlerts = preferences[TRANSACTION_ALERTS] ?: true
        )
    }
    
    val themeModeFlow: Flow<ThemeMode> = context.dataStore.data.map { preferences ->
        ThemeMode.valueOf(preferences[THEME_MODE] ?: ThemeMode.SYSTEM.name)
    }
    
    val currencyFlow: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[CURRENCY] ?: "VND"
    }
    
    val languageFlow: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[LANGUAGE] ?: "Vietnamese"
    }
    
    suspend fun setThemeMode(mode: ThemeMode) {
        context.dataStore.edit { preferences ->
            preferences[THEME_MODE] = mode.name
        }
    }
    
    suspend fun setLanguage(language: String) {
        context.dataStore.edit { preferences ->
            preferences[LANGUAGE] = language
        }
    }
    
    suspend fun setCurrency(currency: String) {
        context.dataStore.edit { preferences ->
            preferences[CURRENCY] = currency
        }
    }
    
    suspend fun setBiometricEnabled(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[BIOMETRIC_ENABLED] = enabled
        }
    }
    
    suspend fun set2FAEnabled(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[TWO_FA_ENABLED] = enabled
        }
    }
    
    suspend fun setPushNotifications(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PUSH_NOTIFICATIONS] = enabled
        }
    }
    
    suspend fun setEmailNotifications(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[EMAIL_NOTIFICATIONS] = enabled
        }
    }
    
    suspend fun setBudgetAlerts(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[BUDGET_ALERTS] = enabled
        }
    }
    
    suspend fun setTransactionAlerts(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[TRANSACTION_ALERTS] = enabled
        }
    }
}
