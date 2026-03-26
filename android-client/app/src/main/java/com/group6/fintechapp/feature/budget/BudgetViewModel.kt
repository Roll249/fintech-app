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

    private fun loadSummary() {
        viewModelScope.launch {
            when (val result = repository.getSummary()) {
                is ApiResponse.Success -> {
                    _uiState.value = _uiState.value.copy(summary = result.data)
                }
                else -> { /* ignore */ }
            }
        }
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
