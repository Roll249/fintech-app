package com.group6.fintechapp.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.group6.fintechapp.data.api.UserApi
import com.group6.fintechapp.data.model.*
import com.group6.fintechapp.data.repository.TokenRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HomeUiState(
    val isLoading: Boolean = true,
    val user: UserProfile? = null,
    val summary: TransactionSummary? = null,
    val recentTransactions: List<Transaction> = emptyList(),
    val funds: List<Fund> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val userApi: UserApi,
    private val tokenRepository: TokenRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    val userName: StateFlow<String?> = tokenRepository.userName.asStateFlow()

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            try {
                // Load user profile
                val profileResponse = userApi.getProfile()
                if (profileResponse.isSuccessful && profileResponse.body()?.success == true) {
                    _uiState.update { it.copy(user = profileResponse.body()!!.data) }
                }

                // Load summary
                val summaryResponse = userApi.getProfile() // Reuse for now
                // In a real app, we'd call transactionApi.getSummary()

                _uiState.update { it.copy(isLoading = false) }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = "Không thể tải dữ liệu: ${e.message}"
                    )
                }
            }
        }
    }

    fun refresh() {
        loadData()
    }
}
