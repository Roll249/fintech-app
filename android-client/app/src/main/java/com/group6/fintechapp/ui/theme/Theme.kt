package com.group6.fintechapp.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat
import com.group6.fintechapp.core.settings.ThemeMode

// Primary colors
private val PrimaryLight = Color(0xFF1976D2)
private val OnPrimaryLight = Color.White
private val PrimaryContainerLight = Color(0xFFBBDEFB)
private val OnPrimaryContainerLight = Color(0xFF001E32)

private val SecondaryLight = Color(0xFF00897B)
private val OnSecondaryLight = Color.White
private val SecondaryContainerLight = Color(0xFFB2DFDB)
private val OnSecondaryContainerLight = Color(0xFF002020)

private val TertiaryLight = Color(0xFF7B1FA2)
private val OnTertiaryLight = Color.White
private val TertiaryContainerLight = Color(0xFFE1BEE7)
private val OnTertiaryContainerLight = Color(0xFF280038)

private val ErrorLight = Color(0xFFD32F2F)
private val OnErrorLight = Color.White
private val ErrorContainerLight = Color(0xFFFFCDD2)
private val OnErrorContainerLight = Color(0xFF410002)

private val BackgroundLight = Color(0xFFFFFBFE)
private val OnBackgroundLight = Color(0xFF1C1B1E)
private val SurfaceLight = Color(0xFFFFFBFE)
private val OnSurfaceLight = Color(0xFF1C1B1E)
private val SurfaceVariantLight = Color(0xFFE7E0EC)
private val OnSurfaceVariantLight = Color(0xFF49454F)
private val OutlineLight = Color(0xFF79747E)

// Dark theme colors
private val PrimaryDark = Color(0xFF90CAF9)
private val OnPrimaryDark = Color(0xFF003258)
private val PrimaryContainerDark = Color(0xFF004880)
private val OnPrimaryContainerDark = Color(0xFFD1E4FF)

private val SecondaryDark = Color(0xFF80CBC4)
private val OnSecondaryDark = Color(0xFF003735)
private val SecondaryContainerDark = Color(0xFF00504D)
private val OnSecondaryContainerDark = Color(0xFFA8F0EA)

private val TertiaryDark = Color(0xFFCE93D8)
private val OnTertiaryDark = Color(0xFF420059)
private val TertiaryContainerDark = Color(0xFF5C007F)
private val OnTertiaryContainerDark = Color(0xFFF9D8FF)

private val ErrorDark = Color(0xFFEF9A9A)
private val OnErrorDark = Color(0xFF690005)
private val ErrorContainerDark = Color(0xFF93000A)
private val OnErrorContainerDark = Color(0xFFFFDAD6)

private val BackgroundDark = Color(0xFF1C1B1E)
private val OnBackgroundDark = Color(0xFFE6E1E5)
private val SurfaceDark = Color(0xFF1C1B1E)
private val OnSurfaceDark = Color(0xFFE6E1E5)
private val SurfaceVariantDark = Color(0xFF49454F)
private val OnSurfaceVariantDark = Color(0xFFCAC4D0)
private val OutlineDark = Color(0xFF938F99)

private val LightColorScheme = lightColorScheme(
    primary = PrimaryLight,
    onPrimary = OnPrimaryLight,
    primaryContainer = PrimaryContainerLight,
    onPrimaryContainer = OnPrimaryContainerLight,
    secondary = SecondaryLight,
    onSecondary = OnSecondaryLight,
    secondaryContainer = SecondaryContainerLight,
    onSecondaryContainer = OnSecondaryContainerLight,
    tertiary = TertiaryLight,
    onTertiary = OnTertiaryLight,
    tertiaryContainer = TertiaryContainerLight,
    onTertiaryContainer = OnTertiaryContainerLight,
    error = ErrorLight,
    onError = OnErrorLight,
    errorContainer = ErrorContainerLight,
    onErrorContainer = OnErrorContainerLight,
    background = BackgroundLight,
    onBackground = OnBackgroundLight,
    surface = SurfaceLight,
    onSurface = OnSurfaceLight,
    surfaceVariant = SurfaceVariantLight,
    onSurfaceVariant = OnSurfaceVariantLight,
    outline = OutlineLight
)

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryDark,
    onPrimary = OnPrimaryDark,
    primaryContainer = PrimaryContainerDark,
    onPrimaryContainer = OnPrimaryContainerDark,
    secondary = SecondaryDark,
    onSecondary = OnSecondaryDark,
    secondaryContainer = SecondaryContainerDark,
    onSecondaryContainer = OnSecondaryContainerDark,
    tertiary = TertiaryDark,
    onTertiary = OnTertiaryDark,
    tertiaryContainer = TertiaryContainerDark,
    onTertiaryContainer = OnTertiaryContainerDark,
    error = ErrorDark,
    onError = OnErrorDark,
    errorContainer = ErrorContainerDark,
    onErrorContainer = OnErrorContainerDark,
    background = BackgroundDark,
    onBackground = OnBackgroundDark,
    surface = SurfaceDark,
    onSurface = OnSurfaceDark,
    surfaceVariant = SurfaceVariantDark,
    onSurfaceVariant = OnSurfaceVariantDark,
    outline = OutlineDark
)

@Composable
fun FintechAppTheme(
    themeMode: ThemeMode = ThemeMode.SYSTEM,
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val darkTheme = when (themeMode) {
        ThemeMode.DARK -> true
        ThemeMode.LIGHT -> false
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
    }
    
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }
    
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
        content = content
    )
}
