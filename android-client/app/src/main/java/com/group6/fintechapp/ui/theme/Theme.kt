package com.group6.fintechapp.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

// Color palette
val Primary = Color(0xFF4CAF50)
val PrimaryVariant = Color(0xFF388E3C)
val Secondary = Color(0xFF2196F3)
val SecondaryVariant = Color(0xFF1976D2)
val Background = Color(0xFFF5F5F5)
val Surface = Color(0xFFFFFFFF)
val Error = Color(0xFFE53935)
val OnPrimary = Color(0xFFFFFFFF)
val OnSecondary = Color(0xFFFFFFFF)
val OnBackground = Color(0xFF212121)
val OnSurface = Color(0xFF212121)
val OnError = Color(0xFFFFFFFF)

val DarkBackground = Color(0xFF121212)
val DarkSurface = Color(0xFF1E1E1E)

// Fund colors
val FundColor1 = Color(0xFFFF5722)
val FundColor2 = Color(0xFF2196F3)
val FundColor3 = Color(0xFF4CAF50)
val FundColor4 = Color(0xFF9C27B0)
val FundColor5 = Color(0xFFFF9800)

// Transaction colors
val IncomeColor = Color(0xFF4CAF50)
val ExpenseColor = Color(0xFFE53935)
val TransferColor = Color(0xFF9E9E9E)

private val LightColorScheme = lightColorScheme(
    primary = Primary,
    onPrimary = OnPrimary,
    primaryContainer = Primary.copy(alpha = 0.1f),
    onPrimaryContainer = Primary,
    secondary = Secondary,
    onSecondary = OnSecondary,
    secondaryContainer = Secondary.copy(alpha = 0.1f),
    onSecondaryContainer = Secondary,
    background = Background,
    onBackground = OnBackground,
    surface = Surface,
    onSurface = OnSurface,
    error = Error,
    onError = OnError,
    surfaceVariant = Color(0xFFE0E0E0),
    outline = Color(0xFFBDBDBD)
)

private val DarkColorScheme = darkColorScheme(
    primary = Primary,
    onPrimary = OnPrimary,
    primaryContainer = Primary.copy(alpha = 0.2f),
    onPrimaryContainer = Primary.copy(alpha = 0.8f),
    secondary = Secondary,
    onSecondary = OnSecondary,
    secondaryContainer = Secondary.copy(alpha = 0.2f),
    onSecondaryContainer = Secondary.copy(alpha = 0.8f),
    background = DarkBackground,
    onBackground = Color.White,
    surface = DarkSurface,
    onSurface = Color.White,
    error = Error,
    onError = OnError,
    surfaceVariant = Color(0xFF2D2D2D),
    outline = Color(0xFF616161)
)

@Composable
fun FintechTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}

@Composable
fun getFundColor(index: Int): Color {
    return when (index % 5) {
        0 -> FundColor1
        1 -> FundColor2
        2 -> FundColor3
        3 -> FundColor4
        else -> FundColor5
    }
}

@Composable
fun getTransactionColor(type: String): Color {
    return when (type) {
        "income" -> IncomeColor
        "expense" -> ExpenseColor
        else -> TransferColor
    }
}

@Composable
fun formatCurrency(amount: Long): String {
    return "%,d".format(amount).replace(",", ".") + " đ"
}

@Composable
fun formatCurrencyShort(amount: Long): String {
    return when {
        amount >= 1_000_000_000 -> "%.1fB".format(amount / 1_000_000_000.0)
        amount >= 1_000_000 -> "%.1fM".format(amount / 1_000_000.0)
        amount >= 1_000 -> "%.1fK".format(amount / 1_000.0)
        else -> amount.toString()
    }
}