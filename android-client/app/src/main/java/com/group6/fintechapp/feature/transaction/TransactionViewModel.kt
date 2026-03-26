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
