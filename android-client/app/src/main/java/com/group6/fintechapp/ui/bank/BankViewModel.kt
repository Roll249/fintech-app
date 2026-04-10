package com.group6.fintechapp.ui.bank

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.group6.fintechapp.data.api.BankApi
import com.group6.fintechapp.data.model.*
import com.group6.fintechapp.data.repository.TokenRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class BankUiState(
    val isLoading: Boolean = true,
    val banks: List<Bank> = emptyList(),
    val connectedBanks: List<ConnectedBankAccount> = emptyList(),
    val error: String? = null,
    val isConnecting: Boolean = false
)

@HiltViewModel
class BankViewModel @Inject constructor(
    private val bankApi: BankApi,
    private val tokenRepository: TokenRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(BankUiState())
    val uiState: StateFlow<BankUiState> = _uiState.asStateFlow()

    init {
        loadBanks()
    }

    fun loadBanks() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response = bankApi.getBanks()
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.update { it.copy(
                        isLoading = false,
                        banks = response.body()!!.data ?: emptyList()
                    ) }
                } else {
                    _uiState.update { it.copy(
                        isLoading = false,
                        error = response.body()?.error ?: "Không thể tải danh sách ngân hàng"
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

    fun connectBank(bankCode: String, accountNumber: String, accountHolder: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isConnecting = true, error = null) }
            try {
                val userId = tokenRepository.getUserIdSync() ?: return@launch
                val request = ConnectBankRequest(
                    userId = userId,
                    bankCode = bankCode,
                    accountNumber = accountNumber,
                    accountHolder = accountHolder
                )
                val response = bankApi.connectBank(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.update { it.copy(isConnecting = false) }
                    loadBanks()
                } else {
                    _uiState.update { it.copy(
                        isConnecting = false,
                        error = response.body()?.error ?: "Không thể kết nối ngân hàng"
                    ) }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(
                    isConnecting = false,
                    error = "Lỗi: ${e.message}"
                ) }
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}
