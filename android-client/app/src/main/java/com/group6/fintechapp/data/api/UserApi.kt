package com.group6.fintechapp.data.api

import com.group6.fintechapp.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface UserApi {
    
    @POST("api/v1/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>
    
    @POST("api/v1/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>
    
    @POST("api/v1/auth/refresh")
    suspend fun refreshToken(@Header("X-Refresh-Token") refreshToken: String): Response<AuthResponse>
    
    @POST("api/v1/auth/logout")
    suspend fun logout(): Response<Unit>
    
    @GET("api/v1/users/me")
    suspend fun getCurrentUser(): Response<User>
    
    @PUT("api/v1/users/me")
    suspend fun updateProfile(@Body request: UpdateProfileRequest): Response<User>
    
    @DELETE("api/v1/users/me")
    suspend fun deleteAccount(): Response<Unit>
    
    @PUT("api/v1/users/me/password")
    suspend fun changePassword(
        @Body request: ChangePasswordRequest
    ): Response<Unit>
}

data class ChangePasswordRequest(
    val currentPassword: String,
    val newPassword: String
)
