package com.group6.fintechapp.ui.qr

import android.graphics.Bitmap
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import com.group6.fintechapp.data.api.QRApi
import com.group6.fintechapp.data.model.*
import com.group6.fintechapp.data.repository.TokenRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class QRUiState(
    val isLoading: Boolean = false,
    val qrBitmap: Bitmap? = null,
    val qrPayload: QRPayload? = null,
    val processResult: QRProcessResult? = null,
    val error: String? = null,
    val transferSuccess: Boolean = false
)

@HiltViewModel
class QRViewModel @Inject constructor(
    private val qrApi: QRApi,
    private val transactionApi: com.group6.fintechapp.data.api.TransactionApi,
    private val tokenRepository: TokenRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(QRUiState())
    val uiState: StateFlow<QRUiState> = _uiState.asStateFlow()

    val userId: StateFlow<String?> = tokenRepository.userId.asStateFlow()

    fun generateReceiveQR(message: String?, autoAllocate: Boolean = true) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val request = GenerateReceiveQRRequest(
                    message = message,
                    autoAllocate = autoAllocate
                )
                val response = qrApi.generateReceiveQR(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()!!.data!!
                    val bitmap = generateQRBitmap(data.qrData)
                    _uiState.update { it.copy(
                        isLoading = false,
                        qrBitmap = bitmap,
                        qrPayload = data.payload
                    ) }
                } else {
                    _uiState.update { it.copy(
                        isLoading = false,
                        error = response.body()?.error ?: "Không thể tạo QR"
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

    fun processQR(qrData: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val request = ProcessQRRequest(qrData)
                val response = qrApi.processQR(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.update { it.copy(
                        isLoading = false,
                        processResult = response.body()!!.data
                    ) }
                } else {
                    _uiState.update { it.copy(
                        isLoading = false,
                        error = response.body()?.error ?: "QR không hợp lệ"
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

    fun confirmTransfer(qrData: String, fundId: String?) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val request = ConfirmTransferRequest(qrData = qrData, fundId = fundId)
                val response = qrApi.confirmTransfer(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.update { it.copy(
                        isLoading = false,
                        transferSuccess = true
                    ) }
                } else {
                    _uiState.update { it.copy(
                        isLoading = false,
                        error = response.body()?.error ?: "Không thể xác nhận chuyển tiền"
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

    private fun generateQRBitmap(data: String): Bitmap {
        val size = 512
        val bit = QRCodeWriter().encode(data, BarcodeFormat.QR_CODE, size, size)
        val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.RGB_565)
        for (x in 0 until size) {
            for (y in 0 until size) {
                bmp.setPixel(x, y, if (bit[x, y]) android.graphics.Color.BLACK else android.graphics.Color.WHITE)
            }
        }
        return bmp
    }

    fun clearState() {
        _uiState.update { QRUiState() }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}
