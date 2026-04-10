package com.group6.fintechapp.data.model

import com.google.gson.annotations.SerializedName

// ==================== BASE ====================
data class ApiResponse<T>(
    val success: Boolean,
    val data: T?,
    val error: String? = null,
    val code: String? = null
)

data class PaginatedResponse<T>(
    val items: List<T>,
    val page: Int,
    val pageSize: Int,
    val totalItems: Int,
    val totalPages: Int
)

// ==================== AUTH ====================
data class RegisterRequest(
    val email: String,
    val password: String,
    val name: String,
    val phone: String? = null
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class RefreshRequest(
    val refreshToken: String
)

data class LogoutRequest(
    val refreshToken: String? = null
)

data class AuthData(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Int,
    val user: UserInfo
)

data class UserInfo(
    val id: String,
    val email: String,
    val name: String,
    val role: String
)

data class RefreshData(
    val accessToken: String,
    val expiresIn: Int
)

// ==================== USER ====================
data class UserProfile(
    val id: String,
    val email: String,
    val name: String,
    val phone: String?,
    val avatarUrl: String?,
    val role: String,
    val isActive: Boolean,
    val stats: UserStats?,
    val connectedBanks: List<ConnectedBank>
)

data class UserStats(
    val totalIncome: Long,
    val totalExpense: Long,
    val netBalance: Long,
    val totalFunds: Int,
    val totalFundAmount: Long
)

data class UpdateProfileRequest(
    val name: String? = null,
    val phone: String? = null,
    val avatarUrl: String? = null
)

data class ChangePasswordRequest(
    val currentPassword: String,
    val newPassword: String
)

// ==================== BANK ====================
data class Bank(
    val id: String,
    val code: String,
    val name: String,
    val logoUrl: String?,
    val color: String?,
    val qrPrefix: String?,
    val mockBalance: Long?,
    val isActive: Boolean?
)

data class ConnectBankRequest(
    val userId: String,
    val bankCode: String,
    val accountNumber: String,
    val accountHolder: String
)

data class ConnectedBankAccount(
    val id: String,
    val accountNumber: String,
    val accountHolder: String,
    val balance: Long,
    val currency: String,
    val bank: BankInfo?
)

data class BankInfo(
    val code: String,
    val name: String,
    val logoUrl: String?,
    val color: String?
)

data class ConnectedBank(
    val code: String,
    val name: String,
    val logoUrl: String?,
    val color: String?,
    val balance: Long?
)

data class BalanceData(
    val balance: Long,
    val currency: String,
    val lastUpdated: String
)

// ==================== FUND ====================
data class Fund(
    val id: String,
    val userId: String,
    val name: String,
    val description: String?,
    val targetAmount: Long?,
    val currentAmount: Long,
    val icon: String,
    val color: String,
    val fundType: String,
    val priority: Int,
    val isActive: Boolean,
    val createdAt: String,
    val updatedAt: String?
)

data class FundDetail(
    val id: String,
    val userId: String,
    val name: String,
    val description: String?,
    val targetAmount: Long?,
    val currentAmount: Long,
    val icon: String,
    val color: String,
    val fundType: String,
    val priority: Int,
    val isActive: Boolean,
    val contributions: List<Contribution>?
)

data class CreateFundRequest(
    val name: String,
    val description: String? = null,
    val targetAmount: Long? = null,
    val icon: String = "savings",
    val color: String = "#4CAF50"
)

data class UpdateFundRequest(
    val name: String? = null,
    val description: String? = null,
    val targetAmount: Long? = null,
    val icon: String? = null,
    val color: String? = null,
    val isActive: Boolean? = null
)

data class ContributeRequest(
    val fundId: String,
    val amount: Long,
    val type: String, // "deposit" or "withdraw"
    val note: String? = null
)

data class Contribution(
    val id: String,
    val fundId: String,
    val userId: String,
    val amount: Long,
    val type: String,
    val note: String?,
    val createdAt: String
)

// ==================== TRANSACTION ====================
data class Transaction(
    val id: String,
    val userId: String,
    val accountId: String?,
    val type: String,
    val amount: Long,
    val categoryId: String?,
    val categoryName: String?,
    val categoryIcon: String?,
    val categoryColor: String?,
    val description: String?,
    val fundId: String?,
    val fundName: String?,
    val fundColor: String?,
    val counterpartyUserId: String?,
    val counterpartyName: String?,
    val source: String,
    val status: String,
    val transactionRef: String,
    val transactionDate: String,
    val createdAt: String
)

data class TransactionSummary(
    val totalIncome: Long,
    val totalExpense: Long,
    val totalTransfer: Long,
    val totalTransactions: Int,
    val netBalance: Long,
    val categoryBreakdown: List<CategoryBreakdown>?
)

data class CategoryBreakdown(
    val id: String,
    val name: String,
    val icon: String?,
    val color: String?,
    val total: Long
)

data class CreateTransactionRequest(
    val type: String,
    val amount: Long,
    val categoryId: String? = null,
    val description: String? = null,
    val fundId: String? = null,
    val counterpartyUserId: String? = null,
    val counterpartyName: String? = null,
    val source: String = "MANUAL"
)

data class TransferRequest(
    val targetUserId: String,
    val amount: Long,
    val sourceFundId: String? = null,
    val description: String? = null,
    val qrSignature: String? = null
)

// ==================== QR ====================
data class GenerateReceiveQRRequest(
    val message: String? = null,
    val autoAllocate: Boolean = true,
    val amount: Long? = null
)

data class GenerateTransferQRRequest(
    val targetUserId: String,
    val amount: Long,
    val description: String,
    val sourceFundId: String? = null
)

data class QRData(
    val qrData: String,
    val payload: QRPayload,
    val expiresAt: String
)

data class QRPayload(
    val version: String,
    val type: String,
    val userId: String? = null,
    val senderId: String? = null,
    val targetUserId: String? = null,
    val amount: Long?,
    val message: String? = null,
    val description: String? = null,
    val autoAllocate: Boolean? = null,
    val timestamp: Long,
    val signature: String?
)

data class ProcessQRRequest(
    val qrData: String
)

data class QRProcessResult(
    val type: String,
    val canReceive: Boolean? = null,
    val canPay: Boolean? = null,
    val senderName: String?,
    val amount: Long?,
    val message: String?,
    val description: String?,
    val autoAllocate: Boolean? = null
)

data class ConfirmTransferRequest(
    val qrData: String,
    val fundId: String? = null
)

data class TransferConfirmResult(
    val transaction: Transaction?,
    val deductedFromFund: Boolean,
    val fundId: String?
)

// ==================== ALLOCATION ====================
data class AllocationRule(
    val id: String,
    val userId: String,
    val name: String,
    val priority: Int,
    val conditions: AllocationConditions,
    val allocations: List<FundAllocation>,
    val isActive: Boolean,
    val createdAt: String,
    val updatedAt: String?
)

data class AllocationConditions(
    val minAmount: Long? = null,
    val maxAmount: Long? = null,
    val source: String? = null
)

data class FundAllocation(
    val fundId: String,
    val fundName: String?,
    val type: String,
    val value: Long
)

data class CreateAllocationRuleRequest(
    val name: String,
    val priority: Int = 1,
    val conditions: AllocationConditions = AllocationConditions(),
    val allocations: List<AllocationInput>,
    val isActive: Boolean = true
)

data class AllocationInput(
    val fundId: String,
    val type: String, // "PERCENTAGE" or "FIXED"
    val value: Long
)

data class UpdateAllocationRuleRequest(
    val name: String? = null,
    val priority: Int? = null,
    val conditions: AllocationConditions? = null,
    val allocations: List<AllocationInput>? = null,
    val isActive: Boolean? = null
)

// ==================== NOTIFICATION ====================
data class Notification(
    val id: String,
    val userId: String,
    val type: String,
    val title: String,
    val body: String?,
    val data: Map<String, Any>?,
    val isRead: Boolean,
    val createdAt: String
)

// ==================== BUDGET ====================
data class BudgetSummaryData(
    val totalBudgets: Int,
    val budgetsExceeded: Int,
    val budgetsWarning: Int,
    val totalLimit: Long,
    val totalSpent: Long,
    val remaining: Long,
    val period: String
)

data class BudgetData(
    val id: String,
    val userId: String,
    val categoryId: String,
    val categoryName: String?,
    val categoryIcon: String?,
    val categoryColor: String?,
    val amountLimit: Long,
    val spent: Long,
    val remaining: Long,
    val percentage: Float,
    val isOverBudget: Boolean,
    val shouldAlert: Boolean,
    val period: String,
    val startDate: String,
    val endDate: String?,
    val alertThreshold: Int
)

data class BudgetDetailData(
    val id: String,
    val categoryId: String,
    val categoryName: String?,
    val categoryIcon: String?,
    val categoryColor: String?,
    val amountLimit: Long,
    val spent: Long,
    val remaining: Long,
    val percentage: Float,
    val period: String,
    val transactions: List<Transaction>?,
    val isOverBudget: Boolean,
    val shouldAlert: Boolean
)

data class CreateBudgetRequest(
    val categoryId: String,
    val amountLimit: Long,
    val period: String = "monthly",
    val alertThreshold: Int = 80
)

data class UpdateBudgetRequest(
    val amountLimit: Long? = null,
    val alertThreshold: Int? = null,
    val period: String? = null,
    val isActive: Boolean? = null
)

// ==================== REPORT ====================
data class ReportSummary(
    val summary: FinancialSummary,
    val categoryBreakdown: List<CategoryBreakdown>,
    val fundsSummary: List<FundSummary>,
    val dailyTrend: List<DailyTrend>,
    val monthlyComparison: MonthlyComparison
)

data class FinancialSummary(
    val totalIncome: Long,
    val totalExpense: Long,
    val totalTransfer: Long,
    val netBalance: Long,
    val totalTransactions: Int
)

data class CategoryBreakdown(
    val id: String,
    val name: String,
    val icon: String?,
    val color: String?,
    val type: String?,
    val total: Long,
    val percentage: Int,
    val count: Int? = null,
    val average: Int? = null
)

data class FundSummary(
    val id: String,
    val name: String,
    val color: String?,
    val currentAmount: Long,
    val contributionCount: Int
)

data class DailyTrend(
    val date: String,
    val income: Long,
    val expense: Long
)

data class MonthlyComparison(
    val currentMonth: MonthData,
    val lastMonth: MonthData,
    val incomeChange: Int,
    val expenseChange: Int
)

data class MonthData(
    val income: Long,
    val expense: Long
)

data class MonthlyReport(
    val monthly: List<MonthlyData>,
    val topCategoriesByMonth: Map<String, List<TopCategory>>
)

data class MonthlyData(
    val month: String,
    val income: Long,
    val expense: Long,
    val net: Long
)

data class TopCategory(
    val name: String,
    val color: String?,
    val total: Long
)

data class TrendsReport(
    val dailySpending: List<DailySpending>,
    val weeklyPattern: List<WeeklyPattern>,
    val timeOfDay: List<TimeOfDaySpending>,
    val topPlaces: List<TopPlace>
)

data class DailySpending(
    val date: String,
    val total: Long,
    val count: Int
)

data class WeeklyPattern(
    val dayOfWeek: String,
    val average: Long,
    val count: Int
)

data class TimeOfDaySpending(
    val period: String,
    val total: Long
)

data class TopPlace(
    val name: String,
    val total: Long,
    val count: Int
)

// ==================== BILL ====================
data class Bill(
    val id: String,
    val userId: String,
    val imageUrl: String?,
    val ocrRawText: String?,
    val ocrConfidence: Double?,
    val merchantName: String?,
    val totalAmount: Long?,
    val billDate: String?,
    val items: List<BillItem>?,
    val status: String,
    val billType: String?,
    val linkedTransactionId: String?,
    val transactionAmount: Long?,
    val transactionDescription: String?,
    val createdAt: String
)

data class BillItem(
    val name: String,
    val quantity: Int?,
    val price: Long?
)

data class BillStats(
    val totalBills: Int,
    val processedBills: Int,
    val pendingBills: Int,
    val failedBills: Int,
    val reviewBills: Int,
    val totalAmount: Long,
    val avgConfidence: Int,
    val topMerchants: List<TopMerchant>,
    val typeDistribution: List<TypeDistribution>
)

data class TopMerchant(
    val name: String,
    val count: Int,
    val total: Long
)

data class TypeDistribution(
    val type: String,
    val count: Int
)

// ==================== ERROR ====================
data class InsufficientFundError(
    val error: String,
    val code: String,
    val shortfall: Long,
    val fundId: String,
    val fundName: String,
    val availableAmount: Long,
    val requestedAmount: Long
)