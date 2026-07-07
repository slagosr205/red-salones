param(
    [string]$FtpServer = "probeautyhn.com",
    [string]$Username = "admin@probeautyhn.com",
    [string]$Password = "TPCe-uF&o;bt=.uX",
    [string]$RemoteRoot = "/public_html"
)

$localRoot = "C:\Users\suamy\Documents\Proyectos\Red Comercial de Salones\red-comercial"

$webClient = New-Object System.Net.WebClient
$webClient.Credentials = New-Object System.Net.NetworkCredential($Username, $Password)
$webClient.Encoding = [System.Text.Encoding]::UTF8

function Ensure-Remote-Dir {
    param([string]$remoteDir)
    $parts = $remoteDir.TrimStart('/').Split('/')
    $current = ""
    foreach ($part in $parts) {
        $current = "$current/$part"
        $dirUri = "ftp://${FtpServer}${current}/"
        try {
            $webClient.UploadString($dirUri, "") | Out-Null
        } catch {
            # already exists, ignore
        }
    }
}

function Upload-File {
    param([string]$localPath, [string]$remotePath)
    
    if (-not (Test-Path $localPath)) {
        Write-Host "  SKIP: $localPath (not found)" -ForegroundColor DarkYellow
        return $false
    }
    
    $remoteDir = Split-Path $remotePath -Parent
    Ensure-Remote-Dir $remoteDir
    
    $uri = "ftp://${FtpServer}${remotePath}"
    try {
        $webClient.UploadFile($uri, "STOR", $localPath) | Out-Null
        Write-Host "  OK" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Upload-Dir-Recursive {
    param([string]$localDir, [string]$remoteDir)
    
    $items = Get-ChildItem $localDir
    foreach ($item in $items) {
        $localItem = $item.FullName
        $remoteItem = "$remoteDir/$($item.Name)"
        if ($item.PSIsContainer) {
            Ensure-Remote-Dir $remoteItem
            Upload-Dir-Recursive $localItem $remoteItem
        } else {
            Write-Host "  $($item.Name) " -NoNewline
            Upload-File $localItem $remoteItem | Out-Null
        }
    }
}

Write-Host "=== Deploying all new changes ===" -ForegroundColor Cyan
Write-Host ""

# 1. Controllers
Write-Host "--- Controllers ---" -ForegroundColor Cyan
$controllers = @(
    "app/Http/Controllers/ArticleController.php",
    "app/Http/Controllers/BulkUploadController.php",
    "app/Http/Controllers/InventoryController.php",
    "app/Http/Controllers/OrderController.php",
    "app/Http/Controllers/PromotionController.php",
    "app/Http/Controllers/RegistrationController.php",
    "app/Http/Controllers/TodoPagoController.php",
    "app/Http/Controllers/UserManagementController.php",
    "app/Http/Controllers/ZoneController.php"
)
foreach ($f in $controllers) {
    $local = Join-Path $localRoot $f
    $remote = "$RemoteRoot/$($f.Replace('\', '/'))"
    Write-Host "  $f " -NoNewline
    Upload-File $local $remote | Out-Null
}

# 2. Models
Write-Host "--- Models ---" -ForegroundColor Cyan
$models = @(
    "app/Models/Article.php",
    "app/Models/InventoryMovement.php",
    "app/Models/Order.php",
    "app/Models/Promotion.php",
    "app/Models/User.php",
    "app/Models/Zone.php"
)
foreach ($f in $models) {
    $local = Join-Path $localRoot $f
    $remote = "$RemoteRoot/$($f.Replace('\', '/'))"
    Write-Host "  $f " -NoNewline
    Upload-File $local $remote | Out-Null
}

# 3. Services
Write-Host "--- Services ---" -ForegroundColor Cyan
$services = @(
    "app/Services/TodoPagoClient.php"
)
foreach ($f in $services) {
    $local = Join-Path $localRoot $f
    $remote = "$RemoteRoot/$($f.Replace('\', '/'))"
    Write-Host "  $f " -NoNewline
    Upload-File $local $remote | Out-Null
}

# 4. Config
Write-Host "--- Config ---" -ForegroundColor Cyan
$configFiles = @(
    "config/services.php"
)
foreach ($f in $configFiles) {
    $local = Join-Path $localRoot $f
    $remote = "$RemoteRoot/$($f.Replace('\', '/'))"
    Write-Host "  $f " -NoNewline
    Upload-File $local $remote | Out-Null
}

# 5. Migrations
Write-Host "--- Migrations ---" -ForegroundColor Cyan
$migrations = @(
    "database/migrations/2026_06_16_000001_add_client_type_to_users_table.php",
    "database/migrations/2026_06_16_000002_add_public_price_to_articles_table.php",
    "database/migrations/2026_06_16_000003_add_min_stock_to_articles_table.php",
    "database/migrations/2026_06_16_000004_create_inventory_movements_table.php",
    "database/migrations/2026_06_23_000001_create_zones_table.php",
    "database/migrations/2026_06_23_000002_create_leader_zone_table.php",
    "database/migrations/2026_06_24_000001_add_points_balance_to_users_table.php",
    "database/migrations/2026_06_24_000002_add_target_role_to_benefits_table.php",
    "database/migrations/2026_06_24_000003_add_target_role_to_promotions_table.php",
    "database/migrations/2026_06_24_000004_add_masterclass_fields_to_benefits_table.php",
    "database/migrations/2026_06_24_000005_add_todopago_fields_to_orders_table.php",
    "database/migrations/2026_06_24_000006_add_todopago_reversal_fields_to_orders_table.php"
)
foreach ($f in $migrations) {
    $local = Join-Path $localRoot $f
    $remote = "$RemoteRoot/$($f.Replace('\', '/'))"
    Write-Host "  $f " -NoNewline
    Upload-File $local $remote | Out-Null
}

# 6. Seeders
Write-Host "--- Seeders ---" -ForegroundColor Cyan
$seeders = @(
    "database/seeders/DatabaseSeeder.php"
)
foreach ($f in $seeders) {
    $local = Join-Path $localRoot $f
    $remote = "$RemoteRoot/$($f.Replace('\', '/'))"
    Write-Host "  $f " -NoNewline
    Upload-File $local $remote | Out-Null
}

# 7. Routes
Write-Host "--- Routes ---" -ForegroundColor Cyan
$routesLocal = Join-Path $localRoot "resources/routes/web.php"
$routesRemote = "$RemoteRoot/resources/routes/web.php"
Write-Host "  resources/routes/web.php " -NoNewline
Upload-File $routesLocal $routesRemote | Out-Null

# 8. Views
Write-Host "--- Views ---" -ForegroundColor Cyan
$views = @(
    "resources/views/app.blade.php"
)
foreach ($f in $views) {
    $local = Join-Path $localRoot $f
    $remote = "$RemoteRoot/$($f.Replace('\', '/'))"
    Write-Host "  $f " -NoNewline
    Upload-File $local $remote | Out-Null
}

# 9. Frontend source (TSX/TS files)
Write-Host "--- Frontend Source ---" -ForegroundColor Cyan
$frontend = @(
    "resources/js/Components/PaymentDialog.tsx",
    "resources/js/Components/TodoPagoPaymentDialog.tsx",
    "resources/js/Layouts/AuthenticatedLayout.tsx",
    "resources/js/Pages/Public/Catalog.tsx",
    "resources/js/Pages/Rc/ArticlesCreate.tsx",
    "resources/js/Pages/Rc/ArticlesEdit.tsx",
    "resources/js/Pages/Rc/Benefits.tsx",
    "resources/js/Pages/Rc/BulkUpload.tsx",
    "resources/js/Pages/Rc/Cart.tsx",
    "resources/js/Pages/Rc/CreateUser.tsx",
    "resources/js/Pages/Rc/Inventory.tsx",
    "resources/js/Pages/Rc/Network.tsx",
    "resources/js/Pages/Rc/OrderDetail.tsx",
    "resources/js/Pages/Rc/Orders.tsx",
    "resources/js/Pages/Rc/PendingApprovals.tsx",
    "resources/js/Pages/Rc/Pos.tsx",
    "resources/js/Pages/Rc/Products.tsx",
    "resources/js/Pages/Rc/Welcome.tsx",
    "resources/js/Pages/Rc/Zones.tsx",
    "resources/js/rc/benefits.ts",
    "resources/js/rc/notifications.ts",
    "resources/js/rc/promotions.ts",
    "resources/js/types/index.d.ts"
)
foreach ($f in $frontend) {
    $local = Join-Path $localRoot $f
    $remote = "$RemoteRoot/$($f.Replace('\', '/'))"
    Write-Host "  $f " -NoNewline
    Upload-File $local $remote | Out-Null
}

# 10. Built assets (full build directory)
Write-Host "--- Built Assets ---" -ForegroundColor Cyan
$buildLocal = Join-Path $localRoot "public/build"
$buildRemote = "$RemoteRoot/public/build"
Upload-Dir-Recursive $buildLocal $buildRemote

Write-Host ""
Write-Host "=== Deploy complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "En el servidor, ejecuta estos comandos:" -ForegroundColor Yellow
Write-Host "  cd /public_html" -ForegroundColor White
Write-Host "  php artisan migrate" -ForegroundColor White
Write-Host "  php artisan config:cache" -ForegroundColor White
Write-Host "  php artisan route:cache" -ForegroundColor White
Write-Host "  php artisan optimize" -ForegroundColor White
