package com.group6.fintechapp.data.api

import com.group6.fintechapp.core.network.PaginatedResponse
import com.group6.fintechapp.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface NotificationApi {
    
    @GET("api/v1/notifications")
    suspend fun getNotifications(
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 20,
        @Query("unreadOnly") unreadOnly: Boolean = false
    ): Response<PaginatedResponse<Notification>>
    
    @GET("api/v1/notifications/{id}")
    suspend fun getNotification(@Path("id") notificationId: String): Response<Notification>
    
    @PUT("api/v1/notifications/{id}/read")
    suspend fun markAsRead(@Path("id") notificationId: String): Response<Notification>
    
    @PUT("api/v1/notifications/read-all")
    suspend fun markAllAsRead(): Response<Unit>
    
    @DELETE("api/v1/notifications/{id}")
    suspend fun deleteNotification(@Path("id") notificationId: String): Response<Unit>
    
    @DELETE("api/v1/notifications")
    suspend fun clearAllNotifications(): Response<Unit>
    
    @GET("api/v1/notifications/summary")
    suspend fun getNotificationSummary(): Response<NotificationSummary>
    
    @GET("api/v1/notifications/preferences")
    suspend fun getPreferences(): Response<NotificationPreferences>
    
    @PUT("api/v1/notifications/preferences")
    suspend fun updatePreferences(
        @Body request: UpdatePreferencesRequest
    ): Response<NotificationPreferences>
    
    @POST("api/v1/notifications/devices")
    suspend fun registerDevice(@Body request: RegisterDeviceRequest): Response<Unit>
    
    @DELETE("api/v1/notifications/devices/{token}")
    suspend fun unregisterDevice(@Path("token") fcmToken: String): Response<Unit>
}
