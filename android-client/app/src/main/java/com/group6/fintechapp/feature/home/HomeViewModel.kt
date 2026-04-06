package com.group6.fintechapp.feature.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.group6.fintechapp.core.network.ApiClient
import com.group6.fintechapp.data.api.AccountApi
import com.group6.fintechapp.data.api.BudgetApi
import com.group6.fintechapp.data.api.TransactionApi
import com.group6.fintechapp.data.api.UserApi
import com.group6.fintechapp.data.model.*
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter

data class HomeUiState(
    val isLoading: Boolean = false,
    val user: User? = null,
    val totalBalance: Double = 0.0,
    val transactionSummary: TransactionSummary? = null,
    val recentTransactions: List<Transaction> = emptyList(),
    val budgetAlerts: List<BudgetAlert> = emptyList(),
    val budgets: List<Budget> = emptyList(),
    val categories: List<TransactionCategory> = emptyList(),
    val error: String? = null,
    val isAddingTransaction: Boolean = false,
    val addTransactionSuccess: Boolean = false
)

class HomeViewModel(
    private val userApi: UserApi = ApiClient.createService(),
    private val transactionApi: TransactionApi = ApiClient.createService(),
    private val accountApi: AccountApi = ApiClient.createService(),
    private val budgetApi: BudgetApi = ApiClient.createService()
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadAllData()
    }

    fun loadAllData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            val userDeferred = async { fetchUser() }
            val balanceDeferred = async { fetchTotalBalance() }
            val summaryDeferred = async { fetchTransactionSummary() }
            val recentDeferred = async { fetchRecentTransactions() }
            val alertsDeferred = async { fetchBudgetAlerts() }
            val budgetsDeferred = async { fetchBudgets() }
            val categoriesDeferred = async { fetchCategories() }

            val user = userDeferred.await()
            val balance = balanceDeferred.await()
            val summary = summaryDeferred.await()
            val recent = recentDeferred.await()
            val alerts = alertsDeferred.await()
            val budgets = budgetsDeferred.await()
            val categories = categoriesDeferred.await()

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                user = user,
                totalBalance = balance,
                transactionSummary = summary,
                recentTransactions = recent,
                budgetAlerts = alerts,
                budgets = budgets,
                categories = categories
            )
        }
    }

    private suspend fun fetchUser(): User? {
        return try {
            val response = userApi.getCurrentUser()
            if (response.isSuccessful) {
                response.body()
            } else {
                getMockUser()
            }
        } catch (e: Exception) {
            getMockUser()
        }
    }

    private suspend fun fetchTotalBalance(): Double {
        return try {
            val response = accountApi.getAccountSummary()
            if (response.isSuccessful) {
                response.body()?.totalBalance ?: 0.0
            } else {
                getMockTotalBalance()
            }
        } catch (e: Exception) {
            getMockTotalBalance()
        }
    }

    private suspend fun fetchTransactionSummary(): TransactionSummary? {
        return try {
            val now = LocalDate.now()
            val startDate = now.withDayOfMonth(1).format(DateTimeFormatter.ISO_DATE)
            val endDate = now.format(DateTimeFormatter.ISO_DATE)
            
            val response = transactionApi.getTransactionSummary(startDate, endDate)
            if (response.isSuccessful) {
                response.body()
            } else {
                getMockTransactionSummary()
            }
        } catch (e: Exception) {
            getMockTransactionSummary()
        }
    }

    private suspend fun fetchRecentTransactions(): List<Transaction> {
        return try {
            val response = transactionApi.getRecentTransactions(limit = 5)
            if (response.isSuccessful) {
                response.body() ?: emptyList()
            } else {
                getMockRecentTransactions()
            }
        } catch (e: Exception) {
            getMockRecentTransactions()
        }
    }

    private suspend fun fetchBudgetAlerts(): List<BudgetAlert> {
        return try {
            val response = budgetApi.getBudgetAlerts()
            if (response.isSuccessful) {
                response.body() ?: emptyList()
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            emptyList()
        }
    }

    private suspend fun fetchBudgets(): List<Budget> {
        return try {
            val response = budgetApi.getBudgets(BudgetPeriod.MONTHLY)
            if (response.isSuccessful) {
                response.body() ?: emptyList()
            } else {
                getMockBudgets()
            }
        } catch (e: Exception) {
            getMockBudgets()
        }
    }

    private suspend fun fetchCategories(): List<TransactionCategory> {
        return try {
            val response = transactionApi.getCategories()
            if (response.isSuccessful) {
                response.body() ?: emptyList()
            } else {
                getMockCategories()
            }
        } catch (e: Exception) {
            getMockCategories()
        }
    }

    fun createTransaction(request: CreateTransactionRequest) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isAddingTransaction = true, addTransactionSuccess = false)
            try {
                val response = transactionApi.createTransaction(request)
                if (response.isSuccessful) {
                    _uiState.value = _uiState.value.copy(
                        isAddingTransaction = false,
                        addTransactionSuccess = true
                    )
                    loadAllData()
                } else {
                    _uiState.value = _uiState.value.copy(
                        isAddingTransaction = false,
                        error = "Failed to create transaction"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isAddingTransaction = false,
                    error = e.message ?: "Network error"
                )
            }
        }
    }

    fun clearAddTransactionSuccess() {
        _uiState.value = _uiState.value.copy(addTransactionSuccess = false)
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    // Mock data fallbacks
    private fun getMockUser(): User {
        return User(
            id = "mock-user",
            email = "user@example.com",
            name = "Nguyen Van A",
            createdAt = "2024-01-01T00:00:00Z"
        )
    }

    private fun getMockTotalBalance(): Double = 23500000.0

    private fun getMockTransactionSummary(): TransactionSummary {
        return TransactionSummary(
            totalIncome = 15000000.0,
            totalExpense = 8500000.0,
            netAmount = 6500000.0,
            transactionCount = 25,
            topCategories = emptyList()
        )
    }

    private fun getMockRecentTransactions(): List<Transaction> {
        val defaultCategory = TransactionCategory(
            id = "1",
            name = "Food & Dining",
            icon = "restaurant",
            color = "#FF9800",
            type = TransactionType.EXPENSE
        )
        return listOf(
            Transaction(
                id = "1",
                accountId = "default",
                amount = 45000.0,
                type = TransactionType.EXPENSE,
                category = defaultCategory,
                description = "Coffee Shop",
                date = "2024-03-28",
                createdAt = "2024-03-28T10:00:00Z"
            ),
            Transaction(
                id = "2",
                accountId = "default",
                amount = 15000000.0,
                type = TransactionType.INCOME,
                category = TransactionCategory("2", "Salary", "payments", "#4CAF50", TransactionType.INCOME),
                description = "Monthly Salary",
                date = "2024-03-27",
                createdAt = "2024-03-27T09:00:00Z"
            ),
            Transaction(
                id = "3",
                accountId = "default",
                amount = 85000.0,
                type = TransactionType.EXPENSE,
                category = defaultCategory,
                description = "Grab Food",
                date = "2024-03-26",
                createdAt = "2024-03-26T12:00:00Z"
            ),
            Transaction(
                id = "4",
                accountId = "default",
                amount = 350000.0,
                type = TransactionType.EXPENSE,
                category = TransactionCategory("3", "Bills", "receipt", "#2196F3", TransactionType.EXPENSE),
                description = "Electric Bill",
                date = "2024-03-20",
                createdAt = "2024-03-20T08:00:00Z"
            )
        )
    }

    private fun getMockBudgets(): List<Budget> {
        return listOf(
            Budget(
                id = "1",
                userId = "user1",
                categoryId = "1",
                category = TransactionCategory("1", "Food & Dining", "restaurant", "#FF9800", TransactionType.EXPENSE),
                limit = 1000000.0,
                spent = 850000.0,
                remaining = 150000.0,
                period = BudgetPeriod.MONTHLY,
                alertThreshold = 80,
                isExceeded = false,
                startDate = "2024-03-01",
                endDate = "2024-03-31",
                createdAt = "2024-03-01T00:00:00Z"
            ),
            Budget(
                id = "2",
                userId = "user1",
                categoryId = "2",
                category = TransactionCategory("2", "Entertainment", "movie", "#9C27B0", TransactionType.EXPENSE),
                limit = 1000000.0,
                spent = 600000.0,
                remaining = 400000.0,
                period = BudgetPeriod.MONTHLY,
                alertThreshold = 80,
                isExceeded = false,
                startDate = "2024-03-01",
                endDate = "2024-03-31",
                createdAt = "2024-03-01T00:00:00Z"
            ),
            Budget(
                id = "3",
                userId = "user1",
                categoryId = "3",
                category = TransactionCategory("3", "Shopping", "shopping_cart", "#E91E63", TransactionType.EXPENSE),
                limit = 1000000.0,
                spent = 450000.0,
                remaining = 550000.0,
                period = BudgetPeriod.MONTHLY,
                alertThreshold = 80,
                isExceeded = false,
                startDate = "2024-03-01",
                endDate = "2024-03-31",
                createdAt = "2024-03-01T00:00:00Z"
            )
        )
    }

    private fun getMockCategories(): List<TransactionCategory> {
        return listOf(
            TransactionCategory("1", "Food & Dining", "restaurant", "#FF9800", TransactionType.EXPENSE),
            TransactionCategory("2", "Transportation", "directions_car", "#2196F3", TransactionType.EXPENSE),
            TransactionCategory("3", "Shopping", "shopping_cart", "#E91E63", TransactionType.EXPENSE),
            TransactionCategory("4", "Entertainment", "movie", "#9C27B0", TransactionType.EXPENSE),
            TransactionCategory("5", "Bills & Utilities", "receipt", "#607D8B", TransactionType.EXPENSE),
            TransactionCategory("6", "Health", "local_hospital", "#F44336", TransactionType.EXPENSE),
            TransactionCategory("7", "Education", "school", "#3F51B5", TransactionType.EXPENSE),
            TransactionCategory("8", "Salary", "payments", "#4CAF50", TransactionType.INCOME),
            TransactionCategory("9", "Other", "more_horiz", "#9E9E9E", TransactionType.EXPENSE)
        )
    }
}
