package com.group6.fintechapp.data.api

import com.group6.fintechapp.core.network.PaginatedResponse
import com.group6.fintechapp.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface AccountApi {
    
    @GET("api/v1/accounts")
    suspend fun getAccounts(): Response<List<BankAccount>>
    
    @GET("api/v1/accounts/{id}")
    suspend fun getAccount(@Path("id") accountId: String): Response<BankAccount>
    
    @POST("api/v1/accounts/connect")
    suspend fun connectAccount(@Body request: ConnectAccountRequest): Response<BankAccount>
    
    @DELETE("api/v1/accounts/{id}")
    suspend fun disconnectAccount(@Path("id") accountId: String): Response<Unit>
    
    @POST("api/v1/accounts/{id}/sync")
    suspend fun syncAccount(@Path("id") accountId: String): Response<SyncResult>
    
    @GET("api/v1/accounts/summary")
    suspend fun getAccountSummary(): Response<AccountSummary>
    
    @GET("api/v1/accounts/banks")
    suspend fun getSupportedBanks(): Response<List<Bank>>
    
    @GET("api/v1/accounts/{id}/transactions")
    suspend fun getAccountTransactions(
        @Path("id") accountId: String,
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 20
    ): Response<PaginatedResponse<Transaction>>
    
    @POST("api/v1/accounts/{id}/generate-test-transactions")
    suspend fun generateTestTransactions(
        @Path("id") accountId: String,
        @Body request: GenerateTestTransactionsRequest = GenerateTestTransactionsRequest()
    ): Response<GenerateTestTransactionsResponse>
}

data class SyncResult(
    val message: String,
    val balance: Double,
    val lastSyncedAt: String,
    val transactionsFound: Int,
    val syncStatus: String
)

data class GenerateTestTransactionsRequest(
    val count: Int = 3
)

data class GenerateTestTransactionsResponse(
    val message: String,
    val transactions: List<Transaction>,
    val newBalance: Double,
    val balanceChange: Double
)
