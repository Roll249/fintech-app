package com.group6.fintechapp.ui.budget

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.group6.fintechapp.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BudgetScreen(viewModel: BudgetViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    var showCreateDialog by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.loadBudgetSummary()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Ngân sách") },
                actions = {
                    IconButton(onClick = { viewModel.loadBudgets() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Làm mới")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showCreateDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "Tạo ngân sách")
            }
        }
    ) { paddingValues ->
        if (uiState.isLoading && uiState.budgets.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Summary Card
                item {
                    uiState.summary?.let { summary ->
                        BudgetSummaryCard(summary)
                    }
                }

                item {
                    Text(
                        text = "Danh sách ngân sách",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                if (uiState.budgets.isEmpty()) {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant
                            )
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(32.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(
                                    Icons.Default.AccountBalanceWallet,
                                    contentDescription = null,
                                    modifier = Modifier.size(48.dp),
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    "Chưa có ngân sách nào",
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                TextButton(onClick = { showCreateDialog = true }) {
                                    Text("Tạo ngân sách đầu tiên")
                                }
                            }
                        }
                    }
                } else {
                    items(uiState.budgets) { budget ->
                        BudgetCard(
                            budget = budget,
                            onClick = { viewModel.loadBudgetDetail(budget.id) }
                        )
                    }
                }
            }
        }
    }

    if (showCreateDialog) {
        CreateBudgetDialog(
            onDismiss = { showCreateDialog = false },
            onCreate = { categoryId, amountLimit, period, threshold ->
                viewModel.createBudget(categoryId, amountLimit, period, threshold)
                showCreateDialog = false
            }
        )
    }
}

@Composable
fun BudgetSummaryCard(summary: com.group6.fintechapp.ui.budget.BudgetSummary) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Tổng quan tháng này",
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Đã chi",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                    )
                    Text(
                        text = formatCurrency(summary.totalSpent),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "Hạn mức",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                    )
                    Text(
                        text = formatCurrency(summary.totalLimit),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            LinearProgressIndicator(
                progress = { (summary.totalSpent.toFloat() / summary.totalLimit.coerceAtLeast(1)).coerceIn(0f, 1f) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp)),
            )
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "${((summary.totalSpent.toFloat() / summary.totalLimit.coerceAtLeast(1)) * 100).toInt()}% sử dụng",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                Text(
                    text = "Còn lại: ${formatCurrency(summary.remaining)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = if (summary.remaining >= 0) MaterialTheme.colorScheme.onPrimaryContainer
                    else MaterialTheme.colorScheme.error
                )
            }
            if (summary.budgetsExceeded > 0) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Warning,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = MaterialTheme.colorScheme.error
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "${summary.budgetsExceeded} ngân sách đã vượt!",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}

@Composable
fun BudgetCard(budget: com.group6.fintechapp.ui.budget.Budget, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        onClick = onClick
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(
                            try {
                                Color(android.graphics.Color.parseColor(budget.categoryColor ?: "#4CAF50"))
                            } catch (e: Exception) {
                                MaterialTheme.colorScheme.primary
                            }
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.Category,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = budget.categoryName ?: "Danh mục",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = when (budget.period) {
                            "daily" -> "Hàng ngày"
                            "weekly" -> "Hàng tuần"
                            "monthly" -> "Hàng tháng"
                            "yearly" -> "Hàng năm"
                            else -> budget.period
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                if (budget.shouldAlert) {
                    Icon(
                        Icons.Default.Warning,
                        contentDescription = null,
                        tint = if (budget.isOverBudget) MaterialTheme.colorScheme.error else Color(0xFFFF9800),
                        modifier = Modifier.size(24.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                Column {
                    Text(
                        text = "Đã chi",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = formatCurrency(budget.spent),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = if (budget.isOverBudget) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "Hạn mức",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = formatCurrency(budget.amountLimit),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            LinearProgressIndicator(
                progress = { (budget.percentage / 100f).coerceIn(0f, 1f) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .clip(RoundedCornerShape(3.dp)),
                color = when {
                    budget.percentage >= 100 -> MaterialTheme.colorScheme.error
                    budget.percentage >= 80 -> Color(0xFFFF9800)
                    else -> MaterialTheme.colorScheme.primary
                },
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "${budget.percentage.toInt()}% • Còn lại: ${formatCurrency(budget.remaining)}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateBudgetDialog(
    onDismiss: () -> Unit,
    onCreate: (String, Long, String, Int) -> Unit
) {
    var selectedCategory by remember { mutableStateOf("") }
    var amountLimit by remember { mutableStateOf("") }
    var period by remember { mutableStateOf("monthly") }
    var alertThreshold by remember { mutableStateOf(80f) }

    // Mock categories
    val categories = listOf(
        "food" to "Ăn uống" to "#FF5722",
        "transport" to "Di chuyển" to "#2196F3",
        "shopping" to "Mua sắm" to "#E91E63",
        "entertainment" to "Giải trí" to "#9C27B0",
        "bills" to "Hóa đơn" to "#607D8B",
        "health" to "Sức khỏe" to "#4CAF50",
        "education" to "Giáo dục" to "#3F51B5",
        "other" to "Khác" to "#9E9E9E"
    )

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Tạo ngân sách mới") },
        text = {
            Column {
                Text("Danh mục", style = MaterialTheme.typography.labelMedium)
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    categories.take(4).forEach { (id, name) ->
                        FilterChip(
                            selected = selectedCategory == id,
                            onClick = { selectedCategory = id },
                            label = { Text(name, style = MaterialTheme.typography.labelSmall) }
                        )
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    categories.drop(4).forEach { (id, name) ->
                        FilterChip(
                            selected = selectedCategory == id,
                            onClick = { selectedCategory = id },
                            label = { Text(name, style = MaterialTheme.typography.labelSmall) }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = amountLimit,
                    onValueChange = { amountLimit = it.filter { c -> c.isDigit() } },
                    label = { Text("Hạn mức (VND)") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text("Kỳ hạn", style = MaterialTheme.typography.labelMedium)
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("daily" to "Ngày", "weekly" to "Tuần", "monthly" to "Tháng").forEach { (value, label) ->
                        FilterChip(
                            selected = period == value,
                            onClick = { period = value },
                            label = { Text(label) }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text("Cảnh báo khi: ${alertThreshold.toInt()}%", style = MaterialTheme.typography.labelMedium)
                Slider(
                    value = alertThreshold,
                    onValueChange = { alertThreshold = it },
                    valueRange = 50f..100f,
                    steps = 9
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    amountLimit.toLongOrNull()?.let { amt ->
                        if (selectedCategory.isNotBlank()) {
                            onCreate(selectedCategory, amt, period, alertThreshold.toInt())
                        }
                    }
                },
                enabled = selectedCategory.isNotBlank() && (amountLimit.toLongOrNull() ?: 0) > 0
            ) {
                Text("Tạo")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Hủy")
            }
        }
    )
}
