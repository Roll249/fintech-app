package com.group6.fintechapp.data.api

import com.group6.fintechapp.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface BudgetApi {
    
    @GET("api/v1/budgets")
    suspend fun getBudgets(
        @Query("period") period: BudgetPeriod? = null
    ): Response<List<Budget>>
    
    @GET("api/v1/budgets/{id}")
    suspend fun getBudget(@Path("id") budgetId: String): Response<Budget>
    
    @POST("api/v1/budgets")
    suspend fun createBudget(@Body request: CreateBudgetRequest): Response<Budget>
    
    @PUT("api/v1/budgets/{id}")
    suspend fun updateBudget(
        @Path("id") budgetId: String,
        @Body request: UpdateBudgetRequest
    ): Response<Budget>
    
    @DELETE("api/v1/budgets/{id}")
    suspend fun deleteBudget(@Path("id") budgetId: String): Response<Unit>
    
    @GET("api/v1/budgets/summary")
    suspend fun getBudgetSummary(): Response<BudgetSummary>
    
    @GET("api/v1/budgets/alerts")
    suspend fun getBudgetAlerts(): Response<List<BudgetAlert>>
    
    @POST("api/v1/budgets/{id}/reset")
    suspend fun resetBudget(@Path("id") budgetId: String): Response<Budget>
}
