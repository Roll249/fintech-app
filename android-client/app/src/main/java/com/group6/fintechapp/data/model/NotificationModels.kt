package com.group6.fintechapp.data.model

import com.google.gson.annotations.SerializedName

// ============== Notification Service Models ==============

data class Notification(
    val id: String,
    val userId: String,
    val type: NotificationType,
    val title: String,
    val body: String,
    val data: Map<String, Any>? = null,
    val isRead: Boolean,
    val createdAt: String
)

enum class NotificationType {
    @SerializedName("transaction") TRANSACTION,
    @SerializedName("budget_warning") BUDGET_WARNING,
    @SerializedName("budget_exceeded") BUDGET_EXCEEDED,
    @SerializedName("fund_contribution") FUND_CONTRIBUTION,
    @SerializedName("fund_invite") FUND_INVITE,
    @SerializedName("report_ready") REPORT_READY,
    @SerializedName("system") SYSTEM
}

data class NotificationPreferences(
    val userId: String,
    val pushEnabled: Boolean = true,
    val emailEnabled: Boolean = true,
    val transactionAlerts: Boolean = true,
    val budgetAlerts: Boolean = true,
    val fundUpdates: Boolean = true,
    val marketingEmails: Boolean = false,
    val quietHoursStart: String? = null,
    val quietHoursEnd: String? = null
)

data class UpdatePreferencesRequest(
    val pushEnabled: Boolean? = null,
    val emailEnabled: Boolean? = null,
    val transactionAlerts: Boolean? = null,
    val budgetAlerts: Boolean? = null,
    val fundUpdates: Boolean? = null,
    val marketingEmails: Boolean? = null,
    val quietHoursStart: String? = null,
    val quietHoursEnd: String? = null
)

data class RegisterDeviceRequest(
    val fcmToken: String,
    val deviceType: String = "android",
    val deviceName: String? = null
)

data class NotificationSummary(
    val unreadCount: Int,
    val recentNotifications: List<Notification>
)
