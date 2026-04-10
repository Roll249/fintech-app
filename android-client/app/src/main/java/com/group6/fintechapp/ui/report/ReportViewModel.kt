package com.group6.fintechapp.ui.report

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.group6.fintechapp.data.api.ReportApi
import com.group6.fintechapp.data.model.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ReportUiState(
    val isLoading: Boolean = true,
    val summary: ReportSummary? = null,
    val categoryBreakdown: List<CategoryBreakdown> = emptyList(),
    val monthlyReport: MonthlyReport? = null,
    val trends: TrendsReport? = null,
    val error: String? = null,
    val selectedPeriod: String = "month"
)

@HiltViewModel
class ReportViewModel @Inject constructor(
    private val reportApi: ReportApi
) : ViewModel() {

    private val _uiState = MutableStateFlow(ReportUiState())
    val uiState: StateFlow<ReportUiState> = _uiState.asStateFlow()

    init {
        loadSummary()
    }

    fun loadSummary(period: String = "month") {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null, selectedPeriod = period) }
            try {
                val response = reportApi.getSummary(period)
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.update { it.copy(
                        isLoading = false,
                        summary = response.body()!!.data
                    ) }
                } else {
                    _uiState.update { it.copy(
                        isLoading = false,
                        error = response.body()?.error ?: "Không thể tải báo cáo"
                    ) }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(
                    isLoading = false,
                    error = "Lỗi: ${e.message}"
                ) }
            }
        }
    }

    fun loadCategoryBreakdown(period: String = "month", limit: Int = 10) {
        viewModelScope.launch {
            try {
                val response = reportApi.getCategoryBreakdown(period, limit)
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.update { it.copy(
                        categoryBreakdown = response.body()!!.data ?: emptyList()
                    ) }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Lỗi: ${e.message}") }
            }
        }
    }

    fun loadMonthlyReport(months: Int = 6) {
        viewModelScope.launch {
            try {
                val response = reportApi.getMonthlyReport(months)
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.update { it.copy(
                        monthlyReport = response.body()!!.data
                    ) }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Lỗi: ${e.message}") }
            }
        }
    }

    fun loadTrends() {
        viewModelScope.launch {
            try {
                val response = reportApi.getTrends()
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.update { it.copy(
                        trends = response.body()!!.data
                    ) }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Lỗi: ${e.message}") }
            }
        }
    }

    fun refresh() {
        loadSummary(_uiState.value.selectedPeriod)
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}