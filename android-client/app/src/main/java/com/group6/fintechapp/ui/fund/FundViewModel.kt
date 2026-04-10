package com.group6.fintechapp.ui.fund

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.group6.fintechapp.data.api.FundApi
import com.group6.fintechapp.data.model.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class FundUiState(
    val isLoading: Boolean = true,
    val funds: List<Fund> = emptyList(),
    val selectedFund: FundDetail? = null,
    val error: String? = null,
    val isCreating: Boolean = false,
    val createSuccess: Boolean = false
)

@HiltViewModel
class FundViewModel @Inject constructor(
    private val fundApi: FundApi
) : ViewModel() {

    private val _uiState = MutableStateFlow(FundUiState())
    val uiState: StateFlow<FundUiState> = _uiState.asStateFlow()

    init {
        loadFunds()
    }

    fun loadFunds() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response = fundApi.getFunds()
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.update { it.copy(
                        isLoading = false,
                        funds = response.body()!!.data ?: emptyList()
                    ) }
                } else {
                    _uiState.update { it.copy(
                        isLoading = false,
                        error = response.body()?.error ?: "Không thể tải danh sách quỹ"
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

    fun loadFundDetail(fundId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response = fundApi.getFund(fundId)
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.update { it.copy(
                        isLoading = false,
                        selectedFund = response.body()!!.data
                    ) }
                } else {
                    _uiState.update { it.copy(
                        isLoading = false,
                        error = response.body()?.error ?: "Không thể tải thông tin quỹ"
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

    fun createFund(name: String, description: String?, targetAmount: Long?, color: String, icon: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isCreating = true, error = null) }
            try {
                val request = CreateFundRequest(
                    name = name,
                    description = description,
                    targetAmount = targetAmount,
                    color = color,
                    icon = icon
                )
                val response = fundApi.createFund(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.update { it.copy(isCreating = false, createSuccess = true) }
                    loadFunds()
                } else {
                    _uiState.update { it.copy(
                        isCreating = false,
                        error = response.body()?.error ?: "Không thể tạo quỹ"
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

    fun contribute(fundId: String, amount: Long, type: String, note: String?) {
        viewModelScope.launch {
            _uiState.update { it.copy(isCreating = true, error = null) }
            try {
                val request = ContributeRequest(fundId = fundId, amount = amount, type = type, note = note)
                val response = fundApi.contribute(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.update { it.copy(isCreating = false, createSuccess = true) }
                    loadFundDetail(fundId)
                } else {
                    _uiState.update { it.copy(
                        isCreating = false,
                        error = response.body()?.error ?: "Không thể thực hiện giao dịch"
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

    fun deleteFund(fundId: String) {
        viewModelScope.launch {
            try {
                fundApi.deleteFund(fundId)
                loadFunds()
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