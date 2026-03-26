package com.group6.fintechapp.core.auth

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "auth")

class TokenStore(private val context: Context) {
    private val accessTokenKey = stringPreferencesKey("access_token")

    val accessToken: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[accessTokenKey]
    }

    suspend fun saveAccessToken(token: String) {
        context.dataStore.edit { prefs ->
            prefs[accessTokenKey] = token
        }
    }

    suspend fun clear() {
        context.dataStore.edit { prefs ->
            prefs.remove(accessTokenKey)
        }
    }
}
