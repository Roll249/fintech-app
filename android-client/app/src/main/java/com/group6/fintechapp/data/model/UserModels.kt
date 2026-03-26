package com.group6.fintechapp.data.model

import com.google.gson.annotations.SerializedName

// ============== User Service Models ==============

data class User(
    val id: String,
    val email: String,
    val name: String,
    val avatarUrl: String? = null,
    val phone: String? = null,
    val createdAt: String,
    val role: UserRole = UserRole.USER
)

enum class UserRole {
    @SerializedName("user") USER,
    @SerializedName("admin") ADMIN
}

data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val email: String,
    val password: String,
    val name: String,
    val phone: String? = null
)

data class AuthResponse(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long,
    val user: User
)

data class UpdateProfileRequest(
    val name: String? = null,
    val phone: String? = null,
    val avatarUrl: String? = null
)
