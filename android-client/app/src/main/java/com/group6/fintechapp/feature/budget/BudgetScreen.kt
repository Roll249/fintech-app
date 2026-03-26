package com.group6.fintechapp.feature.budget

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.group6.fintechapp.data.model.Budget
import com.group6.fintechapp.data.model.BudgetPeriod
import com.group6.fintechapp.data.model.CreateBudgetRequest
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BudgetScreen(
    viewModel: BudgetViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showAddDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Budgets") }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showAddDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "Add Budget")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Summary Card
            uiState.summary?.let { summary ->
                BudgetSummaryCard(
                    totalBudget = summary.totalBudget,
                    totalSpent = summary.totalSpent,
                    healthScore = summary.healthScore,
                    modifier = Modifier.padding(16.dp)
                )
            }

            when {
                uiState.isLoading -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
                uiState.error != null -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = uiState.error ?: "Unknown error",
                                color = MaterialTheme.colorScheme.error
                            )
                            Button(
                                onClick = { viewModel.loadBudgets() },
                                modifier = Modifier.padding(top = 8.dp)
                            ) {
                                Text("Retry")
                            }
                        }
                    }
                }
                uiState.budgets.isEmpty() -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No budgets set",
                            style = MaterialTheme.typography.bodyLarge
                        )
                    }
                }
                else -> {
                    LazyColumn(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(uiState.budgets) { budget ->
                            BudgetItem(budget = budget)
                        }
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        AddBudgetDialog(
            onDismiss = { showAddDialog = false },
            onConfirm = { request ->
                viewModel.createBudget(request)
                showAddDialog = false
            }
        )
    }
}

@Composable
fun BudgetSummaryCard(
    totalBudget: Double,
    totalSpent: Double,
    healthScore: Int,
    modifier: Modifier = Modifier
) {
    val currencyFormat = remember { NumberFormat.getCurrencyInstance(Locale("vi", "VN")) }
    val progress = if (totalBudget > 0) (totalSpent / totalBudget).coerceIn(0.0, 1.0) else 0.0
    val progressColor = when {
        progress < 0.5 -> Color(0xFF43A047)
        progress < 0.8 -> Color(0xFFFFA000)
        else -> Color(0xFFE53935)
    }

    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Monthly Overview",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(12.dp))
            
            LinearProgressIndicator(
                progress = { progress.toFloat() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp),
                color = progressColor,
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Spent",
                        style = MaterialTheme.typography.bodySmall
                    )
                    Text(
                        text = currencyFormat.format(totalSpent),
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.Bold
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "Budget",
                        style = MaterialTheme.typography.bodySmall
                    )
                    Text(
                        text = currencyFormat.format(totalBudget),
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Health Score: $healthScore/100",
                style = MaterialTheme.typography.bodyMedium,
                color = if (healthScore >= 70) Color(0xFF43A047) else Color(0xFFE53935)
            )
        }
    }
}

@Composable
fun BudgetItem(budget: Budget) {
    val currencyFormat = remember { NumberFormat.getCurrencyInstance(Locale("vi", "VN")) }
    val progress = if (budget.limit > 0) (budget.spent / budget.limit).coerceIn(0.0, 1.0) else 0.0
    val progressColor = when {
        progress < 0.5 -> Color(0xFF43A047)
        progress < 0.8 -> Color(0xFFFFA000)
        else -> Color(0xFFE53935)
    }

    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = budget.category.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium
                )
                if (budget.isExceeded) {
                    Icon(
                        imageVector = Icons.Default.Warning,
                        contentDescription = "Exceeded",
                        tint = Color(0xFFE53935)
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            LinearProgressIndicator(
                progress = { progress.toFloat() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp),
                color = progressColor,
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "${currencyFormat.format(budget.spent)} / ${currencyFormat.format(budget.limit)}",
                    style = MaterialTheme.typography.bodyMedium
                )
                Text(
                    text = "${(progress * 100).toInt()}%",
                    style = MaterialTheme.typography.bodyMedium,
                    color = progressColor
                )
            }
            
            Text(
                text = "Remaining: ${currencyFormat.format(budget.remaining)}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddBudgetDialog(
    onDismiss: () -> Unit,
    onConfirm: (CreateBudgetRequest) -> Unit
) {
    var limit by remember { mutableStateOf("") }
    var selectedPeriod by remember { mutableStateOf(BudgetPeriod.MONTHLY) }
    var alertThreshold by remember { mutableStateOf("80") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create Budget") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = limit,
                    onValueChange = { limit = it.filter { c -> c.isDigit() || c == '.' } },
                    label = { Text("Budget Limit") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Text("Period", style = MaterialTheme.typography.bodyMedium)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = selectedPeriod == BudgetPeriod.WEEKLY,
                        onClick = { selectedPeriod = BudgetPeriod.WEEKLY },
                        label = { Text("Weekly") }
                    )
                    FilterChip(
                        selected = selectedPeriod == BudgetPeriod.MONTHLY,
                        onClick = { selectedPeriod = BudgetPeriod.MONTHLY },
                        label = { Text("Monthly") }
                    )
                }
                
                OutlinedTextField(
                    value = alertThreshold,
                    onValueChange = { alertThreshold = it.filter { c -> c.isDigit() } },
                    label = { Text("Alert at (%)") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val limitValue = limit.toDoubleOrNull() ?: 0.0
                    val threshold = alertThreshold.toIntOrNull() ?: 80
                    if (limitValue > 0) {
                        onConfirm(
                            CreateBudgetRequest(
                                categoryId = "default",
                                limit = limitValue,
                                period = selectedPeriod,
                                alertThreshold = threshold.coerceIn(1, 100)
                            )
                        )
                    }
                }
            ) {
                Text("Create")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
