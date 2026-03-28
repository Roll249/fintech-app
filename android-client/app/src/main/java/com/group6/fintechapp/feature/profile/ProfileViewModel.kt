package com.group6.fintechapp.feature.profile

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.group6.fintechapp.core.network.ApiResponse
import com.group6.fintechapp.core.settings.AppSettings
import com.group6.fintechapp.core.settings.SettingsDataStore
import com.group6.fintechapp.core.settings.ThemeMode
import com.group6.fintechapp.data.model.User
import com.group6.fintechapp.data.repository.UserRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ProfileUiState(
    val isLoading: Boolean = false,
    val user: User? = null,
    val error: String? = null,
    val isLoggedOut: Boolean = false,
    val settings: AppSettings = AppSettings()
)

class ProfileViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository: UserRepository = UserRepository()
    private val settingsDataStore = SettingsDataStore.getInstance(application)

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        loadProfile()
        observeSettings()
    }
    
    private fun observeSettings() {
        viewModelScope.launch {
            settingsDataStore.settingsFlow.collect { settings ->
                _uiState.value = _uiState.value.copy(settings = settings)
            }
        }
    }

    fun loadProfile() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            when (val result = repository.getCurrentUser()) {
                is ApiResponse.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        user = result.data
                    )
                }
                is ApiResponse.Error, is ApiResponse.Exception -> {
                    // Use mock data when API fails
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        user = User(
                            id = "mock-user",
                            email = "demo@fintechapp.com",
                            name = "Demo User",
                            phone = "+84 123 456 789",
                            avatarUrl = null,
                            createdAt = "2024-01-01T00:00:00Z"
                        )
                    )
                }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            repository.logout()
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                isLoggedOut = true,
                user = null
            )
        }
    }
    
    fun setThemeMode(mode: ThemeMode) {
        viewModelScope.launch {
            settingsDataStore.setThemeMode(mode)
        }
    }
    
    fun setLanguage(language: String) {
        viewModelScope.launch {
            settingsDataStore.setLanguage(language)
        }
    }
    
    fun setCurrency(currency: String) {
        viewModelScope.launch {
            settingsDataStore.setCurrency(currency)
        }
    }
    
    fun setBiometricEnabled(enabled: Boolean) {
        viewModelScope.launch {
            settingsDataStore.setBiometricEnabled(enabled)
        }
    }
    
    fun set2FAEnabled(enabled: Boolean) {
        viewModelScope.launch {
            settingsDataStore.set2FAEnabled(enabled)
        }
    }
    
    fun setPushNotifications(enabled: Boolean) {
        viewModelScope.launch {
            settingsDataStore.setPushNotifications(enabled)
        }
    }
    
    fun setEmailNotifications(enabled: Boolean) {
        viewModelScope.launch {
            settingsDataStore.setEmailNotifications(enabled)
        }
    }
    
    fun setBudgetAlerts(enabled: Boolean) {
        viewModelScope.launch {
            settingsDataStore.setBudgetAlerts(enabled)
        }
    }
    
    fun setTransactionAlerts(enabled: Boolean) {
        viewModelScope.launch {
            settingsDataStore.setTransactionAlerts(enabled)
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
