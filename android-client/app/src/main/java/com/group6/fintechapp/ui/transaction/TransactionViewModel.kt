package com.group6.fintechapp.ui.transaction

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.group6.fintechapp.data.api.TransactionApi
import com.group6.fintechapp.data.model.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TransactionUiState(
    val isLoading: Boolean = true,
    val transactions: List<Transaction> = emptyList(),
    val summary: TransactionSummary? = null,
    val error: String? = null,
    val isCreating: Boolean = false
)

@HiltViewModel
class TransactionViewModel @Inject constructor(
    private val transactionApi: TransactionApi
) : ViewModel() {

    private val _uiState = MutableStateFlow(TransactionUiState())
    val uiState: StateFlow<TransactionUiState> = _uiState.asStateFlow()

    private var currentPage = 1

    init {
        loadTransactions()
    }

    fun loadTransactions(page: Int = 1) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response = transactionApi.getTransactions(page = page, pageSize = 20)
                if (response.isSuccessful && response.body()?.success == true) {
                    val newTransactions = response.body()!!.data ?: emptyList()
                    _uiState.update { state ->
                        state.copy(
                            isLoading = false,
                            transactions = if (page == 1) newTransactions else state.transactions + newTransactions
                        )
                    }
                } else {
                    _uiState.update { it.copy(
                        isLoading = false,
                        error = response.body()?.error ?: "Không thể tải giao dịch"
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

    fun loadMore() {
        currentPage++
        loadTransactions(currentPage)
    }

    fun createTransaction(
        type: String,
        amount: Long,
        categoryId: String?,
        description: String?,
        fundId: String?
    ) {
        viewModelScope.launch {
            _uiState.update { it.copy(isCreating = true, error = null) }
            try {
                val request = CreateTransactionRequest(
                    type = type,
                    amount = amount,
                    categoryId = categoryId,
                    description = description,
                    fundId = fundId,
                    source = "MANUAL"
                )
                val response = transactionApi.createTransaction(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.update { it.copy(isCreating = false) }
                    loadTransactions(1)
                } else {
                    _uiState.update { it.copy(
                        isCreating = false,
                        error = response.body()?.error ?: "Không thể tạo giao dịch"
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

    fun deleteTransaction(transactionId: String) {
        viewModelScope.launch {
            try {
                transactionApi.deleteTransaction(transactionId)
                _uiState.update { state ->
                    state.copy(transactions = state.transactions.filter { it.id != transactionId })
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Lỗi: ${e.message}") }
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}