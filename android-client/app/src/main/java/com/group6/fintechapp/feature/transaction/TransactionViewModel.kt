package com.group6.fintechapp.feature.transaction

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.group6.fintechapp.core.network.ApiResponse
import com.group6.fintechapp.data.model.*
import com.group6.fintechapp.data.repository.TransactionRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class TransactionUiState(
    val isLoading: Boolean = false,
    val transactions: List<Transaction> = emptyList(),
    val categories: List<TransactionCategory> = emptyList(),
    val summary: TransactionSummary? = null,
    val error: String? = null,
    val selectedFilter: TransactionFilter? = null
)

class TransactionViewModel(
    private val repository: TransactionRepository = TransactionRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(TransactionUiState())
    val uiState: StateFlow<TransactionUiState> = _uiState.asStateFlow()

    init {
        loadTransactions()
        loadCategories()
    }

    fun loadTransactions(filter: TransactionFilter? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            when (val result = repository.getTransactions(filter = filter)) {
                is ApiResponse.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        transactions = result.data,
                        selectedFilter = filter
                    )
                }
                is ApiResponse.Error -> {
                    // Show mock data when server is unavailable
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        transactions = getMockTransactions(),
                        error = null
                    )
                }
                is ApiResponse.Exception -> {
                    // Show mock data when network error
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        transactions = getMockTransactions(),
                        error = null
                    )
                }
            }
        }
    }

    private fun getMockTransactions(): List<Transaction> {
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

    private fun loadCategories() {
        viewModelScope.launch {
            when (val result = repository.getCategories()) {
                is ApiResponse.Success -> {
                    _uiState.value = _uiState.value.copy(categories = result.data)
                }
                else -> { /* ignore category loading errors */ }
            }
        }
    }

    fun createTransaction(request: CreateTransactionRequest) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            when (val result = repository.createTransaction(request)) {
                is ApiResponse.Success -> {
                    loadTransactions(_uiState.value.selectedFilter)
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

    fun deleteTransaction(id: String) {
        viewModelScope.launch {
            when (repository.deleteTransaction(id)) {
                is ApiResponse.Success -> {
                    loadTransactions(_uiState.value.selectedFilter)
                }
                else -> { /* handle error */ }
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
