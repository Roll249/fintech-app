package com.group6.fintechapp

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.PieChart
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Savings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.group6.fintechapp.ui.auth.LoginScreen
import com.group6.fintechapp.ui.auth.RegisterScreen
import com.group6.fintechapp.ui.auth.AuthViewModel
import com.group6.fintechapp.ui.home.HomeScreen
import com.group6.fintechapp.ui.home.HomeViewModel
import com.group6.fintechapp.ui.fund.FundScreen
import com.group6.fintechapp.ui.fund.FundDetailScreen
import com.group6.fintechapp.ui.fund.FundViewModel
import com.group6.fintechapp.ui.transaction.TransactionScreen
import com.group6.fintechapp.ui.transaction.TransactionViewModel
import com.group6.fintechapp.ui.qr.QRDisplayScreen
import com.group6.fintechapp.ui.qr.QRScannerScreen
import com.group6.fintechapp.ui.qr.QRViewModel
import com.group6.fintechapp.ui.profile.ProfileScreen
import com.group6.fintechapp.ui.profile.ProfileViewModel
import com.group6.fintechapp.ui.bank.BankListScreen
import com.group6.fintechapp.ui.bank.BankViewModel
import com.group6.fintechapp.ui.budget.BudgetScreen
import com.group6.fintechapp.ui.budget.BudgetViewModel
import com.group6.fintechapp.ui.report.ReportScreen
import com.group6.fintechapp.ui.report.ReportViewModel
import com.group6.fintechapp.ui.bill.BillScreen
import com.group6.fintechapp.ui.bill.BillViewModel

sealed class Screen(val route: String, val title: String, val icon: ImageVector?) {
    object Login : Screen("login", "Đăng nhập", null)
    object Register : Screen("register", "Đăng ký", null)
    object Home : Screen("home", "Trang chủ", Icons.Default.Home)
    object Transactions : Screen("transactions", "Giao dịch", Icons.Default.AccountBalance)
    object Funds : Screen("funds", "Quỹ", Icons.Default.Savings)
    object Budgets : Screen("budgets", "Ngân sách", Icons.Default.AccountBalanceWallet)
    object Reports : Screen("reports", "Báo cáo", Icons.Default.PieChart)
    object Bills : Screen("bills", "Hóa đơn", Icons.Default.Receipt)
    object QR : Screen("qr", "QR", Icons.Default.QrCodeScanner)
    object Notifications : Screen("notifications", "Thông báo", Icons.Default.Notifications)
    object Profile : Screen("profile", "Hồ sơ", null)
    object FundDetail : Screen("fund/{fundId}", "Chi tiết quỹ", null) {
        fun createRoute(fundId: String) = "fund/$fundId"
    }
    object Banks : Screen("banks", "Ngân hàng", null)
}

val bottomNavItems = listOf(
    Screen.Home,
    Screen.Transactions,
    Screen.Funds,
    Screen.Budgets,
    Screen.Profile
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FintechNavigation() {
    val navController = rememberNavController()
    val authViewModel: AuthViewModel = hiltViewModel()
    val isLoggedIn by authViewModel.isLoggedIn.collectAsState()
    val isLoading by authViewModel.isLoading.collectAsState()

    LaunchedEffect(isLoggedIn, isLoading) {
        if (!isLoading) {
            if (isLoggedIn) {
                navController.navigate(Screen.Home.route) {
                    popUpTo(Screen.Login.route) { inclusive = true }
                }
            } else {
                navController.navigate(Screen.Login.route) {
                    popUpTo(0) { inclusive = true }
                }
            }
        }
    }

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    val showBottomBar = bottomNavItems.any { screen ->
        currentDestination?.hierarchy?.any { it.route == screen.route } == true
    }

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    bottomNavItems.forEach { screen ->
                        NavigationBarItem(
                            icon = { Icon(screen.icon!!, contentDescription = screen.title) },
                            label = { Text(screen.title) },
                            selected = currentDestination?.hierarchy?.any { it.route == screen.route } == true,
                            onClick = {
                                navController.navigate(screen.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = if (isLoggedIn) Screen.Home.route else Screen.Login.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Login.route) {
                LoginScreen(
                    onNavigateToRegister = { navController.navigate(Screen.Register.route) },
                    onLoginSuccess = {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    }
                )
            }

            composable(Screen.Register.route) {
                RegisterScreen(
                    onNavigateToLogin = { navController.popBackStack() },
                    onRegisterSuccess = {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    }
                )
            }

            composable(Screen.Home.route) {
                val viewModel: HomeViewModel = hiltViewModel()
                HomeScreen(
                    viewModel = viewModel,
                    onNavigateToBanks = { navController.navigate(Screen.Banks.route) },
                    onNavigateToTransactions = { navController.navigate(Screen.Transactions.route) },
                    onNavigateToFundDetail = { fundId ->
                        navController.navigate(Screen.FundDetail.createRoute(fundId))
                    },
                    onNavigateToBudgets = { navController.navigate(Screen.Budgets.route) },
                    onNavigateToReports = { navController.navigate(Screen.Reports.route) },
                    onNavigateToBills = { navController.navigate(Screen.Bills.route) }
                )
            }

            composable(Screen.Transactions.route) {
                val viewModel: TransactionViewModel = hiltViewModel()
                TransactionScreen(viewModel = viewModel)
            }

            composable(Screen.Funds.route) {
                val viewModel: FundViewModel = hiltViewModel()
                FundScreen(
                    viewModel = viewModel,
                    onNavigateToDetail = { fundId ->
                        navController.navigate(Screen.FundDetail.createRoute(fundId))
                    }
                )
            }

            composable(
                route = Screen.FundDetail.route,
                arguments = listOf(navArgument("fundId") { type = NavType.StringType })
            ) { backStackEntry ->
                val fundId = backStackEntry.arguments?.getString("fundId") ?: return@composable
                val viewModel: FundViewModel = hiltViewModel()
                FundDetailScreen(
                    fundId = fundId,
                    viewModel = viewModel,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Budgets.route) {
                val viewModel: BudgetViewModel = hiltViewModel()
                BudgetScreen(viewModel = viewModel)
            }

            composable(Screen.Reports.route) {
                val viewModel: ReportViewModel = hiltViewModel()
                ReportScreen(viewModel = viewModel)
            }

            composable(Screen.Bills.route) {
                val viewModel: BillViewModel = hiltViewModel()
                BillScreen(viewModel = viewModel)
            }

            composable(Screen.QR.route) {
                val viewModel: QRViewModel = hiltViewModel()
                QRDisplayScreen(
                    viewModel = viewModel,
                    onScanQR = { navController.navigate("scan") }
                )
            }

            composable("scan") {
                val viewModel: QRViewModel = hiltViewModel()
                QRScannerScreen(
                    viewModel = viewModel,
                    onNavigateBack = { navController.popBackStack() },
                    onTransferSuccess = { navController.navigate(Screen.Home.route) }
                )
            }

            composable(Screen.Profile.route) {
                val viewModel: ProfileViewModel = hiltViewModel()
                ProfileScreen(
                    viewModel = viewModel,
                    onLogout = {
                        navController.navigate(Screen.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }

            composable(Screen.Banks.route) {
                val viewModel: BankViewModel = hiltViewModel()
                BankListScreen(
                    viewModel = viewModel,
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }
    }
}