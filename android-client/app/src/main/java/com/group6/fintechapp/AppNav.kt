package com.group6.fintechapp

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.group6.fintechapp.feature.account.AccountScreen
import com.group6.fintechapp.feature.auth.LoginScreen
import com.group6.fintechapp.feature.budget.BudgetScreen
import com.group6.fintechapp.feature.fund.FundScreen
import com.group6.fintechapp.feature.home.HomeScreen
import com.group6.fintechapp.feature.profile.ProfileScreen
import com.group6.fintechapp.feature.transaction.TransactionScreen

object AppRoutes {
    const val Login = "login"
    const val Home = "home"
    const val Transactions = "transactions"
    const val Budgets = "budgets"
    const val Accounts = "accounts"
    const val Funds = "funds"
    const val Profile = "profile"
}

sealed class BottomNavItem(
    val route: String,
    val icon: ImageVector,
    val label: String
) {
    data object Home : BottomNavItem(AppRoutes.Home, Icons.Default.Home, "Home")
    data object Transactions : BottomNavItem(AppRoutes.Transactions, Icons.Default.SwapHoriz, "Transactions")
    data object Budgets : BottomNavItem(AppRoutes.Budgets, Icons.Default.PieChart, "Budgets")
    data object Funds : BottomNavItem(AppRoutes.Funds, Icons.Default.Groups, "Funds")
    data object Profile : BottomNavItem(AppRoutes.Profile, Icons.Default.Person, "Profile")
}

val bottomNavItems = listOf(
    BottomNavItem.Home,
    BottomNavItem.Transactions,
    BottomNavItem.Budgets,
    BottomNavItem.Funds,
    BottomNavItem.Profile
)

@Composable
fun FintechApp(navController: NavHostController = rememberNavController()) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination
    
    val showBottomBar = currentDestination?.route in bottomNavItems.map { it.route } ||
            currentDestination?.route == AppRoutes.Accounts

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    bottomNavItems.forEach { item ->
                        NavigationBarItem(
                            icon = { Icon(item.icon, contentDescription = item.label) },
                            label = { Text(item.label) },
                            selected = currentDestination?.hierarchy?.any { it.route == item.route } == true,
                            onClick = {
                                navController.navigate(item.route) {
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
            startDestination = AppRoutes.Login,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(AppRoutes.Login) {
                LoginScreen(
                    onLoginSuccess = {
                        navController.navigate(AppRoutes.Home) {
                            popUpTo(AppRoutes.Login) { inclusive = true }
                        }
                    }
                )
            }
            composable(AppRoutes.Home) {
                HomeScreen(
                    onNavigateToAccounts = {
                        navController.navigate(AppRoutes.Accounts)
                    }
                )
            }
            composable(AppRoutes.Transactions) {
                TransactionScreen()
            }
            composable(AppRoutes.Budgets) {
                BudgetScreen()
            }
            composable(AppRoutes.Accounts) {
                AccountScreen()
            }
            composable(AppRoutes.Funds) {
                FundScreen()
            }
            composable(AppRoutes.Profile) {
                ProfileScreen(
                    onLogout = {
                        navController.navigate(AppRoutes.Login) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }
        }
    }
}
