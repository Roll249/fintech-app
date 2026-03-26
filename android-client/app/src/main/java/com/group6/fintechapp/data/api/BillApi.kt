package com.group6.fintechapp.data.api

import com.group6.fintechapp.core.network.PaginatedResponse
import com.group6.fintechapp.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface BillApi {
    
    @GET("api/v1/bills")
    suspend fun getBills(
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 20,
        @Query("status") status: BillStatus? = null
    ): Response<PaginatedResponse<Bill>>
    
    @GET("api/v1/bills/{id}")
    suspend fun getBill(@Path("id") billId: String): Response<Bill>
    
    @POST("api/v1/bills/upload")
    suspend fun uploadBill(@Body request: UploadBillRequest): Response<Bill>
    
    @PUT("api/v1/bills/{id}")
    suspend fun updateBill(
        @Path("id") billId: String,
        @Body request: UpdateBillRequest
    ): Response<Bill>
    
    @DELETE("api/v1/bills/{id}")
    suspend fun deleteBill(@Path("id") billId: String): Response<Unit>
    
    @POST("api/v1/bills/{id}/reprocess")
    suspend fun reprocessBill(@Path("id") billId: String): Response<Bill>
    
    @POST("api/v1/bills/{id}/create-transaction")
    suspend fun createTransactionFromBill(
        @Path("id") billId: String,
        @Body request: CreateTransactionFromBillRequest
    ): Response<Transaction>
}
