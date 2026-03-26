package com.group6.fintechapp.feature.profile

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.automirrored.filled.Help
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onLogout: () -> Unit = {}
) {
    var showLogoutDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Profile") }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
        ) {
            // Profile Header
            ProfileHeader(
                name = "Nguyen Van A",
                email = "nguyenvana@email.com",
                modifier = Modifier.padding(16.dp)
            )

            HorizontalDivider()

            // Account Section
            ProfileSection(title = "Account") {
                ProfileMenuItem(
                    icon = Icons.Default.Person,
                    title = "Edit Profile",
                    onClick = { /* Navigate to edit profile */ }
                )
                ProfileMenuItem(
                    icon = Icons.Default.Lock,
                    title = "Change Password",
                    onClick = { /* Navigate to change password */ }
                )
                ProfileMenuItem(
                    icon = Icons.Default.Notifications,
                    title = "Notification Settings",
                    onClick = { /* Navigate to notification settings */ }
                )
            }

            HorizontalDivider()

            // Preferences Section
            ProfileSection(title = "Preferences") {
                ProfileMenuItem(
                    icon = Icons.Default.Palette,
                    title = "Appearance",
                    subtitle = "Dark mode, themes",
                    onClick = { /* Navigate to appearance settings */ }
                )
                ProfileMenuItem(
                    icon = Icons.Default.Language,
                    title = "Language",
                    subtitle = "Vietnamese",
                    onClick = { /* Navigate to language settings */ }
                )
                ProfileMenuItem(
                    icon = Icons.Default.AttachMoney,
                    title = "Currency",
                    subtitle = "VND",
                    onClick = { /* Navigate to currency settings */ }
                )
            }

            HorizontalDivider()

            // Security Section
            ProfileSection(title = "Security") {
                ProfileMenuItem(
                    icon = Icons.Default.Fingerprint,
                    title = "Biometric Login",
                    onClick = { /* Toggle biometric */ }
                )
                ProfileMenuItem(
                    icon = Icons.Default.Security,
                    title = "Two-Factor Authentication",
                    onClick = { /* Navigate to 2FA settings */ }
                )
            }

            HorizontalDivider()

            // Support Section
            ProfileSection(title = "Support") {
                ProfileMenuItem(
                    icon = Icons.AutoMirrored.Filled.Help,
                    title = "Help Center",
                    onClick = { /* Navigate to help */ }
                )
                ProfileMenuItem(
                    icon = Icons.Default.Info,
                    title = "About",
                    subtitle = "Version 1.0.0",
                    onClick = { /* Show about */ }
                )
                ProfileMenuItem(
                    icon = Icons.Default.Description,
                    title = "Terms & Privacy",
                    onClick = { /* Navigate to terms */ }
                )
            }

            HorizontalDivider()

            // Logout
            ProfileMenuItem(
                icon = Icons.AutoMirrored.Filled.ExitToApp,
                title = "Logout",
                titleColor = MaterialTheme.colorScheme.error,
                onClick = { showLogoutDialog = true }
            )

            Spacer(modifier = Modifier.height(32.dp))
        }
    }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text("Logout") },
            text = { Text("Are you sure you want to logout?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showLogoutDialog = false
                        onLogout()
                    }
                ) {
                    Text("Logout", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun ProfileHeader(
    name: String,
    email: String,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Surface(
            modifier = Modifier.size(72.dp),
            shape = MaterialTheme.shapes.extraLarge,
            color = MaterialTheme.colorScheme.primaryContainer
        ) {
            Box(contentAlignment = Alignment.Center) {
                Text(
                    text = name.firstOrNull()?.uppercase() ?: "?",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }
        
        Column(
            modifier = Modifier.padding(start = 16.dp)
        ) {
            Text(
                text = name,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = email,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun ProfileSection(
    title: String,
    content: @Composable ColumnScope.() -> Unit
) {
    Column {
        Text(
            text = title,
            style = MaterialTheme.typography.titleSmall,
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
        )
        content()
    }
}

@Composable
fun ProfileMenuItem(
    icon: ImageVector,
    title: String,
    subtitle: String? = null,
    titleColor: androidx.compose.ui.graphics.Color = MaterialTheme.colorScheme.onSurface,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = titleColor,
                modifier = Modifier.size(24.dp)
            )
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(start = 16.dp)
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyLarge,
                    color = titleColor
                )
                subtitle?.let {
                    Text(
                        text = it,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
