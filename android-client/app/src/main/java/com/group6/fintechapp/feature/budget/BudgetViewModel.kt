package com.group6.fintechapp.feature.budget

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.group6.fintechapp.core.network.ApiResponse
import com.group6.fintechapp.data.model.*
import com.group6.fintechapp.data.repository.BudgetRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class BudgetUiState(
    val isLoading: Boolean = false,
    val budgets: List<Budget> = emptyList(),
    val summary: BudgetSummary? = null,
    val alerts: List<BudgetAlert> = emptyList(),
    val error: String? = null
)

class BudgetViewModel(
    private val repository: BudgetRepository = BudgetRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(BudgetUiState())
    val uiState: StateFlow<BudgetUiState> = _uiState.asStateFlow()

    init {
        loadBudgets()
        loadSummary()
    }

    fun loadBudgets(period: BudgetPeriod? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            when (val result = repository.getBudgets(period)) {
                is ApiResponse.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        budgets = result.data
                    )
                }
                is ApiResponse.Error -> {
                    // Show mock data when server is unavailable
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        budgets = getMockBudgets(),
                        summary = getMockSummary(),
                        error = null
                    )
                }
                is ApiResponse.Exception -> {
                    // Show mock data when network error
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        budgets = getMockBudgets(),
                        summary = getMockSummary(),
                        error = null
                    )
                }
            }
        }
    }

    private fun loadSummary() {
        viewModelScope.launch {
            when (val result = repository.getSummary()) {
                is ApiResponse.Success -> {
                    _uiState.value = _uiState.value.copy(summary = result.data)
                }
                else -> {
                    _uiState.value = _uiState.value.copy(summary = getMockSummary())
                }
            }
        }
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

    private fun getMockSummary(): BudgetSummary {
        return BudgetSummary(
            totalBudget = 3000000.0,
            totalSpent = 1900000.0,
            totalRemaining = 1100000.0,
            budgetCount = 3,
            exceededCount = 0,
            healthScore = 75
        )
    }

    fun createBudget(request: CreateBudgetRequest) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            when (val result = repository.createBudget(request)) {
                is ApiResponse.Success -> {
                    loadBudgets()
                    loadSummary()
                }
                is ApiResponse.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = result.message
                    )
                }
                is ApiResponse.Exception -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = result.throwable.message
                    )
                }
            }
        }
    }

    fun deleteBudget(id: String) {
        viewModelScope.launch {
            when (repository.deleteBudget(id)) {
                is ApiResponse.Success -> {
                    loadBudgets()
                    loadSummary()
                }
                else -> { /* handle error */ }
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
