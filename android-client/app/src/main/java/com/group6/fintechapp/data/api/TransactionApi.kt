package com.group6.fintechapp.data.api

import com.group6.fintechapp.core.network.PaginatedResponse
import com.group6.fintechapp.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface TransactionApi {
    
    @GET("api/v1/transactions")
    suspend fun getTransactions(
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 20,
        @Query("accountId") accountId: String? = null,
        @Query("categoryId") categoryId: String? = null,
        @Query("type") type: TransactionType? = null,
        @Query("startDate") startDate: String? = null,
        @Query("endDate") endDate: String? = null,
        @Query("minAmount") minAmount: Double? = null,
        @Query("maxAmount") maxAmount: Double? = null,
        @Query("search") searchQuery: String? = null
    ): Response<PaginatedResponse<Transaction>>
    
    @GET("api/v1/transactions/{id}")
    suspend fun getTransaction(@Path("id") transactionId: String): Response<Transaction>
    
    @POST("api/v1/transactions")
    suspend fun createTransaction(@Body request: CreateTransactionRequest): Response<Transaction>
    
    @PUT("api/v1/transactions/{id}")
    suspend fun updateTransaction(
        @Path("id") transactionId: String,
        @Body request: CreateTransactionRequest
    ): Response<Transaction>
    
    @DELETE("api/v1/transactions/{id}")
    suspend fun deleteTransaction(@Path("id") transactionId: String): Response<Unit>
    
    @GET("api/v1/transactions/summary")
    suspend fun getTransactionSummary(
        @Query("startDate") startDate: String,
        @Query("endDate") endDate: String
    ): Response<TransactionSummary>
    
    @GET("api/v1/categories")
    suspend fun getCategories(): Response<List<TransactionCategory>>
    
    @GET("api/v1/transactions/recent")
    suspend fun getRecentTransactions(
        @Query("limit") limit: Int = 10
    ): Response<List<Transaction>>
}
