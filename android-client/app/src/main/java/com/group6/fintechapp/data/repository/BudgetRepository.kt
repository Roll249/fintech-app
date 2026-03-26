package com.group6.fintechapp.data.repository

import com.group6.fintechapp.core.network.ApiClient
import com.group6.fintechapp.core.network.ApiResponse
import com.group6.fintechapp.data.api.BudgetApi
import com.group6.fintechapp.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class BudgetRepository {
    private val api: BudgetApi = ApiClient.createService()

    suspend fun getBudgets(period: BudgetPeriod? = null): ApiResponse<List<Budget>> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.getBudgets(period)
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun getBudget(id: String): ApiResponse<Budget> = withContext(Dispatchers.IO) {
        try {
            val response = api.getBudget(id)
            if (response.isSuccessful && response.body() != null) {
                ApiResponse.Success(response.body()!!)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun createBudget(request: CreateBudgetRequest): ApiResponse<Budget> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.createBudget(request)
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun updateBudget(id: String, request: UpdateBudgetRequest): ApiResponse<Budget> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.updateBudget(id, request)
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun deleteBudget(id: String): ApiResponse<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = api.deleteBudget(id)
            if (response.isSuccessful) {
                ApiResponse.Success(Unit)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun getSummary(): ApiResponse<BudgetSummary> = withContext(Dispatchers.IO) {
        try {
            val response = api.getBudgetSummary()
            if (response.isSuccessful && response.body() != null) {
                ApiResponse.Success(response.body()!!)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun getAlerts(): ApiResponse<List<BudgetAlert>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getBudgetAlerts()
            if (response.isSuccessful && response.body() != null) {
                ApiResponse.Success(response.body()!!)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }
}
