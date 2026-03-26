package com.group6.fintechapp.feature.fund

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.group6.fintechapp.data.model.*
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FundScreen() {
    var showCreateDialog by remember { mutableStateOf(false) }

    // Mock data
    val funds = remember {
        listOf(
            Fund(
                id = "1",
                name = "Vacation Trip 2024",
                description = "Summer trip to Da Nang",
                targetAmount = 20000000.0,
                currentAmount = 12500000.0,
                progress = 0.625,
                coverImageUrl = null,
                ownerId = "user1",
                owner = User("user1", "test@email.com", "Nguyen Van A", createdAt = "2023-01-01"),
                members = listOf(
                    FundMember("user1", User("user1", "test@email.com", "Nguyen Van A", createdAt = "2023-01-01"), FundMemberRole.OWNER, 7500000.0, "2023-01-01"),
                    FundMember("user2", User("user2", "friend@email.com", "Tran Van B", createdAt = "2023-01-01"), FundMemberRole.MEMBER, 5000000.0, "2023-01-15")
                ),
                status = FundStatus.ACTIVE,
                deadline = "2024-06-01",
                createdAt = "2023-12-01"
            ),
            Fund(
                id = "2",
                name = "Emergency Fund",
                description = "For unexpected expenses",
                targetAmount = 50000000.0,
                currentAmount = 35000000.0,
                progress = 0.7,
                coverImageUrl = null,
                ownerId = "user1",
                owner = User("user1", "test@email.com", "Nguyen Van A", createdAt = "2023-01-01"),
                members = listOf(
                    FundMember("user1", User("user1", "test@email.com", "Nguyen Van A", createdAt = "2023-01-01"), FundMemberRole.OWNER, 35000000.0, "2023-01-01")
                ),
                status = FundStatus.ACTIVE,
                deadline = null,
                createdAt = "2023-01-01"
            )
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Group Funds") }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showCreateDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "Create Fund")
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(funds) { fund ->
                FundItem(fund = fund)
            }
        }
    }

    if (showCreateDialog) {
        CreateFundDialog(
            onDismiss = { showCreateDialog = false },
            onConfirm = { /* Create fund */ showCreateDialog = false }
        )
    }
}

@Composable
fun FundItem(fund: Fund) {
    val currencyFormat = remember { NumberFormat.getCurrencyInstance(Locale("vi", "VN")) }
    val progressColor = when {
        fund.progress >= 1.0 -> Color(0xFF43A047)
        fund.progress >= 0.5 -> Color(0xFF1E88E5)
        else -> Color(0xFFFFA000)
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
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = fund.name,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    fund.description?.let {
                        Text(
                            text = it,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Surface(
                    color = when (fund.status) {
                        FundStatus.ACTIVE -> Color(0xFF43A047)
                        FundStatus.COMPLETED -> Color(0xFF1E88E5)
                        FundStatus.CLOSED -> Color(0xFF9E9E9E)
                    }.copy(alpha = 0.1f),
                    shape = MaterialTheme.shapes.small
                ) {
                    Text(
                        text = fund.status.name,
                        style = MaterialTheme.typography.labelMedium,
                        color = when (fund.status) {
                            FundStatus.ACTIVE -> Color(0xFF43A047)
                            FundStatus.COMPLETED -> Color(0xFF1E88E5)
                            FundStatus.CLOSED -> Color(0xFF9E9E9E)
                        },
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Progress
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = currencyFormat.format(fund.currentAmount),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "of ${currencyFormat.format(fund.targetAmount)}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                LinearProgressIndicator(
                    progress = { fund.progress.toFloat().coerceIn(0f, 1f) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp),
                    color = progressColor,
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${(fund.progress * 100).toInt()}% completed",
                    style = MaterialTheme.typography.bodySmall,
                    color = progressColor
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Members
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (fund.members.size == 1) {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.Group,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "${fund.members.size} member${if (fund.members.size > 1) "s" else ""}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                fund.deadline?.let {
                    Spacer(modifier = Modifier.weight(1f))
                    Text(
                        text = "Due: $it",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Actions
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = { /* View details */ },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Details")
                }
                Button(
                    onClick = { /* Contribute */ },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Contribute")
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateFundDialog(
    onDismiss: () -> Unit,
    onConfirm: (CreateFundRequest) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var targetAmount by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create Fund") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Fund Name") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description (optional)") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = targetAmount,
                    onValueChange = { targetAmount = it.filter { c -> c.isDigit() } },
                    label = { Text("Target Amount") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val amount = targetAmount.toDoubleOrNull() ?: 0.0
                    if (name.isNotBlank() && amount > 0) {
                        onConfirm(
                            CreateFundRequest(
                                name = name,
                                description = description.takeIf { it.isNotBlank() },
                                targetAmount = amount
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
