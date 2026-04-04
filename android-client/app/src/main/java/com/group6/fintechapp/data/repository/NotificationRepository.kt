package com.group6.fintechapp.data.repository

import com.group6.fintechapp.core.network.ApiClient
import com.group6.fintechapp.core.network.ApiResponse
import com.group6.fintechapp.core.network.PaginatedResponse
import com.group6.fintechapp.data.api.NotificationApi
import com.group6.fintechapp.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class NotificationRepository {
    private val api: NotificationApi = ApiClient.createService()

    suspend fun getNotifications(
        page: Int = 1,
        pageSize: Int = 20,
        unreadOnly: Boolean = false
    ): ApiResponse<PaginatedResponse<Notification>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getNotifications(page, pageSize, unreadOnly)
            if (response.isSuccessful && response.body() != null) {
                ApiResponse.Success(response.body()!!)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun getNotification(notificationId: String): ApiResponse<Notification> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.getNotification(notificationId)
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun markAsRead(notificationId: String): ApiResponse<Notification> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.markAsRead(notificationId)
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun markAllAsRead(): ApiResponse<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = api.markAllAsRead()
            if (response.isSuccessful) {
                ApiResponse.Success(Unit)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun deleteNotification(notificationId: String): ApiResponse<Unit> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.deleteNotification(notificationId)
                if (response.isSuccessful) {
                    ApiResponse.Success(Unit)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun clearAll(): ApiResponse<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = api.clearAllNotifications()
            if (response.isSuccessful) {
                ApiResponse.Success(Unit)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun getSummary(): ApiResponse<NotificationSummary> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.getNotificationSummary()
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun getPreferences(): ApiResponse<NotificationPreferences> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.getPreferences()
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun updatePreferences(request: UpdatePreferencesRequest): ApiResponse<NotificationPreferences> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.updatePreferences(request)
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun registerDevice(request: RegisterDeviceRequest): ApiResponse<Unit> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.registerDevice(request)
                if (response.isSuccessful) {
                    ApiResponse.Success(Unit)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun unregisterDevice(fcmToken: String): ApiResponse<Unit> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.unregisterDevice(fcmToken)
                if (response.isSuccessful) {
                    ApiResponse.Success(Unit)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }
}
