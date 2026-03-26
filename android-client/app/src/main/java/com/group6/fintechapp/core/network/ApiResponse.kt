package com.group6.fintechapp.core.network

sealed class ApiResponse<out T> {
    data class Success<T>(val data: T) : ApiResponse<T>()
    data class Error(val code: Int, val message: String) : ApiResponse<Nothing>()
    data class Exception(val throwable: Throwable) : ApiResponse<Nothing>()
}

data class ApiError(
    val code: String,
    val message: String,
    val details: Map<String, Any>? = null
)

data class PaginatedResponse<T>(
    val items: List<T>,
    val page: Int,
    val pageSize: Int,
    val totalItems: Int,
    val totalPages: Int
)
