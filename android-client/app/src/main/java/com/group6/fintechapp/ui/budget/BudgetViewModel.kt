package com.group6.fintechapp.ui.budget

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.group6.fintechapp.data.api.BudgetApi
import com.group6.fintechapp.data.model.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class BudgetUiState(
    val isLoading: Boolean = true,
    val budgets: List<Budget> = emptyList(),
    val summary: BudgetSummary? = null,
    val selectedBudget: BudgetDetail? = null,
    val categories: List<Category> = emptyList(),
    val error: String? = null,
    val isCreating: Boolean = false,
    val createSuccess: Boolean = false
)

data class BudgetSummary(
    val totalBudgets: Int = 0,
    val budgetsExceeded: Int = 0,
    val budgetsWarning: Int = 0,
    val totalLimit: Long = 0,
    val totalSpent: Long = 0,
    val remaining: Long = 0,
    val period: String = "month"
)

data class Budget(
    val id: String,
    val userId: String,
    val categoryId: String,
    val categoryName: String?,
    val categoryIcon: String?,
    val categoryColor: String?,
    val amountLimit: Long,
    val spent: Long = 0,
    val remaining: Long = 0,
    val percentage: Float = 0f,
    val period: String,
    val startDate: String,
    val endDate: String?,
    val alertThreshold: Int = 80,
    val isOverBudget: Boolean = false,
    val shouldAlert: Boolean = false,
    val isActive: Boolean = true
)

data class BudgetDetail(
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
    val period: String,
    val transactions: List<Transaction>?,
    val isOverBudget: Boolean = false,
    val shouldAlert: Boolean = false
)

@HiltViewModel
class BudgetViewModel @Inject constructor(
    private val budgetApi: BudgetApi
) : ViewModel() {

    private val _uiState = MutableStateFlow(BudgetUiState())
    val uiState: StateFlow<BudgetUiState> = _uiState.asStateFlow()

    init {
        loadBudgets()
    }

    fun loadBudgets() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response = budgetApi.getBudgets()
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.update { it.copy(
                        isLoading = false,
                        budgets = response.body()!!.data ?: emptyList()
                    ) }
                } else {
                    _uiState.update { it.copy(
                        isLoading = false,
                        error = response.body()?.error ?: "Không thể tải ngân sách"
                    ) }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(
                    isLoading = false,
                    error = "Lỗi: ${e.message}"
                ) }
            }
        }
    }

    fun loadBudgetSummary(period: String = "month") {
        viewModelScope.launch {
            try {
                val response = budgetApi.getBudgetSummary(period)
                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()!!.data!!
                    _uiState.update { it.copy(summary = BudgetSummary(
                        totalBudgets = data.totalBudgets,
                        budgetsExceeded = data.budgetsExceeded,
                        budgetsWarning = data.budgetsWarning,
                        totalLimit = data.totalLimit,
                        totalSpent = data.totalSpent,
                        remaining = data.remaining,
                        period = data.period
                    )) }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Lỗi: ${e.message}") }
            }
        }
    }

    fun loadBudgetDetail(budgetId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response = budgetApi.getBudget(budgetId)
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.update { it.copy(
                        isLoading = false,
                        selectedBudget = response.body()!!.data
                    ) }
                } else {
                    _uiState.update { it.copy(
                        isLoading = false,
                        error = response.body()?.error ?: "Không thể tải chi tiết"
                    ) }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(
                    isLoading = false,
                    error = "Lỗi: ${e.message}"
                ) }
            }
        }
    }

    fun createBudget(categoryId: String, amountLimit: Long, period: String = "month", alertThreshold: Int = 80) {
        viewModelScope.launch {
            _uiState.update { it.copy(isCreating = true, error = null) }
            try {
                val response = budgetApi.createBudget(
                    CreateBudgetRequest(
                        categoryId = categoryId,
                        amountLimit = amountLimit,
                        period = period,
                        alertThreshold = alertThreshold
                    )
                )
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.update { it.copy(isCreating = false, createSuccess = true) }
                    loadBudgets()
                } else {
                    _uiState.update { it.copy(
                        isCreating = false,
                        error = response.body()?.error ?: "Không thể tạo ngân sách"
                    ) }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(
                    isCreating = false,
                    error = "Lỗi: ${e.message}"
                ) }
            }
        }
    }

    fun updateBudget(budgetId: String, amountLimit: Long? = null, alertThreshold: Int? = null) {
        viewModelScope.launch {
            _uiState.update { it.copy(isCreating = true, error = null) }
            try {
                val response = budgetApi.updateBudget(
                    budgetId,
                    UpdateBudgetRequest(
                        amountLimit = amountLimit,
                        alertThreshold = alertThreshold
                    )
                )
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.update { it.copy(isCreating = false, createSuccess = true) }
                    loadBudgets()
                } else {
                    _uiState.update { it.copy(
                        isCreating = false,
                        error = response.body()?.error ?: "Không thể cập nhật"
                    ) }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(
                    isCreating = false,
                    error = "Lỗi: ${e.message}"
                ) }
            }
        }
    }

    fun deleteBudget(budgetId: String) {
        viewModelScope.launch {
            try {
                budgetApi.deleteBudget(budgetId)
                loadBudgets()
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Lỗi: ${e.message}") }
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    fun resetCreateSuccess() {
        _uiState.update { it.copy(createSuccess = false) }
    }
}
