package com.group6.fintechapp.feature.profile

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
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
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.group6.fintechapp.core.settings.ThemeMode

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onLogout: () -> Unit = {},
    viewModel: ProfileViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val settings = uiState.settings
    
    // Dialog states
    var showLogoutDialog by remember { mutableStateOf(false) }
    var showEditDialog by remember { mutableStateOf(false) }
    var showAboutDialog by remember { mutableStateOf(false) }
    var showChangePasswordDialog by remember { mutableStateOf(false) }
    var showNotificationDialog by remember { mutableStateOf(false) }
    var showAppearanceDialog by remember { mutableStateOf(false) }
    var showLanguageDialog by remember { mutableStateOf(false) }
    var showCurrencyDialog by remember { mutableStateOf(false) }
    var showBiometricDialog by remember { mutableStateOf(false) }
    var show2FADialog by remember { mutableStateOf(false) }
    var showTermsDialog by remember { mutableStateOf(false) }
    var showHelpDialog by remember { mutableStateOf(false) }

    // Handle logout
    LaunchedEffect(uiState.isLoggedOut) {
        if (uiState.isLoggedOut) {
            onLogout()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Profile") }
            )
        }
    ) { padding ->
        if (uiState.isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .verticalScroll(rememberScrollState())
            ) {
                // Profile Header
                ProfileHeader(
                    name = uiState.user?.name ?: "Guest User",
                    email = uiState.user?.email ?: "No email",
                    modifier = Modifier.padding(16.dp)
                )

                HorizontalDivider()

                // Account Section
                ProfileSection(title = "Account") {
                    ProfileMenuItem(
                        icon = Icons.Default.Person,
                        title = "Edit Profile",
                        onClick = { showEditDialog = true }
                    )
                    ProfileMenuItem(
                        icon = Icons.Default.Lock,
                        title = "Change Password",
                        onClick = { showChangePasswordDialog = true }
                    )
                    ProfileMenuItem(
                        icon = Icons.Default.Notifications,
                        title = "Notification Settings",
                        onClick = { showNotificationDialog = true }
                    )
                }

                HorizontalDivider()

                // Preferences Section
                ProfileSection(title = "Preferences") {
                    ProfileMenuItem(
                        icon = Icons.Default.Palette,
                        title = "Appearance",
                        subtitle = when (settings.themeMode) {
                            ThemeMode.DARK -> "Dark mode"
                            ThemeMode.LIGHT -> "Light mode"
                            ThemeMode.SYSTEM -> "System default"
                        },
                        onClick = { showAppearanceDialog = true }
                    )
                    ProfileMenuItem(
                        icon = Icons.Default.Language,
                        title = "Language",
                        subtitle = settings.language,
                        onClick = { showLanguageDialog = true }
                    )
                    ProfileMenuItem(
                        icon = Icons.Default.AttachMoney,
                        title = "Currency",
                        subtitle = settings.currency,
                        onClick = { showCurrencyDialog = true }
                    )
                }

                HorizontalDivider()

                // Security Section
                ProfileSection(title = "Security") {
                    ProfileMenuItemWithSwitch(
                        icon = Icons.Default.Fingerprint,
                        title = "Biometric Login",
                        subtitle = if (settings.isBiometricEnabled) "Enabled" else "Disabled",
                        checked = settings.isBiometricEnabled,
                        onCheckedChange = { showBiometricDialog = true }
                    )
                    ProfileMenuItemWithSwitch(
                        icon = Icons.Default.Security,
                        title = "Two-Factor Authentication",
                        subtitle = if (settings.is2FAEnabled) "Enabled" else "Disabled",
                        checked = settings.is2FAEnabled,
                        onCheckedChange = { show2FADialog = true }
                    )
                }

                HorizontalDivider()

                // Support Section
                ProfileSection(title = "Support") {
                    ProfileMenuItem(
                        icon = Icons.AutoMirrored.Filled.Help,
                        title = "Help Center",
                        onClick = { showHelpDialog = true }
                    )
                    ProfileMenuItem(
                        icon = Icons.Default.Info,
                        title = "About",
                        subtitle = "Version 1.0.0",
                        onClick = { showAboutDialog = true }
                    )
                    ProfileMenuItem(
                        icon = Icons.Default.Description,
                        title = "Terms & Privacy",
                        onClick = { showTermsDialog = true }
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
    }
    
    // ==================== DIALOGS ====================
    
    // Change Password Dialog
    if (showChangePasswordDialog) {
        ChangePasswordDialog(
            onDismiss = { showChangePasswordDialog = false },
            onConfirm = { _, _ -> showChangePasswordDialog = false }
        )
    }
    
    // Notification Settings Dialog
    if (showNotificationDialog) {
        NotificationSettingsDialog(
            pushEnabled = settings.pushNotifications,
            emailEnabled = settings.emailNotifications,
            budgetAlerts = settings.budgetAlerts,
            transactionAlerts = settings.transactionAlerts,
            onPushChange = { viewModel.setPushNotifications(it) },
            onEmailChange = { viewModel.setEmailNotifications(it) },
            onBudgetAlertsChange = { viewModel.setBudgetAlerts(it) },
            onTransactionAlertsChange = { viewModel.setTransactionAlerts(it) },
            onDismiss = { showNotificationDialog = false }
        )
    }
    
    // Appearance Dialog
    if (showAppearanceDialog) {
        AppearanceDialog(
            currentThemeMode = settings.themeMode,
            onThemeModeChange = { viewModel.setThemeMode(it) },
            onDismiss = { showAppearanceDialog = false }
        )
    }
    
    // Language Dialog
    if (showLanguageDialog) {
        LanguageDialog(
            selectedLanguage = settings.language,
            onLanguageSelect = { viewModel.setLanguage(it) },
            onDismiss = { showLanguageDialog = false }
        )
    }
    
    // Currency Dialog
    if (showCurrencyDialog) {
        CurrencyDialog(
            selectedCurrency = settings.currency,
            onCurrencySelect = { viewModel.setCurrency(it) },
            onDismiss = { showCurrencyDialog = false }
        )
    }
    
    // Biometric Dialog
    if (showBiometricDialog) {
        BiometricDialog(
            isEnabled = settings.isBiometricEnabled,
            onToggle = { 
                viewModel.setBiometricEnabled(it)
                showBiometricDialog = false
            },
            onDismiss = { showBiometricDialog = false }
        )
    }
    
    // 2FA Dialog
    if (show2FADialog) {
        TwoFactorDialog(
            isEnabled = settings.is2FAEnabled,
            onToggle = {
                viewModel.set2FAEnabled(it)
                show2FADialog = false
            },
            onDismiss = { show2FADialog = false }
        )
    }
    
    // Help Dialog
    if (showHelpDialog) {
        HelpCenterDialog(onDismiss = { showHelpDialog = false })
    }
    
    // Terms Dialog
    if (showTermsDialog) {
        TermsPrivacyDialog(onDismiss = { showTermsDialog = false })
    }

    // Logout Dialog
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text("Logout") },
            text = { Text("Are you sure you want to logout?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showLogoutDialog = false
                        viewModel.logout()
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

    // Edit Profile Dialog
    if (showEditDialog) {
        var editName by remember { mutableStateOf(uiState.user?.name ?: "") }
        var editPhone by remember { mutableStateOf(uiState.user?.phone ?: "") }

        AlertDialog(
            onDismissRequest = { showEditDialog = false },
            title = { Text("Edit Profile") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = editName,
                        onValueChange = { editName = it },
                        label = { Text("Name") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = editPhone,
                        onValueChange = { editPhone = it },
                        label = { Text("Phone") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = { 
                    // TODO: Save profile changes via API
                    showEditDialog = false 
                }) {
                    Text("Save")
                }
            },
            dismissButton = {
                TextButton(onClick = { showEditDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // About Dialog
    if (showAboutDialog) {
        AlertDialog(
            onDismissRequest = { showAboutDialog = false },
            title = { Text("About FintechApp") },
            text = {
                Column {
                    Text("Version 1.0.0", style = MaterialTheme.typography.bodyLarge)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        "A personal finance management app built with modern Android architecture.",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        "Features:",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Text("• Track transactions", style = MaterialTheme.typography.bodySmall)
                    Text("• Budget management", style = MaterialTheme.typography.bodySmall)
                    Text("• Bill scanning with OCR", style = MaterialTheme.typography.bodySmall)
                    Text("• Group funds", style = MaterialTheme.typography.bodySmall)
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        "© 2024 Group 6",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = { showAboutDialog = false }) {
                    Text("OK")
                }
            }
        )
    }
}

// ==================== DIALOG COMPONENTS ====================

@Composable
fun ChangePasswordDialog(
    onDismiss: () -> Unit,
    onConfirm: (currentPassword: String, newPassword: String) -> Unit
) {
    var currentPassword by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Change Password") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = currentPassword,
                    onValueChange = { currentPassword = it; errorMessage = null },
                    label = { Text("Current Password") },
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                OutlinedTextField(
                    value = newPassword,
                    onValueChange = { newPassword = it; errorMessage = null },
                    label = { Text("New Password") },
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                OutlinedTextField(
                    value = confirmPassword,
                    onValueChange = { confirmPassword = it; errorMessage = null },
                    label = { Text("Confirm New Password") },
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                errorMessage?.let {
                    Text(
                        text = it,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    when {
                        currentPassword.isEmpty() -> errorMessage = "Enter current password"
                        newPassword.length < 6 -> errorMessage = "Password must be at least 6 characters"
                        newPassword != confirmPassword -> errorMessage = "Passwords do not match"
                        else -> onConfirm(currentPassword, newPassword)
                    }
                }
            ) {
                Text("Change")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun NotificationSettingsDialog(
    pushEnabled: Boolean,
    emailEnabled: Boolean,
    budgetAlerts: Boolean,
    transactionAlerts: Boolean,
    onPushChange: (Boolean) -> Unit,
    onEmailChange: (Boolean) -> Unit,
    onBudgetAlertsChange: (Boolean) -> Unit,
    onTransactionAlertsChange: (Boolean) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Notification Settings") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    "Notification Channels",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
                SwitchRow("Push Notifications", pushEnabled, onPushChange)
                SwitchRow("Email Notifications", emailEnabled, onEmailChange)
                
                Spacer(modifier = Modifier.height(8.dp))
                HorizontalDivider()
                Spacer(modifier = Modifier.height(8.dp))
                
                Text(
                    "Alert Types",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
                SwitchRow("Budget Alerts", budgetAlerts, onBudgetAlertsChange)
                SwitchRow("Transaction Alerts", transactionAlerts, onTransactionAlertsChange)
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Done")
            }
        }
    )
}

@Composable
fun SwitchRow(
    label: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, style = MaterialTheme.typography.bodyMedium)
        Switch(checked = checked, onCheckedChange = onCheckedChange)
    }
}

@Composable
fun AppearanceDialog(
    currentThemeMode: ThemeMode,
    onThemeModeChange: (ThemeMode) -> Unit,
    onDismiss: () -> Unit
) {
    val options = listOf(
        "Light Mode" to ThemeMode.LIGHT,
        "Dark Mode" to ThemeMode.DARK,
        "System Default" to ThemeMode.SYSTEM
    )
    var selectedMode by remember { mutableStateOf(currentThemeMode) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Appearance") },
        text = {
            Column(modifier = Modifier.selectableGroup()) {
                options.forEach { (label, mode) ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .selectable(
                                selected = (mode == selectedMode),
                                onClick = { selectedMode = mode },
                                role = Role.RadioButton
                            )
                            .padding(vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = (mode == selectedMode),
                            onClick = null
                        )
                        Text(
                            text = label,
                            style = MaterialTheme.typography.bodyLarge,
                            modifier = Modifier.padding(start = 16.dp)
                        )
                    }
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    onThemeModeChange(selectedMode)
                    onDismiss()
                }
            ) {
                Text("Apply")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun LanguageDialog(
    selectedLanguage: String,
    onLanguageSelect: (String) -> Unit,
    onDismiss: () -> Unit
) {
    val languages = listOf(
        "Vietnamese" to "🇻🇳",
        "English" to "🇺🇸",
        "Chinese" to "🇨🇳",
        "Japanese" to "🇯🇵",
        "Korean" to "🇰🇷"
    )
    var selected by remember { mutableStateOf(selectedLanguage) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Select Language") },
        text = {
            Column(modifier = Modifier.selectableGroup()) {
                languages.forEach { (language, flag) ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .selectable(
                                selected = (language == selected),
                                onClick = { selected = language },
                                role = Role.RadioButton
                            )
                            .padding(vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = (language == selected),
                            onClick = null
                        )
                        Text(
                            text = "$flag  $language",
                            style = MaterialTheme.typography.bodyLarge,
                            modifier = Modifier.padding(start = 16.dp)
                        )
                    }
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    onLanguageSelect(selected)
                    onDismiss()
                }
            ) {
                Text("Apply")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun CurrencyDialog(
    selectedCurrency: String,
    onCurrencySelect: (String) -> Unit,
    onDismiss: () -> Unit
) {
    val currencies = listOf(
        "VND" to "Vietnamese Dong",
        "USD" to "US Dollar",
        "EUR" to "Euro",
        "JPY" to "Japanese Yen",
        "CNY" to "Chinese Yuan",
        "KRW" to "Korean Won"
    )
    var selected by remember { mutableStateOf(selectedCurrency) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Select Currency") },
        text = {
            Column(modifier = Modifier.selectableGroup()) {
                currencies.forEach { (code, name) ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .selectable(
                                selected = (code == selected),
                                onClick = { selected = code },
                                role = Role.RadioButton
                            )
                            .padding(vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = (code == selected),
                            onClick = null
                        )
                        Column(modifier = Modifier.padding(start = 16.dp)) {
                            Text(
                                text = code,
                                style = MaterialTheme.typography.bodyLarge,
                                fontWeight = FontWeight.Medium
                            )
                            Text(
                                text = name,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    onCurrencySelect(selected)
                    onDismiss()
                }
            ) {
                Text("Apply")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun BiometricDialog(
    isEnabled: Boolean,
    onToggle: (Boolean) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        icon = {
            Icon(
                Icons.Default.Fingerprint,
                contentDescription = null,
                modifier = Modifier.size(48.dp),
                tint = MaterialTheme.colorScheme.primary
            )
        },
        title = { Text("Biometric Login") },
        text = {
            Column {
                Text(
                    if (isEnabled) 
                        "Biometric login is currently enabled. Disable it?" 
                    else 
                        "Enable biometric login to quickly access your account using fingerprint or face recognition.",
                    style = MaterialTheme.typography.bodyMedium
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    "Note: Your device must support biometric authentication.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        confirmButton = {
            TextButton(onClick = { onToggle(!isEnabled) }) {
                Text(if (isEnabled) "Disable" else "Enable")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun TwoFactorDialog(
    isEnabled: Boolean,
    onToggle: (Boolean) -> Unit,
    onDismiss: () -> Unit
) {
    var verificationCode by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        icon = {
            Icon(
                Icons.Default.Security,
                contentDescription = null,
                modifier = Modifier.size(48.dp),
                tint = MaterialTheme.colorScheme.primary
            )
        },
        title = { Text("Two-Factor Authentication") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                if (isEnabled) {
                    Text(
                        "2FA is currently enabled. Enter your verification code to disable.",
                        style = MaterialTheme.typography.bodyMedium
                    )
                } else {
                    Text(
                        "Add an extra layer of security to your account. You'll need an authenticator app like Google Authenticator.",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Text(
                        "Steps to enable:",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Text("1. Download an authenticator app", style = MaterialTheme.typography.bodySmall)
                    Text("2. Scan the QR code (shown after clicking Enable)", style = MaterialTheme.typography.bodySmall)
                    Text("3. Enter the 6-digit code to verify", style = MaterialTheme.typography.bodySmall)
                }
                
                if (isEnabled) {
                    OutlinedTextField(
                        value = verificationCode,
                        onValueChange = { if (it.length <= 6) verificationCode = it.filter { c -> c.isDigit() } },
                        label = { Text("Verification Code") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = { 
                    if (isEnabled && verificationCode.length == 6) {
                        onToggle(false)
                    } else if (!isEnabled) {
                        onToggle(true)
                    }
                },
                enabled = !isEnabled || verificationCode.length == 6
            ) {
                Text(if (isEnabled) "Disable" else "Enable")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun HelpCenterDialog(onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Help Center") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                HelpItem("How do I add a transaction?", "Go to Transactions tab and tap the + button.")
                HelpItem("How do I set a budget?", "Go to Budgets tab and tap Create Budget.")
                HelpItem("How do I scan a bill?", "From Home, tap 'Scan Bill' to use OCR.")
                HelpItem("How do I create a group fund?", "Go to Funds tab and tap the + button.")
                HelpItem("Contact Support", "Email: support@fintechapp.com")
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
}

@Composable
fun HelpItem(question: String, answer: String) {
    Column {
        Text(
            text = question,
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Medium
        )
        Text(
            text = answer,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun TermsPrivacyDialog(onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Terms & Privacy") },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    "Terms of Service",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    "By using FintechApp, you agree to these terms. The app is provided as-is for personal finance management. We are not responsible for financial decisions made based on app data.",
                    style = MaterialTheme.typography.bodySmall
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Text(
                    "Privacy Policy",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    "We collect:\n• Account information (email, name)\n• Transaction data (stored securely)\n• Usage analytics (anonymized)\n\nWe do NOT:\n• Share data with third parties\n• Store payment credentials\n• Access your bank accounts directly",
                    style = MaterialTheme.typography.bodySmall
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Text(
                    "Last updated: March 2024",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
}

// ==================== UI COMPONENTS ====================

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

@Composable
fun ProfileMenuItemWithSwitch(
    icon: ImageVector,
    title: String,
    subtitle: String? = null,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Surface(
        onClick = { onCheckedChange(!checked) },
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(24.dp)
            )
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(start = 16.dp)
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyLarge
                )
                subtitle?.let {
                    Text(
                        text = it,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Switch(
                checked = checked,
                onCheckedChange = onCheckedChange
            )
        }
    }
}
