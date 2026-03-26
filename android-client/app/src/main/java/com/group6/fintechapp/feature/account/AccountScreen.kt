package com.group6.fintechapp.feature.account

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.group6.fintechapp.data.model.AccountStatus
import com.group6.fintechapp.data.model.AccountType
import com.group6.fintechapp.data.model.BankAccount
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AccountScreen() {
    var isLoading by remember { mutableStateOf(false) }
    
    // Mock data for demonstration
    val accounts = remember {
        listOf(
            BankAccount(
                id = "1",
                userId = "user1",
                bankCode = "VCB",
                bankName = "Vietcombank",
                accountNumber = "****1234",
                accountName = "Nguyen Van A",
                balance = 15000000.0,
                currency = "VND",
                type = AccountType.CHECKING,
                status = AccountStatus.ACTIVE,
                lastSyncedAt = "2024-01-15T10:30:00Z",
                createdAt = "2023-06-01T00:00:00Z"
            ),
            BankAccount(
                id = "2",
                userId = "user1",
                bankCode = "TCB",
                bankName = "Techcombank",
                accountNumber = "****5678",
                accountName = "Nguyen Van A",
                balance = 8500000.0,
                currency = "VND",
                type = AccountType.SAVINGS,
                status = AccountStatus.ACTIVE,
                lastSyncedAt = "2024-01-15T09:00:00Z",
                createdAt = "2023-08-15T00:00:00Z"
            )
        )
    }

    val totalBalance = accounts.sumOf { it.balance }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Accounts") },
                actions = {
                    IconButton(onClick = { /* Sync all */ }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Sync")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { /* Add account */ }) {
                Icon(Icons.Default.Add, contentDescription = "Connect Bank")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Total Balance Card
            TotalBalanceCard(
                totalBalance = totalBalance,
                accountCount = accounts.size,
                modifier = Modifier.padding(16.dp)
            )

            if (isLoading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(accounts) { account ->
                        AccountItem(account = account)
                    }
                }
            }
        }
    }
}

@Composable
fun TotalBalanceCard(
    totalBalance: Double,
    accountCount: Int,
    modifier: Modifier = Modifier
) {
    val currencyFormat = remember { NumberFormat.getCurrencyInstance(Locale("vi", "VN")) }

    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primary
        )
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Total Balance",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = currencyFormat.format(totalBalance),
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimary
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "$accountCount connected accounts",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.7f)
            )
        }
    }
}

@Composable
fun AccountItem(account: BankAccount) {
    val currencyFormat = remember { NumberFormat.getCurrencyInstance(Locale("vi", "VN")) }
    val statusColor = when (account.status) {
        AccountStatus.ACTIVE -> Color(0xFF43A047)
        AccountStatus.PENDING -> Color(0xFFFFA000)
        AccountStatus.DISCONNECTED -> Color(0xFF9E9E9E)
        AccountStatus.ERROR -> Color(0xFFE53935)
    }

    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.AccountBalance,
                contentDescription = null,
                modifier = Modifier.size(48.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(start = 12.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = account.bankName,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Surface(
                        color = statusColor.copy(alpha = 0.1f),
                        shape = MaterialTheme.shapes.small
                    ) {
                        Text(
                            text = account.status.name.lowercase().replaceFirstChar { it.uppercase() },
                            style = MaterialTheme.typography.labelSmall,
                            color = statusColor,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
                Text(
                    text = "${account.type.name.lowercase().replaceFirstChar { it.uppercase() }} • ${account.accountNumber}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = currencyFormat.format(account.balance),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                account.lastSyncedAt?.let {
                    Text(
                        text = "Synced today",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}
