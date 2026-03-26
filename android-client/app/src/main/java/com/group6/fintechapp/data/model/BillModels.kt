package com.group6.fintechapp.data.model

import com.google.gson.annotations.SerializedName

// ============== Bill Service Models ==============

data class Bill(
    val id: String,
    val userId: String,
    val imageUrl: String,
    val ocrResult: BillOcrResult? = null,
    val status: BillStatus,
    val merchantName: String? = null,
    val totalAmount: Double? = null,
    val date: String? = null,
    val items: List<BillItem> = emptyList(),
    val linkedTransactionId: String? = null,
    val createdAt: String
)

enum class BillStatus {
    @SerializedName("pending") PENDING,
    @SerializedName("processing") PROCESSING,
    @SerializedName("completed") COMPLETED,
    @SerializedName("failed") FAILED,
    @SerializedName("edited") EDITED
}

data class BillOcrResult(
    val rawText: String,
    val confidence: Double,
    val extractedData: ExtractedBillData
)

data class ExtractedBillData(
    val merchantName: String?,
    val totalAmount: Double?,
    val date: String?,
    val items: List<BillItem>,
    val taxAmount: Double?,
    val subtotal: Double?
)

data class BillItem(
    val name: String,
    val quantity: Int = 1,
    val unitPrice: Double,
    val totalPrice: Double
)

data class UploadBillRequest(
    val imageBase64: String
)

data class UpdateBillRequest(
    val merchantName: String? = null,
    val totalAmount: Double? = null,
    val date: String? = null,
    val items: List<BillItem>? = null,
    val categoryId: String? = null
)

data class CreateTransactionFromBillRequest(
    val accountId: String,
    val categoryId: String
)
