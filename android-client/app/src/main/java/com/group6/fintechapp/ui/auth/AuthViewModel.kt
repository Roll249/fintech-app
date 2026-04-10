package com.group6.fintechapp.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.group6.fintechapp.data.api.AuthApi
import com.group6.fintechapp.data.model.*
import com.group6.fintechapp.data.repository.TokenRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AuthUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val isSuccess: Boolean = false
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authApi: AuthApi,
    private val tokenRepository: TokenRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    val isLoggedIn: StateFlow<Boolean> = tokenRepository.isLoggedIn.asStateFlow()
    val isLoading: StateFlow<Boolean> = _uiState.map { it.isLoading }.asStateFlow()

    val userName: StateFlow<String?> = tokenRepository.userName.asStateFlow()
    val userId: StateFlow<String?> = tokenRepository.userId.asStateFlow()

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            try {
                val response = authApi.login(LoginRequest(email, password))

                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()!!.data!!
                    tokenRepository.saveTokens(
                        accessToken = data.accessToken,
                        refreshToken = data.refreshToken,
                        userId = data.user.id,
                        userName = data.user.name,
                        userEmail = data.user.email
                    )
                    _uiState.update { it.copy(isLoading = false, isSuccess = true) }
                } else {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = response.body()?.error ?: "Đăng nhập thất bại"
                        )
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = "Không thể kết nối server: ${e.message}"
                    )
                }
            }
        }
    }

    fun register(email: String, password: String, name: String, phone: String? = null) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            try {
                val response = authApi.register(RegisterRequest(email, password, name, phone))

                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()!!.data!!
                    tokenRepository.saveTokens(
                        accessToken = data.accessToken,
                        refreshToken = data.refreshToken,
                        userId = data.user.id,
                        userName = data.user.name,
                        userEmail = data.user.email
                    )
                    _uiState.update { it.copy(isLoading = false, isSuccess = true) }
                } else {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = response.body()?.error ?: "Đăng ký thất bại"
                        )
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = "Không thể kết nối server: ${e.message}"
                    )
                }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            try {
                val refreshToken = tokenRepository.getRefreshTokenSync()
                authApi.logout(LogoutRequest(refreshToken))
            } catch (e: Exception) {
                // Ignore logout API errors
            } finally {
                tokenRepository.clearTokens()
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    fun resetState() {
        _uiState.update { AuthUiState() }
    }
}
