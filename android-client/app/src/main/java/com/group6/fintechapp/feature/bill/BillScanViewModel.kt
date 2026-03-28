package com.group6.fintechapp.feature.bill

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.group6.fintechapp.core.network.ApiClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class OcrResult(
    val merchantName: String? = null,
    val totalAmount: Double? = null,
    val date: String? = null,
    val tax: Double? = null,
    val items: List<OcrItem> = emptyList(),
    val rawText: String? = null
)

data class OcrItem(
    val name: String,
    val price: Double,
    val quantity: Int = 1
)

data class BillScanUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val ocrResult: OcrResult? = null,
    val billId: String? = null
)

class BillScanViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(BillScanUiState())
    val uiState: StateFlow<BillScanUiState> = _uiState.asStateFlow()

    private val billApi = ApiClient.createService<BillApi>()

    fun uploadBill(base64Image: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            try {
                val request = BillUploadRequest(image = base64Image)
                val response = billApi.uploadBill(request)

                if (response.isSuccessful && response.body() != null) {
                    val bill = response.body()!!
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        billId = bill.id,
                        ocrResult = bill.ocrData?.let { ocr ->
                            OcrResult(
                                merchantName = ocr.merchantName,
                                totalAmount = ocr.totalAmount,
                                date = ocr.date,
                                tax = ocr.tax,
                                items = ocr.items?.map { item ->
                                    OcrItem(
                                        name = item.name,
                                        price = item.price,
                                        quantity = item.quantity ?: 1
                                    )
                                } ?: emptyList(),
                                rawText = ocr.rawText
                            )
                        }
                    )

                    // If OCR is still processing, poll for results
                    if (bill.ocrStatus == "processing") {
                        pollForOcrResult(bill.id)
                    }
                } else {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = "Failed to upload bill: ${response.message()}"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "Error: ${e.message}"
                )
            }
        }
    }

    private fun pollForOcrResult(billId: String) {
        viewModelScope.launch {
            var attempts = 0
            val maxAttempts = 10
            
            while (attempts < maxAttempts) {
                kotlinx.coroutines.delay(2000) // Wait 2 seconds
                
                try {
                    val response = billApi.getBill(billId)
                    if (response.isSuccessful && response.body() != null) {
                        val bill = response.body()!!
                        
                        if (bill.ocrStatus == "completed" && bill.ocrData != null) {
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                ocrResult = OcrResult(
                                    merchantName = bill.ocrData.merchantName,
                                    totalAmount = bill.ocrData.totalAmount,
                                    date = bill.ocrData.date,
                                    tax = bill.ocrData.tax,
                                    items = bill.ocrData.items?.map { item ->
                                        OcrItem(
                                            name = item.name,
                                            price = item.price,
                                            quantity = item.quantity ?: 1
                                        )
                                    } ?: emptyList(),
                                    rawText = bill.ocrData.rawText
                                )
                            )
                            return@launch
                        } else if (bill.ocrStatus == "failed") {
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                error = "OCR processing failed"
                            )
                            return@launch
                        }
                    }
                } catch (e: Exception) {
                    // Continue polling
                }
                
                attempts++
            }
            
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                error = "OCR processing timed out"
            )
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
