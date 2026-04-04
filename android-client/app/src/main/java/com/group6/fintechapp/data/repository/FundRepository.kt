package com.group6.fintechapp.data.repository

import com.group6.fintechapp.core.network.ApiClient
import com.group6.fintechapp.core.network.ApiResponse
import com.group6.fintechapp.core.network.PaginatedResponse
import com.group6.fintechapp.data.api.FundApi
import com.group6.fintechapp.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class FundRepository {
    private val api: FundApi = ApiClient.createService()

    suspend fun getFunds(): ApiResponse<List<Fund>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getFunds()
            if (response.isSuccessful && response.body() != null) {
                ApiResponse.Success(response.body()!!)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun getFund(fundId: String): ApiResponse<Fund> = withContext(Dispatchers.IO) {
        try {
            val response = api.getFund(fundId)
            if (response.isSuccessful && response.body() != null) {
                ApiResponse.Success(response.body()!!)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun createFund(request: CreateFundRequest): ApiResponse<Fund> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.createFund(request)
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun updateFund(fundId: String, request: CreateFundRequest): ApiResponse<Fund> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.updateFund(fundId, request)
                if (response.isSuccessful && response.body() != null) {
                    ApiResponse.Success(response.body()!!)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun deleteFund(fundId: String): ApiResponse<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = api.deleteFund(fundId)
            if (response.isSuccessful) {
                ApiResponse.Success(Unit)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun contribute(
        fundId: String,
        request: ContributionRequest
    ): ApiResponse<FundContribution> = withContext(Dispatchers.IO) {
        try {
            val response = api.contribute(fundId, request)
            if (response.isSuccessful && response.body() != null) {
                ApiResponse.Success(response.body()!!)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun withdraw(
        fundId: String,
        request: WithdrawRequest
    ): ApiResponse<FundContribution> = withContext(Dispatchers.IO) {
        try {
            val response = api.withdraw(fundId, request)
            if (response.isSuccessful && response.body() != null) {
                ApiResponse.Success(response.body()!!)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun getContributions(
        fundId: String,
        page: Int = 1,
        pageSize: Int = 20
    ): ApiResponse<PaginatedResponse<FundContribution>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getContributions(fundId, page, pageSize)
            if (response.isSuccessful && response.body() != null) {
                ApiResponse.Success(response.body()!!)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun inviteMember(
        fundId: String,
        request: InviteMemberRequest
    ): ApiResponse<FundMember> = withContext(Dispatchers.IO) {
        try {
            val response = api.inviteMember(fundId, request)
            if (response.isSuccessful && response.body() != null) {
                ApiResponse.Success(response.body()!!)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun removeMember(fundId: String, userId: String): ApiResponse<Unit> = 
        withContext(Dispatchers.IO) {
            try {
                val response = api.removeMember(fundId, userId)
                if (response.isSuccessful) {
                    ApiResponse.Success(Unit)
                } else {
                    ApiResponse.Error(response.code(), response.message())
                }
            } catch (e: Exception) {
                ApiResponse.Exception(e)
            }
        }

    suspend fun changeRole(
        fundId: String,
        userId: String,
        role: FundMemberRole
    ): ApiResponse<FundMember> = withContext(Dispatchers.IO) {
        try {
            val response = api.updateMemberRole(fundId, userId, role)
            if (response.isSuccessful && response.body() != null) {
                ApiResponse.Success(response.body()!!)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun leaveFund(fundId: String): ApiResponse<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = api.leaveFund(fundId)
            if (response.isSuccessful) {
                ApiResponse.Success(Unit)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }

    suspend fun exportFund(fundId: String): ApiResponse<Fund> = withContext(Dispatchers.IO) {
        try {
            val response = api.getFund(fundId)
            if (response.isSuccessful && response.body() != null) {
                ApiResponse.Success(response.body()!!)
            } else {
                ApiResponse.Error(response.code(), response.message())
            }
        } catch (e: Exception) {
            ApiResponse.Exception(e)
        }
    }
}
