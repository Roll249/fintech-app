package com.group6.fintechapp.data.repository

import com.group6.fintechapp.core.network.ApiClient
import com.group6.fintechapp.core.network.ApiResponse
import com.group6.fintechapp.core.network.PaginatedResponse
import com.group6.fintechapp.data.api.ReportApi
import com.group6.fintechapp.data.api.ReportDownloadResponse
import com.group6.fintechapp.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ReportRepository {
    private val api: ReportApi = ApiClient.createService()

    suspend fun getReports(
        page: Int = 1,
        pageSize: Int = 20,
        type: ReportType? = null
    ): ApiResponse<PaginatedResponse<Report>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getReports(page, pageSize, type)
            if (response.isSuccessful && response.body() != null) {
                ApiResponse.Success(response.body()!!)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun getReport(reportId: String): ApiResponse<Report> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.getReport(reportId)
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun generateReport(request: GenerateReportRequest): ApiResponse<Report> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.generateReport(request)
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun deleteReport(reportId: String): ApiResponse<Unit> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.deleteReport(reportId)
                if (response.isSuccessful) {
                    ApiResponse.Success(Unit)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun getDownloadUrl(reportId: String): ApiResponse<ReportDownloadResponse> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.getReportDownloadUrl(reportId)
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun getMonthlyReport(year: Int, month: Int): ApiResponse<ReportSummary> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.getMonthlyReport(year, month)
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun getYearlyReport(year: Int): ApiResponse<ReportSummary> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.getYearlyReport(year)
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun getTrends(months: Int = 6): ApiResponse<List<MonthlyData>> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.getSpendingTrends(months)
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun getInsights(): ApiResponse<List<ReportInsight>> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.getInsights()
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
