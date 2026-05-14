# =============================================================================
# RecetteBox - Test local du Worker
# =============================================================================
# 1. Cree le fichier .env.local (depuis .env.example) si absent
# 2. Ouvre Notepad pour que tu colles tes 5 cles API
# 3. Installe les dependances npm
# 4. Lance le worker en local pendant que tu regardes les logs
# =============================================================================

# Couleurs
function Write-Step($msg) { Write-Host ""; Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "    OK $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "    !! $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "    XX $msg" -ForegroundColor Red }

function Assert-Success($step) {
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Echec : $step (exit code $LASTEXITCODE)"
        exit 1
    }
}

# Se placer dans worker/
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkerDir = Join-Path $ScriptDir "worker"
if (-not (Test-Path $WorkerDir)) {
    Write-Err "Dossier worker/ introuvable"
    exit 1
}
Set-Location $WorkerDir
Write-Host "Working directory : $WorkerDir"

# -----------------------------------------------------------------------------
# Etape 1 : Verifier Node.js
# -----------------------------------------------------------------------------
Write-Step "Verification de Node.js"
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
    Write-Err "Node.js n'est pas installe. Telecharge-le sur https://nodejs.org/ (version 20 ou plus)"
    exit 1
}
Write-Ok "Node.js detecte : $nodeVersion"

# -----------------------------------------------------------------------------
# Etape 2 : Creer .env.local depuis .env.example si absent
# -----------------------------------------------------------------------------
$EnvLocal = Join-Path $WorkerDir ".env.local"
$EnvExample = Join-Path $WorkerDir ".env.example"

if (-not (Test-Path $EnvLocal)) {
    Write-Step "Creation de .env.local"
    Copy-Item $EnvExample $EnvLocal
    Write-Ok ".env.local cree"

    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Yellow
    Write-Host " ACTION REQUISE : remplir le fichier .env.local" -ForegroundColor Yellow
    Write-Host "============================================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Notepad va s'ouvrir avec le fichier .env.local."
    Write-Host "Tu dois remplacer les valeurs ' = ... ' par tes vraies cles."
    Write-Host ""
    Write-Host "Cles a remplir (depuis ton bloc-notes) :"
    Write-Host "  SUPABASE_URL=https://drymgrccydkntskrpjgu.supabase.co"
    Write-Host "  SUPABASE_SERVICE_ROLE_KEY=sb_secret_..."
    Write-Host "  OPENAI_API_KEY=sk-..."
    Write-Host "  ANTHROPIC_API_KEY=sk-ant-..."
    Write-Host ""
    Write-Host "Les autres variables (SOCIAL_API_*, WORKER_*, LOG_LEVEL)"
    Write-Host "ont des valeurs par defaut, laisse-les telles quelles."
    Write-Host ""
    Write-Host "Quand tu as colle tes cles et fais Ctrl+S pour sauvegarder,"
    Write-Host "FERME Notepad et reviens ici."
    Write-Host ""

    # Ouvre Notepad et attend que l'utilisateur le ferme
    Start-Process notepad.exe -ArgumentList $EnvLocal -Wait

    Write-Ok ".env.local rempli"
} else {
    Write-Step ".env.local existe deja"
    Write-Ok "Si tu veux le modifier : notepad .env.local"
}

# -----------------------------------------------------------------------------
# Etape 3 : Verifier que les cles sont bien renseignees
# -----------------------------------------------------------------------------
Write-Step "Verification du contenu de .env.local"
$envContent = Get-Content $EnvLocal -Raw

$placeholders = @(
    "YOUR-PROJECT.supabase.co",
    "SUPABASE_SERVICE_ROLE_KEY=ey..."
    "SUPABASE_SERVICE_ROLE_KEY=sk_secret_..."
    "OPENAI_API_KEY=sk-..."
    "ANTHROPIC_API_KEY=sk-ant-..."
)

$missingKeys = $false
if ($envContent -match "YOUR-PROJECT") {
    Write-Err "SUPABASE_URL n'a pas ete remplie (contient encore YOUR-PROJECT)"
    $missingKeys = $true
}
if ($envContent -match "OPENAI_API_KEY=sk-\.\.\." -or $envContent -match "OPENAI_API_KEY=$") {
    Write-Err "OPENAI_API_KEY n'a pas ete remplie"
    $missingKeys = $true
}
if ($envContent -match "ANTHROPIC_API_KEY=sk-ant-\.\.\." -or $envContent -match "ANTHROPIC_API_KEY=$") {
    Write-Err "ANTHROPIC_API_KEY n'a pas ete remplie"
    $missingKeys = $true
}

if ($missingKeys) {
    Write-Host ""
    Write-Warn "Relance le script apres avoir rempli les cles manquantes dans .env.local"
    exit 1
}
Write-Ok "Toutes les cles sont renseignees"

# -----------------------------------------------------------------------------
# Etape 4 : npm install
# -----------------------------------------------------------------------------
Write-Step "Installation des dependances (npm install)"
Write-Host "    Premiere fois : ~30-60 secondes"

npm install
Assert-Success "npm install"
Write-Ok "Dependances installees"

# -----------------------------------------------------------------------------
# Etape 5 : Lancer le worker
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " LANCEMENT DU WORKER" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Tu vas voir des logs JSON apparaitre."
Write-Host ""
Write-Host "Ce que tu cherches (signe que tout marche) :"
Write-Host '  - "Worker starting"' -ForegroundColor Cyan
Write-Host '  - "Realtime channel status SUBSCRIBED"' -ForegroundColor Cyan
Write-Host '  - "Healthcheck listening"' -ForegroundColor Cyan
Write-Host ""
Write-Host "Si tu vois ces 3 lignes, c'est gagne." -ForegroundColor Green
Write-Host ""
Write-Host "Pour arreter le worker : Ctrl+C"
Write-Host ""
Write-Host "Lancement dans 3 secondes..."
Start-Sleep -Seconds 3

# Charge .env.local dans l'environnement de la session
Get-Content $EnvLocal | ForEach-Object {
    if ($_ -match "^([A-Z_]+)=(.+)$") {
        $name = $Matches[1]
        $value = $Matches[2]
        # Retirer guillemets et commentaires en fin de ligne
        $value = $value -replace '\s+#.*$', ''
        $value = $value.Trim('"').Trim("'").Trim()
        Set-Item -Path "Env:$name" -Value $value
    }
}

# Lancer le worker (foreground, l'utilisateur voit les logs en live)
npm run dev
