package com.group6.fintechapp.ui.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.group6.fintechapp.data.api.UserApi
import com.group6.fintechapp.data.model.*
import com.group6.fintechapp.data.repository.TokenRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProfileUiState(
    val isLoading: Boolean = true,
    val user: UserProfile? = null,
    val error: String? = null
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val userApi: UserApi,
    private val tokenRepository: TokenRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    val userName: StateFlow<String?> = tokenRepository.userName.asStateFlow()
    val userEmail: StateFlow<String?> = tokenRepository.userEmail.asStateFlow()

    init {
        loadProfile()
    }

    fun loadProfile() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response = userApi.getProfile()
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.update { it.copy(
                        isLoading = false,
                        user = response.body()!!.data
                    ) }
                } else {
                    _uiState.update { it.copy(
                        isLoading = false,
                        error = response.body()?.error ?: "Không thể tải hồ sơ"
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

    fun updateProfile(name: String?, phone: String?) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val request = UpdateProfileRequest(name = name, phone = phone)
                val response = userApi.updateProfile(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.update { it.copy(
                        isLoading = false,
                        user = response.body()!!.data
                    ) }
                } else {
                    _uiState.update { it.copy(
                        isLoading = false,
                        error = response.body()?.error ?: "Không thể cập nhật hồ sơ"
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
}
