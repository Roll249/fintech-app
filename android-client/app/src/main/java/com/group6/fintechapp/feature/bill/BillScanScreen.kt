package com.group6.fintechapp.feature.bill

import android.Manifest
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import androidx.lifecycle.viewmodel.compose.viewModel
import java.io.ByteArrayOutputStream
import java.io.File

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BillScanScreen(
    onBack: () -> Unit,
    viewModel: BillScanViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    var capturedImageUri by remember { mutableStateOf<Uri?>(null) }
    var capturedBitmap by remember { mutableStateOf<Bitmap?>(null) }

    // Camera launcher
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success ->
        if (success) {
            capturedImageUri?.let { uri ->
                val bitmap = loadBitmapFromUri(context, uri)
                capturedBitmap = bitmap
                bitmap?.let {
                    val base64 = bitmapToBase64(it)
                    viewModel.uploadBill(base64)
                }
            }
        }
    }

    // Gallery launcher
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            val bitmap = loadBitmapFromUri(context, it)
            capturedBitmap = bitmap
            bitmap?.let { bmp ->
                val base64 = bitmapToBase64(bmp)
                viewModel.uploadBill(base64)
            }
        }
    }

    // Permission launcher
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            val uri = createImageUri(context)
            capturedImageUri = uri
            cameraLauncher.launch(uri)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Scan Bill") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Image preview
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(300.dp)
            ) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    if (capturedBitmap != null) {
                        Image(
                            bitmap = capturedBitmap!!.asImageBitmap(),
                            contentDescription = "Captured bill",
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                Icons.Default.CameraAlt,
                                contentDescription = null,
                                modifier = Modifier.size(64.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                "Capture or select a bill image",
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Capture buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OutlinedButton(
                    onClick = {
                        permissionLauncher.launch(Manifest.permission.CAMERA)
                    },
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Default.CameraAlt, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Camera")
                }

                OutlinedButton(
                    onClick = { galleryLauncher.launch("image/*") },
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Default.PhotoLibrary, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Gallery")
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // OCR Results
            when {
                uiState.isLoading -> {
                    CircularProgressIndicator()
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Processing bill with OCR...")
                }
                uiState.error != null -> {
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer
                        )
                    ) {
                        Text(
                            text = uiState.error!!,
                            modifier = Modifier.padding(16.dp),
                            color = MaterialTheme.colorScheme.onErrorContainer
                        )
                    }
                }
                uiState.ocrResult != null -> {
                    OcrResultCard(uiState.ocrResult!!)
                }
            }
        }
    }
}

@Composable
fun OcrResultCard(result: OcrResult) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                "OCR Results",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(16.dp))

            if (result.merchantName != null) {
                ResultRow("Merchant", result.merchantName)
            }
            if (result.totalAmount != null) {
                ResultRow("Total Amount", "${result.totalAmount} VND")
            }
            if (result.date != null) {
                ResultRow("Date", result.date)
            }
            if (result.tax != null) {
                ResultRow("Tax", "${result.tax} VND")
            }

            if (result.items.isNotEmpty()) {
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    "Items",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
                result.items.forEach { item ->
                    Text(
                        "• ${item.name}: ${item.price} VND",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = { /* Create transaction from this bill */ },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Create Transaction")
            }
        }
    }
}

@Composable
fun ResultRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, fontWeight = FontWeight.Medium)
    }
}

private fun createImageUri(context: Context): Uri {
    val imageFile = File(context.cacheDir, "bill_${System.currentTimeMillis()}.jpg")
    return FileProvider.getUriForFile(
        context,
        "${context.packageName}.fileprovider",
        imageFile
    )
}

private fun loadBitmapFromUri(context: Context, uri: Uri): Bitmap? {
    return try {
        context.contentResolver.openInputStream(uri)?.use { inputStream ->
            BitmapFactory.decodeStream(inputStream)
        }
    } catch (e: Exception) {
        null
    }
}

private fun bitmapToBase64(bitmap: Bitmap): String {
    val outputStream = ByteArrayOutputStream()
    // Compress to reduce size
    val scaledBitmap = if (bitmap.width > 1024 || bitmap.height > 1024) {
        val scale = minOf(1024f / bitmap.width, 1024f / bitmap.height)
        Bitmap.createScaledBitmap(
            bitmap,
            (bitmap.width * scale).toInt(),
            (bitmap.height * scale).toInt(),
            true
        )
    } else {
        bitmap
    }
    scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 80, outputStream)
    return Base64.encodeToString(outputStream.toByteArray(), Base64.DEFAULT)
}
