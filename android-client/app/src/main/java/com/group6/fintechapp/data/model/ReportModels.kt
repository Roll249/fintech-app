package com.group6.fintechapp.data.model

import com.google.gson.annotations.SerializedName

// ============== Report Service Models ==============

data class Report(
    val id: String,
    val userId: String,
    val type: ReportType,
    val period: ReportPeriod,
    val startDate: String,
    val endDate: String,
    val status: ReportStatus,
    val summary: ReportSummary? = null,
    val downloadUrl: String? = null,
    val createdAt: String
)

enum class ReportType {
    @SerializedName("monthly") MONTHLY,
    @SerializedName("yearly") YEARLY,
    @SerializedName("custom") CUSTOM
}

enum class ReportPeriod(val months: Int) {
    @SerializedName("month") MONTH(1),
    @SerializedName("quarter") QUARTER(3),
    @SerializedName("year") YEAR(12)
}

enum class ReportStatus {
    @SerializedName("pending") PENDING,
    @SerializedName("generating") GENERATING,
    @SerializedName("completed") COMPLETED,
    @SerializedName("failed") FAILED
}

data class ReportSummary(
    val totalIncome: Double,
    val totalExpense: Double,
    val netSavings: Double,
    val savingsRate: Double,
    val topExpenseCategories: List<CategorySpending>,
    val topIncomeCategories: List<CategorySpending>,
    val monthlyTrend: List<MonthlyData>,
    val budgetAdherence: Double,
    val insights: List<ReportInsight>
)

data class MonthlyData(
    val month: String,
    val income: Double,
    val expense: Double,
    val savings: Double
)

data class ReportInsight(
    val type: InsightType,
    val title: String,
    val description: String,
    val value: Double? = null,
    val trend: TrendDirection? = null
)

enum class InsightType {
    @SerializedName("spending_increase") SPENDING_INCREASE,
    @SerializedName("spending_decrease") SPENDING_DECREASE,
    @SerializedName("savings_goal") SAVINGS_GOAL,
    @SerializedName("budget_tip") BUDGET_TIP,
    @SerializedName("category_alert") CATEGORY_ALERT
}

enum class TrendDirection {
    @SerializedName("up") UP,
    @SerializedName("down") DOWN,
    @SerializedName("stable") STABLE
}

data class GenerateReportRequest(
    val type: ReportType,
    val startDate: String,
    val endDate: String,
    val includeCharts: Boolean = true,
    val format: ExportFormat = ExportFormat.PDF
)

enum class ExportFormat {
    @SerializedName("pdf") PDF,
    @SerializedName("csv") CSV,
    @SerializedName("excel") EXCEL
}

// Dashboard data for admin
data class AdminDashboard(
    val totalUsers: Int,
    val activeUsers: Int,
    val totalTransactions: Long,
    val totalVolume: Double,
    val userGrowth: List<MonthlyData>,
    val transactionGrowth: List<MonthlyData>
)
