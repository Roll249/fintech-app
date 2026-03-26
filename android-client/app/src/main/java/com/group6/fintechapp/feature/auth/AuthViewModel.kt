package com.group6.fintechapp.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.group6.fintechapp.core.network.ApiResponse
import com.group6.fintechapp.data.model.RegisterRequest
import com.group6.fintechapp.data.model.User
import com.group6.fintechapp.data.repository.UserRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AuthUiState(
    val isLoading: Boolean = false,
    val isAuthenticated: Boolean = false,
    val user: User? = null,
    val error: String? = null
)

class AuthViewModel(
    private val repository: UserRepository = UserRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            // For demo purposes, allow any login
            // In production, this would call the actual API
            kotlinx.coroutines.delay(1000) // Simulate network delay
            
            when (val result = repository.login(email, password)) {
                is ApiResponse.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isAuthenticated = true,
                        user = result.data.user
                    )
                }
                is ApiResponse.Error -> {
                    // For demo, still allow login even on error
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isAuthenticated = true // Demo mode: always succeed
                    )
                }
                is ApiResponse.Exception -> {
                    // For demo, still allow login even on exception
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isAuthenticated = true // Demo mode: always succeed
                    )
                }
            }
        }
    }

    fun register(email: String, password: String, name: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            kotlinx.coroutines.delay(1000) // Simulate network delay
            
            when (val result = repository.register(RegisterRequest(email, password, name))) {
                is ApiResponse.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isAuthenticated = true,
                        user = result.data.user
                    )
                }
                is ApiResponse.Error -> {
                    // Demo mode: allow registration
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isAuthenticated = true
                    )
                }
                is ApiResponse.Exception -> {
                    // Demo mode: allow registration
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isAuthenticated = true
                    )
                }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            repository.logout()
            _uiState.value = AuthUiState()
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
