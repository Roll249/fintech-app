package com.group6.fintechapp.feature.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onNavigateToAccounts: () -> Unit = {}
) {
    val currencyFormat = remember { NumberFormat.getCurrencyInstance(Locale("vi", "VN")) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Column {
                        Text("Good morning,", style = MaterialTheme.typography.bodySmall)
                        Text("Nguyen Van A", style = MaterialTheme.typography.titleMedium)
                    }
                },
                actions = {
                    IconButton(onClick = { /* Notifications */ }) {
                        Badge(
                            content = { Text("3") }
                        ) {
                            Icon(Icons.Default.Notifications, contentDescription = "Notifications")
                        }
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Total Balance Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp)
                    ) {
                        Text(
                            text = "Total Balance",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f)
                        )
                        Text(
                            text = currencyFormat.format(23500000),
                            style = MaterialTheme.typography.headlineLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            QuickActionButton(
                                icon = Icons.Default.AccountBalance,
                                label = "Accounts",
                                onClick = onNavigateToAccounts,
                                modifier = Modifier.weight(1f)
                            )
                            QuickActionButton(
                                icon = Icons.Default.Add,
                                label = "Add",
                                onClick = { },
                                modifier = Modifier.weight(1f)
                            )
                            QuickActionButton(
                                icon = Icons.Default.QrCodeScanner,
                                label = "Scan Bill",
                                onClick = { },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }

            // Monthly Summary
            item {
                Card(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Text(
                            text = "This Month",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            StatItem(
                                label = "Income",
                                value = currencyFormat.format(15000000),
                                color = Color(0xFF43A047)
                            )
                            StatItem(
                                label = "Expense",
                                value = currencyFormat.format(8500000),
                                color = Color(0xFFE53935)
                            )
                            StatItem(
                                label = "Savings",
                                value = currencyFormat.format(6500000),
                                color = Color(0xFF1E88E5)
                            )
                        }
                    }
                }
            }

            // Budget Alerts
            item {
                Text(
                    text = "Budget Alerts",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            item {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(listOf(
                        Triple("Food & Dining", 0.85, "₫850,000 / ₫1,000,000"),
                        Triple("Entertainment", 0.60, "₫600,000 / ₫1,000,000"),
                        Triple("Shopping", 0.45, "₫450,000 / ₫1,000,000")
                    )) { (category, progress, amount) ->
                        BudgetAlertCard(
                            category = category,
                            progress = progress,
                            amount = amount
                        )
                    }
                }
            }

            // Recent Transactions
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Recent Transactions",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    TextButton(onClick = { }) {
                        Text("See all")
                    }
                }
            }

            items(listOf(
                Triple("Coffee Shop", "-₫45,000", "Today"),
                Triple("Salary", "+₫15,000,000", "Yesterday"),
                Triple("Grab Food", "-₫85,000", "Yesterday"),
                Triple("Electric Bill", "-₫350,000", "Mar 20")
            )) { (title, amount, date) ->
                RecentTransactionItem(
                    title = title,
                    amount = amount,
                    date = date
                )
            }
        }
    }
}

@Composable
fun QuickActionButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        onClick = onClick,
        modifier = modifier,
        shape = MaterialTheme.shapes.medium,
        color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.15f)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = MaterialTheme.colorScheme.onPrimary
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onPrimary
            )
        }
    }
}

@Composable
fun StatItem(
    label: String,
    value: String,
    color: Color
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.Bold,
            color = color
        )
    }
}

@Composable
fun BudgetAlertCard(
    category: String,
    progress: Double,
    amount: String
) {
    val progressColor = when {
        progress >= 0.8 -> Color(0xFFE53935)
        progress >= 0.5 -> Color(0xFFFFA000)
        else -> Color(0xFF43A047)
    }

    Card(
        modifier = Modifier.width(180.dp)
    ) {
        Column(
            modifier = Modifier.padding(12.dp)
        ) {
            Text(
                text = category,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium
            )
            Spacer(modifier = Modifier.height(8.dp))
            LinearProgressIndicator(
                progress = { progress.toFloat() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp),
                color = progressColor,
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = amount,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun RecentTransactionItem(
    title: String,
    amount: String,
    date: String
) {
    val isExpense = amount.startsWith("-")

    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyLarge
                )
                Text(
                    text = date,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Text(
                text = amount,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Bold,
                color = if (isExpense) Color(0xFFE53935) else Color(0xFF43A047)
            )
        }
    }
}
