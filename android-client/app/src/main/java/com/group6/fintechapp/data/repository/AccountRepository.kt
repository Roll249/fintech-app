package com.group6.fintechapp.data.repository

import com.group6.fintechapp.core.network.ApiClient
import com.group6.fintechapp.core.network.ApiResponse
import com.group6.fintechapp.core.network.PaginatedResponse
import com.group6.fintechapp.data.api.AccountApi
import com.group6.fintechapp.data.api.GenerateTestTransactionsRequest
import com.group6.fintechapp.data.api.GenerateTestTransactionsResponse
import com.group6.fintechapp.data.api.SyncResult
import com.group6.fintechapp.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AccountRepository {
    private val api: AccountApi = ApiClient.createService()

    suspend fun getAccounts(): ApiResponse<List<BankAccount>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getAccounts()
            if (response.isSuccessful && response.body() != null) {
                ApiResponse.Success(response.body()!!)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun getAccount(accountId: String): ApiResponse<BankAccount> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.getAccount(accountId)
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun connectAccount(request: ConnectAccountRequest): ApiResponse<BankAccount> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.connectAccount(request)
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun disconnectAccount(accountId: String): ApiResponse<Unit> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.disconnectAccount(accountId)
                if (response.isSuccessful) {
                    ApiResponse.Success(Unit)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun syncAccount(accountId: String): ApiResponse<SyncResult> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.syncAccount(accountId)
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun getAccountSummary(): ApiResponse<AccountSummary> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.getAccountSummary()
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun getSupportedBanks(): ApiResponse<List<Bank>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getSupportedBanks()
            if (response.isSuccessful && response.body() != null) {
                ApiResponse.Success(response.body()!!)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun getAccountTransactions(
        accountId: String,
        page: Int = 1,
        pageSize: Int = 20
    ): ApiResponse<PaginatedResponse<Transaction>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getAccountTransactions(accountId, page, pageSize)
            if (response.isSuccessful && response.body() != null) {
                ApiResponse.Success(response.body()!!)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    /**
     * Generate test transactions for demo/testing purposes
     * @param accountId The account to generate transactions for
     * @param count Number of transactions to generate (1-10)
     */
    suspend fun generateTestTransactions(
        accountId: String,
        count: Int = 3
    ): ApiResponse<GenerateTestTransactionsResponse> = withContext(Dispatchers.IO) {
        try {
            val response = api.generateTestTransactions(
                accountId, 
                GenerateTestTransactionsRequest(count)
            )
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
