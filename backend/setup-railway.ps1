# =============================================================================
# RecetteBox - Deploiement Railway automatise
# =============================================================================
# 1. Installe Railway CLI si absent
# 2. Te logge sur Railway (ouvre le navigateur 1 fois)
# 3. Cree le projet Railway "recettebox-worker"
# 4. Pousse tes 5 cles API depuis worker/.env.local vers Railway
# 5. Lance le deploiement (build Docker avec ffmpeg)
# 6. Genere un domaine public
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
$EnvLocal  = Join-Path $WorkerDir ".env.local"

if (-not (Test-Path $WorkerDir)) {
    Write-Err "Dossier worker/ introuvable"
    exit 1
}
if (-not (Test-Path $EnvLocal)) {
    Write-Err ".env.local introuvable. Lance setup-worker-local.ps1 d'abord."
    exit 1
}

Set-Location $WorkerDir
Write-Host "Working directory : $WorkerDir"

# -----------------------------------------------------------------------------
# Etape 1 : installer Railway CLI
# -----------------------------------------------------------------------------
Write-Step "Verification de Railway CLI"
$railwayCmd = Get-Command railway -ErrorAction SilentlyContinue
if (-not $railwayCmd) {
    Write-Warn "Railway CLI absent, installation via npm..."
    npm install -g @railway/cli
    Assert-Success "npm install -g @railway/cli"

    # Rafraichir PATH dans la session
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "User") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "Machine")
    Write-Ok "Railway CLI installe"
} else {
    Write-Ok "Railway CLI deja present"
}

# -----------------------------------------------------------------------------
# Etape 2 : login Railway
# -----------------------------------------------------------------------------
Write-Step "Login Railway"
Write-Host "    Le navigateur va s'ouvrir."
Write-Host "    Suis les instructions a l'ecran (Authorize)."

railway login
Assert-Success "railway login"
Write-Ok "Login OK"

# -----------------------------------------------------------------------------
# Etape 3 : initialiser le projet Railway
# -----------------------------------------------------------------------------
Write-Step "Creation du projet Railway"

# Si deja lie, on saute (.railway/ existe)
$railwayDir = Join-Path $WorkerDir ".railway"
if (Test-Path $railwayDir) {
    Write-Ok "Projet deja lie (.railway/ existe)"
} else {
    Write-Host "    Si le CLI te pose des questions :"
    Write-Host "    - Project name : tape ENTREE pour accepter 'recettebox-worker'"
    Write-Host "    - Type         : choisis 'Empty Project' (fleches + ENTREE)"
    Write-Host ""

    railway init --name "recettebox-worker"
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "railway init avec --name a echoue, tentative en mode interactif..."
        railway init
        Assert-Success "railway init"
    }
    Write-Ok "Projet cree"
}

# -----------------------------------------------------------------------------
# Etape 3.5 : creer le service "worker"
# -----------------------------------------------------------------------------
Write-Step "Creation du service 'worker'"
Write-Host "    Un projet Railway contient des services. On en cree un nomme 'worker'."

# Si un service existe deja, on ne le recree pas
$serviceList = railway service 2>&1 | Out-String
if ($serviceList -match "worker") {
    Write-Ok "Service 'worker' existe deja"
} else {
    railway add --service worker
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "railway add a echoue. On va essayer de continuer (le service peut deja exister)."
    } else {
        Write-Ok "Service 'worker' cree"
    }
}

# Lier la session au service worker
Write-Step "Liaison au service 'worker'"
railway link --service worker 2>&1 | Out-Null
Write-Ok "Service lie"

# -----------------------------------------------------------------------------
# Etape 4 : pousser les variables d'env
# -----------------------------------------------------------------------------
Write-Step "Configuration des variables d'environnement"

$envContent = Get-Content $EnvLocal
$varsSet = 0
$varsSkipped = 0
$varsErrored = 0

foreach ($line in $envContent) {
    # Ignore les commentaires et lignes vides
    if ($line -match "^\s*#" -or [string]::IsNullOrWhiteSpace($line)) { continue }

    if ($line -match "^([A-Z_]+)\s*=\s*(.+)$") {
        $key = $Matches[1]
        $val = $Matches[2]

        # Retirer commentaire inline + trim
        $val = $val -replace '\s+#.*$', ''
        $val = $val.Trim('"').Trim("'").Trim()

        # Skip si vide ou placeholder
        if ($val -eq "" -or $val -match "\.\.\.$" -or $val -match "YOUR-") {
            Write-Host "    SKIP $key (vide ou placeholder)"
            $varsSkipped++
            continue
        }

        Write-Host "    Setting $key..."
        # On laisse stdout/stderr visibles pour diagnostiquer si erreur
        railway variables --set "$key=$val" --service worker
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "Echec de set $key (continue quand meme)"
            $varsErrored++
        } else {
            $varsSet++
        }
    }
}

if ($varsErrored -gt 0) {
    Write-Warn "$varsErrored variable(s) n'ont pas pu etre poussees."
    Write-Warn "Tu pourras les ajouter manuellement via le dashboard Railway."
}
Write-Ok "$varsSet variables poussees, $varsSkipped placeholders ignores, $varsErrored erreurs"

# -----------------------------------------------------------------------------
# Etape 5 : deploiement
# -----------------------------------------------------------------------------
Write-Step "Deploiement (build Docker + push)"
Write-Host "    Premier deploy : ~5-10 minutes (build de l'image Docker avec ffmpeg)"
Write-Host "    Les logs vont defiler."
Write-Host ""

railway up --detach --service worker
Assert-Success "railway up"
Write-Ok "Deploiement lance en arriere-plan"

# -----------------------------------------------------------------------------
# Etape 6 : generer un domaine public
# -----------------------------------------------------------------------------
Write-Step "Generation d'un domaine public"
railway domain
if ($LASTEXITCODE -ne 0) {
    Write-Warn "Domaine non genere automatiquement, tu pourras le faire via le dashboard."
} else {
    Write-Ok "Domaine genere (voir au-dessus)"
}

# -----------------------------------------------------------------------------
# Recap
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " DEPLOIEMENT LANCE SUR RAILWAY" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Le build Docker prend ~5-10 minutes la premiere fois."
Write-Host ""
Write-Host "Commandes utiles :"
Write-Host "  railway logs            -> suivre les logs en live"
Write-Host "  railway status          -> etat du deploiement"
Write-Host "  railway open            -> ouvrir le dashboard Railway"
Write-Host "  railway domain          -> voir/regenerer le domaine public"
Write-Host ""
Write-Host "Quand le deploiement est termine, tu dois voir dans 'railway logs' :"
Write-Host '  "Worker starting"' -ForegroundColor Cyan
Write-Host '  "Realtime channel status SUBSCRIBED"' -ForegroundColor Cyan
Write-Host '  "Healthcheck listening"' -ForegroundColor Cyan
Write-Host ""
Write-Host "(les memes 3 lignes qu'en local !)"
Write-Host ""
