# =============================================================================
# RecetteBox - Setup Supabase automatise
# =============================================================================
# 1. Telecharge la CLI Supabase dans .bin/ (pas besoin de droits admin)
# 2. Te logge sur Supabase (ouvre ton navigateur 1 fois)
# 3. Lie le projet local au projet distant
# 4. Pousse les 3 migrations SQL
# 5. Deploie l'Edge Function imports
# =============================================================================

# IMPORTANT : pas de $ErrorActionPreference = "Stop" global, car PowerShell 5.1
# traite a tort certaines sorties stderr de supabase.exe comme des erreurs.
# On verifie les exit codes manuellement.

# Configuration
$ProjectRef = "drymgrccydkntskrpjgu"
$CliVersion = "2.98.2"

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

# Se placer dans le dossier du script
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir
Write-Host "Working directory : $ScriptDir"

# -----------------------------------------------------------------------------
# Etape 1 : installer la CLI Supabase
# -----------------------------------------------------------------------------
$BinDir = Join-Path $ScriptDir ".bin"
$SupabaseExe = Join-Path $BinDir "supabase.exe"

# Si une ancienne version (1.x) est presente, on la supprime pour forcer le re-download
if (Test-Path $SupabaseExe) {
    $sizeKB = [int]((Get-Item $SupabaseExe).Length / 1024)
    if ($sizeKB -lt 5000) {
        Write-Step "Ancienne version detectee, suppression"
        Remove-Item $SupabaseExe -Force
    }
}

if (-not (Test-Path $SupabaseExe)) {
    Write-Step "Telechargement de la CLI Supabase v$CliVersion"

    if (-not (Test-Path $BinDir)) {
        New-Item -ItemType Directory -Path $BinDir | Out-Null
    }

    $arch = if ([Environment]::Is64BitOperatingSystem) { "amd64" } else { "386" }
    $zipUrl = "https://github.com/supabase/cli/releases/download/v$CliVersion/supabase_windows_$arch.tar.gz"
    $tarPath = Join-Path $BinDir "supabase.tar.gz"

    try {
        Invoke-WebRequest -Uri $zipUrl -OutFile $tarPath -UseBasicParsing
        Write-Ok "Archive telechargee"
    } catch {
        Write-Err "Echec du telechargement : $($_.Exception.Message)"
        Write-Warn "URL : $zipUrl"
        exit 1
    }

    Write-Step "Extraction"
    Push-Location $BinDir
    try {
        tar -xzf "supabase.tar.gz"
        Remove-Item "supabase.tar.gz" -Force
    } finally {
        Pop-Location
    }

    if (-not (Test-Path $SupabaseExe)) {
        Write-Err "supabase.exe introuvable apres extraction"
        exit 1
    }

    Write-Ok "CLI installee dans $BinDir"
} else {
    Write-Step "CLI Supabase deja presente"
}

# -----------------------------------------------------------------------------
# Etape 2 : login Supabase
# -----------------------------------------------------------------------------
Write-Step "Login Supabase"
Write-Host "    Le navigateur va s'ouvrir si tu n'es pas deja logge."
Write-Host "    Suis les instructions a l'ecran (Authorize)."

& $SupabaseExe login
if ($LASTEXITCODE -ne 0) {
    # 'supabase login' renvoie 0 si deja logge. Si != 0, vraie erreur.
    Write-Err "Echec du login"
    exit 1
}
Write-Ok "Login OK"

# -----------------------------------------------------------------------------
# Etape 3 : lier le projet
# -----------------------------------------------------------------------------
Write-Step "Liaison au projet distant ($ProjectRef)"
Write-Host "    Si demande, tape ton mot de passe DB."
Write-Host "    Les caracteres ne s'affichent pas pendant la saisie, c'est normal."

& $SupabaseExe link --project-ref $ProjectRef
Assert-Success "supabase link"
Write-Ok "Projet lie"

# -----------------------------------------------------------------------------
# Etape 4 : migrations
# -----------------------------------------------------------------------------
Write-Step "Application des migrations SQL"
Write-Host "    (Schema DB + RLS + Storage bucket)"

& $SupabaseExe db push
Assert-Success "supabase db push"
Write-Ok "Migrations appliquees"

# -----------------------------------------------------------------------------
# Etape 5 : Edge Function
# -----------------------------------------------------------------------------
Write-Step "Deploiement de l'Edge Function 'imports'"

& $SupabaseExe functions deploy imports
Assert-Success "supabase functions deploy"
Write-Ok "Edge Function deployee"

# -----------------------------------------------------------------------------
# Recap
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " SETUP SUPABASE TERMINE" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Recap :"
Write-Host "  - CLI Supabase : $BinDir"
Write-Host "  - Projet lie   : $ProjectRef"
Write-Host "  - Migrations   : OK (3 fichiers)"
Write-Host "  - Edge Function: OK (imports)"
Write-Host ""
Write-Host "URLs utiles :"
Write-Host "  Dashboard     : https://supabase.com/dashboard/project/$ProjectRef"
Write-Host "  Table Editor  : https://supabase.com/dashboard/project/$ProjectRef/editor"
Write-Host "  Storage       : https://supabase.com/dashboard/project/$ProjectRef/storage/buckets"
Write-Host "  API keys      : https://supabase.com/dashboard/project/$ProjectRef/settings/api"
Write-Host ""
Write-Host "Prochaines etapes :"
Write-Host "  1. Verifier dans Table Editor que tu vois bien 9 tables :"
Write-Host "     profiles, subscriptions, recipes, recipe_ingredients,"
Write-Host "     recipe_steps, recipe_media, imports, import_cache, push_tokens"
Write-Host ""
Write-Host "  2. Verifier dans Storage que le bucket 'recipe-media' existe."
Write-Host ""
Write-Host "  3. Reviens dans Claude pour passer a la config du worker Railway."
Write-Host ""
