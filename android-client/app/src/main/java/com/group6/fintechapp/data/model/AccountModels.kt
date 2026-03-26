package com.group6.fintechapp.data.model

import com.google.gson.annotations.SerializedName

// ============== Account Service Models ==============

data class BankAccount(
    val id: String,
    val userId: String,
    val bankCode: String,
    val bankName: String,
    val accountNumber: String,
    val accountName: String,
    val balance: Double,
    val currency: String = "VND",
    val type: AccountType,
    val status: AccountStatus,
    val lastSyncedAt: String? = null,
    val createdAt: String
)

enum class AccountType {
    @SerializedName("checking") CHECKING,
    @SerializedName("savings") SAVINGS,
    @SerializedName("credit") CREDIT,
    @SerializedName("investment") INVESTMENT
}

enum class AccountStatus {
    @SerializedName("active") ACTIVE,
    @SerializedName("disconnected") DISCONNECTED,
    @SerializedName("pending") PENDING,
    @SerializedName("error") ERROR
}

data class ConnectAccountRequest(
    val bankCode: String,
    val accountNumber: String,
    val credentials: Map<String, String>
)

data class AccountSummary(
    val totalBalance: Double,
    val totalAccounts: Int,
    val accountsByType: Map<AccountType, Double>
)

data class Bank(
    val code: String,
    val name: String,
    val logoUrl: String,
    val supported: Boolean
)
