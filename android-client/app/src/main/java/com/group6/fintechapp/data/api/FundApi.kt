package com.group6.fintechapp.data.api

import com.group6.fintechapp.core.network.PaginatedResponse
import com.group6.fintechapp.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface FundApi {
    
    @GET("api/v1/funds")
    suspend fun getFunds(): Response<List<Fund>>
    
    @GET("api/v1/funds/{id}")
    suspend fun getFund(@Path("id") fundId: String): Response<Fund>
    
    @POST("api/v1/funds")
    suspend fun createFund(@Body request: CreateFundRequest): Response<Fund>
    
    @PUT("api/v1/funds/{id}")
    suspend fun updateFund(
        @Path("id") fundId: String,
        @Body request: CreateFundRequest
    ): Response<Fund>
    
    @DELETE("api/v1/funds/{id}")
    suspend fun deleteFund(@Path("id") fundId: String): Response<Unit>
    
    @POST("api/v1/funds/{id}/contribute")
    suspend fun contribute(
        @Path("id") fundId: String,
        @Body request: ContributionRequest
    ): Response<FundContribution>
    
    @POST("api/v1/funds/{id}/withdraw")
    suspend fun withdraw(
        @Path("id") fundId: String,
        @Body request: WithdrawRequest
    ): Response<FundContribution>
    
    @GET("api/v1/funds/{id}/contributions")
    suspend fun getContributions(
        @Path("id") fundId: String,
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 20
    ): Response<PaginatedResponse<FundContribution>>
    
    @POST("api/v1/funds/{id}/invite")
    suspend fun inviteMember(
        @Path("id") fundId: String,
        @Body request: InviteMemberRequest
    ): Response<FundMember>
    
    @DELETE("api/v1/funds/{id}/members/{userId}")
    suspend fun removeMember(
        @Path("id") fundId: String,
        @Path("userId") userId: String
    ): Response<Unit>
    
    @PUT("api/v1/funds/{id}/members/{userId}/role")
    suspend fun updateMemberRole(
        @Path("id") fundId: String,
        @Path("userId") userId: String,
        @Body role: FundMemberRole
    ): Response<FundMember>
    
    @POST("api/v1/funds/{id}/leave")
    suspend fun leaveFund(@Path("id") fundId: String): Response<Unit>
}
