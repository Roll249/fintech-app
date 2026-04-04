package com.group6.fintechapp.data.repository

import com.group6.fintechapp.core.network.ApiClient
import com.group6.fintechapp.core.network.ApiResponse
import com.group6.fintechapp.core.network.PaginatedResponse
import com.group6.fintechapp.data.api.BillApi
import com.group6.fintechapp.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class BillRepository {
    private val api: BillApi = ApiClient.createService()

    suspend fun getBills(
        page: Int = 1,
        pageSize: Int = 20,
        status: BillStatus? = null
    ): ApiResponse<PaginatedResponse<Bill>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getBills(page, pageSize, status)
            if (response.isSuccessful && response.body() != null) {
                ApiResponse.Success(response.body()!!)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun getBill(billId: String): ApiResponse<Bill> = withContext(Dispatchers.IO) {
        try {
            val response = api.getBill(billId)
            if (response.isSuccessful && response.body() != null) {
                ApiResponse.Success(response.body()!!)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun uploadBill(request: UploadBillRequest): ApiResponse<Bill> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.uploadBill(request)
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun updateBill(billId: String, request: UpdateBillRequest): ApiResponse<Bill> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.updateBill(billId, request)
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun deleteBill(billId: String): ApiResponse<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = api.deleteBill(billId)
            if (response.isSuccessful) {
                ApiResponse.Success(Unit)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun reprocessBill(billId: String): ApiResponse<Bill> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.reprocessBill(billId)
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun createTransactionFromBill(
        billId: String,
        request: CreateTransactionFromBillRequest
    ): ApiResponse<Transaction> = withContext(Dispatchers.IO) {
        try {
            val response = api.createTransactionFromBill(billId, request)
            if (response.isSuccessful && response.body() != null) {
                ApiResponse.Success(response.body()!!)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun setReminder(billId: String): ApiResponse<Bill> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.getBill(billId)
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun deleteReminder(billId: String): ApiResponse<Unit> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.deleteBill(billId)
                if (response.isSuccessful) {
                    ApiResponse.Success(Unit)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun getReminders(): ApiResponse<PaginatedResponse<Bill>> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.getBills(page = 1, pageSize = 20, status = null)
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
