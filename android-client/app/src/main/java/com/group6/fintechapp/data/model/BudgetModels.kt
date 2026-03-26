package com.group6.fintechapp.data.model

import com.google.gson.annotations.SerializedName

// ============== Budget Service Models ==============

data class Budget(
    val id: String,
    val userId: String,
    val categoryId: String,
    val category: TransactionCategory,
    val limit: Double,
    val spent: Double,
    val remaining: Double,
    val period: BudgetPeriod,
    val startDate: String,
    val endDate: String,
    val alertThreshold: Int = 80,
    val isExceeded: Boolean,
    val createdAt: String
)

enum class BudgetPeriod {
    @SerializedName("daily") DAILY,
    @SerializedName("weekly") WEEKLY,
    @SerializedName("monthly") MONTHLY,
    @SerializedName("yearly") YEARLY
}

data class CreateBudgetRequest(
    val categoryId: String,
    val limit: Double,
    val period: BudgetPeriod,
    val alertThreshold: Int = 80
)

data class UpdateBudgetRequest(
    val limit: Double? = null,
    val alertThreshold: Int? = null
)

data class BudgetAlert(
    val budgetId: String,
    val budget: Budget,
    val alertType: BudgetAlertType,
    val percentage: Int,
    val message: String,
    val createdAt: String
)

enum class BudgetAlertType {
    @SerializedName("warning") WARNING,
    @SerializedName("exceeded") EXCEEDED
}

data class BudgetSummary(
    val totalBudget: Double,
    val totalSpent: Double,
    val totalRemaining: Double,
    val budgetCount: Int,
    val exceededCount: Int,
    val healthScore: Int // 0-100
)
