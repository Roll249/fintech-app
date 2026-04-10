package com.group6.fintechapp.data.repository

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TokenRepository @Inject constructor(
    private val dataStore: DataStore<Preferences>
) {
    companion object {
        private val ACCESS_TOKEN_KEY = stringPreferencesKey("access_token")
        private val REFRESH_TOKEN_KEY = stringPreferencesKey("refresh_token")
        private val USER_ID_KEY = stringPreferencesKey("user_id")
        private val USER_NAME_KEY = stringPreferencesKey("user_name")
        private val USER_EMAIL_KEY = stringPreferencesKey("user_email")
    }

    val accessToken: Flow<String?> = dataStore.data.map { prefs ->
        prefs[ACCESS_TOKEN_KEY]
    }

    val refreshToken: Flow<String?> = dataStore.data.map { prefs ->
        prefs[REFRESH_TOKEN_KEY]
    }

    val userId: Flow<String?> = dataStore.data.map { prefs ->
        prefs[USER_ID_KEY]
    }

    val userName: Flow<String?> = dataStore.data.map { prefs ->
        prefs[USER_NAME_KEY]
    }

    val userEmail: Flow<String?> = dataStore.data.map { prefs ->
        prefs[USER_EMAIL_KEY]
    }

    val isLoggedIn: Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[ACCESS_TOKEN_KEY] != null
    }

    fun getAccessTokenSync(): String? {
        return runBlocking {
            dataStore.data.first()[ACCESS_TOKEN_KEY]
        }
    }

    fun getRefreshTokenSync(): String? {
        return runBlocking {
            dataStore.data.first()[REFRESH_TOKEN_KEY]
        }
    }

    fun getUserIdSync(): String? {
        return runBlocking {
            dataStore.data.first()[USER_ID_KEY]
        }
    }

    suspend fun saveTokens(accessToken: String, refreshToken: String, userId: String, userName: String, userEmail: String) {
        dataStore.edit { prefs ->
            prefs[ACCESS_TOKEN_KEY] = accessToken
            prefs[REFRESH_TOKEN_KEY] = refreshToken
            prefs[USER_ID_KEY] = userId
            prefs[USER_NAME_KEY] = userName
            prefs[USER_EMAIL_KEY] = userEmail
        }
    }

    suspend fun updateAccessToken(accessToken: String) {
        dataStore.edit { prefs ->
            prefs[ACCESS_TOKEN_KEY] = accessToken
        }
    }

    suspend fun clearTokens() {
        dataStore.edit { prefs ->
            prefs.remove(ACCESS_TOKEN_KEY)
            prefs.remove(REFRESH_TOKEN_KEY)
            prefs.remove(USER_ID_KEY)
            prefs.remove(USER_NAME_KEY)
            prefs.remove(USER_EMAIL_KEY)
        }
    }
}
