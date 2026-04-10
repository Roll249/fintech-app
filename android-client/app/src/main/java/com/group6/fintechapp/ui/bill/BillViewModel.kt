package com.group6.fintechapp.ui.bill

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.group6.fintechapp.data.api.BillApi
import com.group6.fintechapp.data.model.Bill
import com.group6.fintechapp.data.model.BillStats
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class BillViewModel @Inject constructor(
    private val billApi: BillApi
) : ViewModel() {

    private val _uiState = MutableStateFlow(BillUiState())
    val uiState: StateFlow<BillUiState> = _uiState.asStateFlow()

    init {
        loadBills()
    }

    fun loadBills() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response = billApi.getBills()
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.update { it.copy(
                        isLoading = false,
                        bills = response.body()!!.data ?: emptyList()
                    ) }
                } else {
                    _uiState.update { it.copy(
                        isLoading = false,
                        error = response.body()?.error ?: "Không thể tải hóa đơn"
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

    fun loadStats() {
        viewModelScope.launch {
            try {
                val response = billApi.getBillStats()
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.update { it.copy(stats = response.body()!!.data) }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Lỗi: ${e.message}") }
            }
        }
    }

    fun uploadBill(imageBytes: ByteArray) {
        viewModelScope.launch {
            _uiState.update { it.copy(isUploading = true, error = null) }
            try {
                // In a real app, this would use MultipartBody.Part
                // For now, we'll simulate the upload
                _uiState.update { it.copy(
                    isUploading = false,
                    uploadSuccess = true
                ) }
                loadBills()
                loadStats()
            } catch (e: Exception) {
                _uiState.update { it.copy(
                    isUploading = false,
                    error = "Lỗi: ${e.message}"
                ) }
            }
        }
    }

    fun deleteBill(billId: String) {
        viewModelScope.launch {
            try {
                billApi.deleteBill(billId)
                loadBills()
                loadStats()
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Lỗi: ${e.message}") }
            }
        }
    }

    fun resetUploadState() {
        _uiState.update { it.copy(isUploading = false, uploadSuccess = false) }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}
