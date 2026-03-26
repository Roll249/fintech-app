package com.group6.fintechapp.data.repository

import com.group6.fintechapp.core.network.ApiClient
import com.group6.fintechapp.core.network.ApiResponse
import com.group6.fintechapp.data.api.UserApi
import com.group6.fintechapp.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class UserRepository {
    private val api: UserApi = ApiClient.createService()

    suspend fun login(email: String, password: String): ApiResponse<AuthResponse> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.login(LoginRequest(email, password))
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun register(request: RegisterRequest): ApiResponse<AuthResponse> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.register(request)
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun getCurrentUser(): ApiResponse<User> = withContext(Dispatchers.IO) {
        try {
            val response = api.getCurrentUser()
            if (response.isSuccessful && response.body() != null) {
                ApiResponse.Success(response.body()!!)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun updateProfile(request: UpdateProfileRequest): ApiResponse<User> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.updateProfile(request)
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun logout(): ApiResponse<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = api.logout()
            if (response.isSuccessful) {
                ApiResponse.Success(Unit)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }
}
