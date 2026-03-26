package com.group6.fintechapp.data.model

import com.google.gson.annotations.SerializedName

// ============== Fund Service Models ==============

data class Fund(
    val id: String,
    val name: String,
    val description: String? = null,
    val targetAmount: Double,
    val currentAmount: Double,
    val progress: Double,
    val coverImageUrl: String? = null,
    val ownerId: String,
    val owner: User,
    val members: List<FundMember>,
    val status: FundStatus,
    val deadline: String? = null,
    val createdAt: String
)

enum class FundStatus {
    @SerializedName("active") ACTIVE,
    @SerializedName("completed") COMPLETED,
    @SerializedName("closed") CLOSED
}

data class FundMember(
    val userId: String,
    val user: User,
    val role: FundMemberRole,
    val contribution: Double,
    val joinedAt: String
)

enum class FundMemberRole {
    @SerializedName("owner") OWNER,
    @SerializedName("admin") ADMIN,
    @SerializedName("member") MEMBER
}

data class CreateFundRequest(
    val name: String,
    val description: String? = null,
    val targetAmount: Double,
    val coverImageUrl: String? = null,
    val deadline: String? = null
)

data class ContributionRequest(
    val amount: Double,
    val note: String? = null
)

data class WithdrawRequest(
    val amount: Double,
    val reason: String
)

data class FundContribution(
    val id: String,
    val fundId: String,
    val userId: String,
    val user: User,
    val amount: Double,
    val type: ContributionType,
    val note: String? = null,
    val createdAt: String
)

enum class ContributionType {
    @SerializedName("deposit") DEPOSIT,
    @SerializedName("withdraw") WITHDRAW
}

data class InviteMemberRequest(
    val email: String,
    val role: FundMemberRole = FundMemberRole.MEMBER
)
