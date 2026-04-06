package com.group6.fintechapp.data.api

import com.group6.fintechapp.core.network.PaginatedResponse
import com.group6.fintechapp.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ReportApi {
    
    @GET("api/v1/reports")
    suspend fun getReports(
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 20,
        @Query("type") type: ReportType? = null
    ): Response<PaginatedResponse<Report>>
    
    @GET("api/v1/reports/{id}")
    suspend fun getReport(@Path("id") reportId: String): Response<Report>
    
    @POST("api/v1/reports/generate")
    suspend fun generateReport(@Body request: GenerateReportRequest): Response<Report>
    
    @DELETE("api/v1/reports/{id}")
    suspend fun deleteReport(@Path("id") reportId: String): Response<Unit>
    
    @GET("api/v1/reports/{id}/download")
    suspend fun getReportDownloadUrl(@Path("id") reportId: String): Response<ReportDownloadResponse>
    
    @GET("api/v1/reports/monthly/{year}/{month}")
    suspend fun getMonthlyReport(
        @Path("year") year: Int,
        @Path("month") month: Int
    ): Response<ReportSummary>
    
    @GET("api/v1/reports/yearly/{year}")
    suspend fun getYearlyReport(@Path("year") year: Int): Response<ReportSummary>
    
    @GET("api/v1/reports/trends")
    suspend fun getSpendingTrends(
        @Query("months") months: Int = 6
    ): Response<List<MonthlyData>>
    
    @GET("api/v1/reports/insights")
    suspend fun getInsights(): Response<List<ReportInsight>>
    
    // Chart endpoints
    @GET("api/v1/reports/charts/category")
    suspend fun getCategoryChart(
        @Query("startDate") startDate: String? = null,
        @Query("endDate") endDate: String? = null
    ): Response<ChartResponse>
    
    @GET("api/v1/reports/charts/trends")
    suspend fun getTrendsChart(
        @Query("months") months: Int = 6,
        @Query("type") chartType: String = "bar"
    ): Response<ChartResponse>
    
    @GET("api/v1/reports/charts/budget")
    suspend fun getBudgetChart(): Response<ChartResponse>
    
    // Admin endpoints
    @GET("api/v1/admin/dashboard")
    suspend fun getAdminDashboard(): Response<AdminDashboard>
}

data class ReportDownloadResponse(
    val downloadUrl: String,
    val expiresAt: String
)

data class ChartResponse(
    val imageUrl: String?,
    val message: String? = null,
    val data: List<ChartDataPoint> = emptyList()
)

data class ChartDataPoint(
    val category: String? = null,
    val month: String? = null,
    val amount: Double? = null,
    val income: Double? = null,
    val expense: Double? = null,
    val savings: Double? = null,
    val spent: Double? = null,
    val limit: Double? = null,
    val percentage: Double? = null,
    val color: String? = null
)
