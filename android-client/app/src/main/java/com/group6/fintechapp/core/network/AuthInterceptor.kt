package com.group6.fintechapp.core.network

import com.group6.fintechapp.core.auth.TokenStore
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import okhttp3.Request

class AuthInterceptor(
    private val tokenStore: TokenStore,
    private val onTokenRefreshed: ((String, String) -> Unit)? = null
) : Interceptor {
    
    private var isRefreshing = false
    
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        
        // Add access token to request
        val token = runBlocking { tokenStore.getAccessToken() }
        val request = if (!token.isNullOrBlank()) {
            originalRequest.newBuilder()
                .addHeader("Authorization", "Bearer $token")
                .build()
        } else {
            originalRequest
        }
        
        // Make the request
        var response = chain.proceed(request)
        
        // If 401 Unauthorized, try to refresh token
        if (response.code == 401 && !token.isNullOrBlank() && !isRefreshing) {
            synchronized(this) {
                if (isRefreshing) {
                    // Another thread is already refreshing
                    response.close()
                    return chain.proceed(rebuildRequest(originalRequest))
                }
                
                isRefreshing = true
                
                try {
                    val newTokens = refreshToken()
                    
                    if (newTokens != null) {
                        // Save new tokens
                        runBlocking {
                            tokenStore.saveTokens(newTokens.first, newTokens.second)
                        }
                        onTokenRefreshed?.invoke(newTokens.first, newTokens.second)
                        
                        // Retry the original request with new token
                        response.close()
                        val newRequest = originalRequest.newBuilder()
                            .header("Authorization", "Bearer ${newTokens.first}")
                            .build()
                        response = chain.proceed(newRequest)
                    } else {
                        // Refresh failed, clear tokens and force re-login
                        runBlocking {
                            tokenStore.clear()
                        }
                    }
                } finally {
                    isRefreshing = false
                }
            }
        }
        
        return response
    }
    
    private fun rebuildRequest(original: Request): Request {
        val token = runBlocking { tokenStore.getAccessToken() }
        return if (!token.isNullOrBlank()) {
            original.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            original
        }
    }
    
    private fun refreshToken(): Pair<String, String>? {
        return try {
            val refreshToken = runBlocking { tokenStore.getRefreshToken() }
            if (refreshToken.isNullOrBlank()) {
                return null
            }
            
            // Make synchronous refresh request
            val refreshRequest = Request.Builder()
                .url("${ApiClient.BASE_URL}auth/refresh")
                .post(okhttp3.RequestBody.create(null, ""))
                .addHeader("X-Refresh-Token", refreshToken)
                .build()
            
            val client = okhttp3.OkHttpClient()
            val response = client.newCall(refreshRequest).execute()
            
            if (response.isSuccessful) {
                val body = response.body?.string()
                // Parse JSON manually (simple approach)
                // In production, use proper JSON parser
                val accessToken = extractJsonValue(body, "accessToken")
                val newRefreshToken = extractJsonValue(body, "refreshToken")
                
                if (accessToken != null && newRefreshToken != null) {
                    Pair(accessToken, newRefreshToken)
                } else {
                    null
                }
            } else {
                null
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
    
    private fun extractJsonValue(json: String?, key: String): String? {
        if (json == null) return null
        val pattern = """"$key"\s*:\s*"([^"]*)"""".toRegex()
        return pattern.find(json)?.groupValues?.get(1)
    }
}

// Factory function for backward compatibility
fun createAuthInterceptor(tokenProvider: () -> String?): AuthInterceptor {
    // Create a simple wrapper that uses the token provider
    val mockTokenStore = object : TokenStore(null!!) {
        override suspend fun getAccessToken(): String? = tokenProvider()
    }
    return AuthInterceptor(mockTokenStore)
}
