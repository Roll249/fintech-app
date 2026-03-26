package com.group6.fintechapp.data.model

import com.google.gson.annotations.SerializedName

// ============== Transaction Service Models ==============

data class Transaction(
    val id: String,
    val accountId: String,
    val amount: Double,
    val type: TransactionType,
    val category: TransactionCategory,
    val description: String,
    val merchantName: String? = null,
    val date: String,
    val createdAt: String,
    val isManual: Boolean = false,
    val tags: List<String> = emptyList()
)

enum class TransactionType {
    @SerializedName("income") INCOME,
    @SerializedName("expense") EXPENSE,
    @SerializedName("transfer") TRANSFER
}

data class TransactionCategory(
    val id: String,
    val name: String,
    val icon: String,
    val color: String,
    val type: TransactionType
)

data class CreateTransactionRequest(
    val accountId: String,
    val amount: Double,
    val type: TransactionType,
    val categoryId: String,
    val description: String,
    val merchantName: String? = null,
    val date: String,
    val tags: List<String>? = null
)

data class TransactionFilter(
    val accountId: String? = null,
    val categoryId: String? = null,
    val type: TransactionType? = null,
    val startDate: String? = null,
    val endDate: String? = null,
    val minAmount: Double? = null,
    val maxAmount: Double? = null,
    val searchQuery: String? = null
)

data class TransactionSummary(
    val totalIncome: Double,
    val totalExpense: Double,
    val netAmount: Double,
    val transactionCount: Int,
    val topCategories: List<CategorySpending>
)

data class CategorySpending(
    val category: TransactionCategory,
    val amount: Double,
    val percentage: Double,
    val count: Int
)
