package com.group6.fintechapp.data.api

import com.group6.fintechapp.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface AuthApi {
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<ApiResponse<AuthData>>

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<AuthData>>

    @POST("auth/refresh")
    suspend fun refreshToken(@Body request: RefreshRequest): Response<ApiResponse<RefreshData>>

    @POST("auth/logout")
    suspend fun logout(@Body request: LogoutRequest): Response<ApiResponse<Unit>>
}

interface BankApi {
    @GET("banks")
    suspend fun getBanks(): Response<ApiResponse<List<Bank>>>

    @GET("banks/{code}")
    suspend fun getBank(@Path("code") code: String): Response<ApiResponse<Bank>>

    @POST("banks/connect")
    suspend fun connectBank(@Body request: ConnectBankRequest): Response<ApiResponse<ConnectedBankAccount>>

    @GET("banks/{code}/balance")
    suspend fun getBalance(
        @Path("code") code: String,
        @Query("userId") userId: String
    ): Response<ApiResponse<BalanceData>>
}

interface FundApi {
    @GET("funds")
    suspend fun getFunds(): Response<ApiResponse<List<Fund>>>

    @GET("funds/{id}")
    suspend fun getFund(@Path("id") id: String): Response<ApiResponse<FundDetail>>

    @POST("funds")
    suspend fun createFund(@Body request: CreateFundRequest): Response<ApiResponse<Fund>>

    @PUT("funds/{id}")
    suspend fun updateFund(@Path("id") id: String, @Body request: UpdateFundRequest): Response<ApiResponse<Fund>>

    @DELETE("funds/{id}")
    suspend fun deleteFund(@Path("id") id: String): Response<ApiResponse<Unit>>

    @POST("funds/contribute")
    suspend fun contribute(@Body request: ContributeRequest): Response<ApiResponse<Contribution>>
}

interface TransactionApi {
    @GET("transactions")
    suspend fun getTransactions(
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 20,
        @Query("type") type: String? = null,
        @Query("fundId") fundId: String? = null
    ): Response<ApiResponse<List<Transaction>>>

    @GET("transactions/summary")
    suspend fun getSummary(@Query("period") period: String = "month"): Response<ApiResponse<TransactionSummary>>

    @GET("transactions/{id}")
    suspend fun getTransaction(@Path("id") id: String): Response<ApiResponse<Transaction>>

    @POST("transactions")
    suspend fun createTransaction(@Body request: CreateTransactionRequest): Response<ApiResponse<Transaction>>

    @POST("transactions/transfer")
    suspend fun transfer(@Body request: TransferRequest): Response<ApiResponse<Transaction>>

    @DELETE("transactions/{id}")
    suspend fun deleteTransaction(@Path("id") id: String): Response<ApiResponse<Unit>>
}

interface QRApi {
    @POST("qr/generate-receive")
    suspend fun generateReceiveQR(@Body request: GenerateReceiveQRRequest): Response<ApiResponse<QRData>>

    @POST("qr/generate-transfer")
    suspend fun generateTransferQR(@Body request: GenerateTransferQRRequest): Response<ApiResponse<QRData>>

    @POST("qr/process")
    suspend fun processQR(@Body request: ProcessQRRequest): Response<ApiResponse<QRProcessResult>>

    @POST("qr/confirm-transfer")
    suspend fun confirmTransfer(@Body request: ConfirmTransferRequest): Response<ApiResponse<TransferConfirmResult>>
}

interface NotificationApi {
    @GET("notifications")
    suspend fun getNotifications(
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 20,
        @Query("unreadOnly") unreadOnly: Boolean = false
    ): Response<ApiResponse<List<Notification>>>

    @PATCH("notifications/{id}/read")
    suspend fun markAsRead(@Path("id") id: String): Response<ApiResponse<Unit>>

    @PATCH("notifications/read-all")
    suspend fun markAllAsRead(): Response<ApiResponse<Unit>>

    @DELETE("notifications/{id}")
    suspend fun deleteNotification(@Path("id") id: String): Response<ApiResponse<Unit>>
}

interface UserApi {
    @GET("users/me")
    suspend fun getProfile(): Response<ApiResponse<UserProfile>>

    @PUT("users/me")
    suspend fun updateProfile(@Body request: UpdateProfileRequest): Response<ApiResponse<UserProfile>>

    @POST("users/me/password")
    suspend fun changePassword(@Body request: ChangePasswordRequest): Response<ApiResponse<Unit>>
}

interface AllocationApi {
    @GET("allocations")
    suspend fun getAllocationRules(): Response<ApiResponse<List<AllocationRule>>>

    @POST("allocations")
    suspend fun createAllocationRule(@Body request: CreateAllocationRuleRequest): Response<ApiResponse<AllocationRule>>

    @PUT("allocations/{id}")
    suspend fun updateAllocationRule(@Path("id") id: String, @Body request: UpdateAllocationRuleRequest): Response<ApiResponse<AllocationRule>>

    @DELETE("allocations/{id}")
    suspend fun deleteAllocationRule(@Path("id") id: String): Response<ApiResponse<Unit>>
}

interface BudgetApi {
    @GET("budgets")
    suspend fun getBudgets(
        @Query("period") period: String? = null
    ): Response<ApiResponse<List<Budget>>>

    @GET("budgets/{id}")
    suspend fun getBudget(@Path("id") id: String): Response<ApiResponse<BudgetDetail>>

    @GET("budgets/summary")
    suspend fun getBudgetSummary(@Query("period") period: String = "month"): Response<ApiResponse<BudgetSummaryData>>

    @POST("budgets")
    suspend fun createBudget(@Body request: CreateBudgetRequest): Response<ApiResponse<Budget>>

    @PUT("budgets/{id}")
    suspend fun updateBudget(@Path("id") id: String, @Body request: UpdateBudgetRequest): Response<ApiResponse<Budget>>

    @DELETE("budgets/{id}")
    suspend fun deleteBudget(@Path("id") id: String): Response<ApiResponse<Unit>>

    @POST("budgets/check-alerts")
    suspend fun checkBudgetAlerts(): Response<ApiResponse<Any>>
}

interface ReportApi {
    @GET("reports/summary")
    suspend fun getSummary(@Query("period") period: String = "month"): Response<ApiResponse<ReportSummary>>

    @GET("reports/category-breakdown")
    suspend fun getCategoryBreakdown(
        @Query("period") period: String = "month",
        @Query("limit") limit: Int = 10
    ): Response<ApiResponse<List<CategoryBreakdown>>>

    @GET("reports/monthly")
    suspend fun getMonthlyReport(@Query("months") months: Int = 6): Response<ApiResponse<MonthlyReport>>

    @GET("reports/trends")
    suspend fun getTrends(): Response<ApiResponse<TrendsReport>>
}

interface BillApi {
    @GET("bills")
    suspend fun getBills(
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 20,
        @Query("status") status: String? = null
    ): Response<ApiResponse<List<Bill>>>

    @GET("bills/{id}")
    suspend fun getBill(@Path("id") id: String): Response<ApiResponse<Bill>>

    @GET("bills/stats/overview")
    suspend fun getBillStats(): Response<ApiResponse<BillStats>>

    @DELETE("bills/{id}")
    suspend fun deleteBill(@Path("id") id: String): Response<ApiResponse<Unit>>
}
