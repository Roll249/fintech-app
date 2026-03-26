package com.group6.fintechapp.data.repository

import com.group6.fintechapp.core.network.ApiClient
import com.group6.fintechapp.core.network.ApiResponse
import com.group6.fintechapp.data.api.TransactionApi
import com.group6.fintechapp.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class TransactionRepository {
    private val api: TransactionApi = ApiClient.createService()

    suspend fun getTransactions(
        page: Int = 1,
        pageSize: Int = 20,
        filter: TransactionFilter? = null
    ): ApiResponse<List<Transaction>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getTransactions(
                page = page,
                pageSize = pageSize,
                accountId = filter?.accountId,
                categoryId = filter?.categoryId,
                type = filter?.type,
                startDate = filter?.startDate,
                endDate = filter?.endDate,
                minAmount = filter?.minAmount,
                maxAmount = filter?.maxAmount,
                searchQuery = filter?.searchQuery
            )
            if (response.isSuccessful && response.body() != null) {
                ApiResponse.Success(response.body()!!.items)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun getTransaction(id: String): ApiResponse<Transaction> = withContext(Dispatchers.IO) {
        try {
            val response = api.getTransaction(id)
            if (response.isSuccessful && response.body() != null) {
                ApiResponse.Success(response.body()!!)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun createTransaction(request: CreateTransactionRequest): ApiResponse<Transaction> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.createTransaction(request)
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun deleteTransaction(id: String): ApiResponse<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = api.deleteTransaction(id)
            if (response.isSuccessful) {
                ApiResponse.Success(Unit)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun getCategories(): ApiResponse<List<TransactionCategory>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getCategories()
            if (response.isSuccessful && response.body() != null) {
                ApiResponse.Success(response.body()!!)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun getSummary(startDate: String, endDate: String): ApiResponse<TransactionSummary> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.getTransactionSummary(startDate, endDate)
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
