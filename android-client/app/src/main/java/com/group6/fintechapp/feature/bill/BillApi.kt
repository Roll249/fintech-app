package com.group6.fintechapp.feature.bill

import retrofit2.Response
import retrofit2.http.*

interface BillApi {
    @POST("bills/upload")
    suspend fun uploadBill(@Body request: BillUploadRequest): Response<BillResponse>

    @GET("bills/{id}")
    suspend fun getBill(@Path("id") id: String): Response<BillResponse>

    @GET("bills")
    suspend fun getBills(
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 20
    ): Response<BillListResponse>

    @DELETE("bills/{id}")
    suspend fun deleteBill(@Path("id") id: String): Response<Unit>
}

data class BillUploadRequest(
    val image: String,
    val filename: String = "bill.jpg"
)

data class BillResponse(
    val id: String,
    val imageUrl: String?,
    val ocrStatus: String,
    val ocrData: OcrData?,
    val createdAt: String
)

data class OcrData(
    val merchantName: String?,
    val totalAmount: Double?,
    val date: String?,
    val tax: Double?,
    val items: List<OcrItemData>?,
    val rawText: String?
)

data class OcrItemData(
    val name: String,
    val price: Double,
    val quantity: Int?
)

data class BillListResponse(
    val items: List<BillResponse>,
    val page: Int,
    val pageSize: Int,
    val total: Int
)
