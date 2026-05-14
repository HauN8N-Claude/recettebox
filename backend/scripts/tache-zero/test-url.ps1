# =============================================================================
# Tâche zéro — Test une URL Insta/TikTok sur Apify + ScrapeCreators
# =============================================================================
# Usage : .\test-url.ps1 -Url "https://www.instagram.com/reel/XXXX/"
#
# Charge les clés depuis ../../.env.tache-zero.local
# Détecte automatiquement Insta vs TikTok
# Appelle les 2 providers en séquence
# Sauve les réponses JSON brutes dans ./results/
# Affiche un résumé comparatif coloré pour remplir SCORING.md
# =============================================================================

param(
    [Parameter(Mandatory = $true, HelpMessage = "URL Instagram ou TikTok à tester")]
    [string]$Url
)

$ErrorActionPreference = "Stop"

# ----- 1. Charger les variables d'env depuis .env.tache-zero.local ----------
$envFile = Join-Path $PSScriptRoot "..\..\.env.tache-zero.local"
if (-not (Test-Path $envFile)) {
    Write-Host "[ERREUR] Fichier .env.tache-zero.local introuvable :" -ForegroundColor Red
    Write-Host "         $envFile" -ForegroundColor Red
    exit 1
}

Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line.Length -eq 0 -or $line.StartsWith("#")) { return }
    $eq = $line.IndexOf("=")
    if ($eq -lt 1) { return }
    $key = $line.Substring(0, $eq).Trim()
    $value = $line.Substring($eq + 1).Trim()
    Set-Item -Path "env:$key" -Value $value
}

if (-not $env:APIFY_TOKEN -or $env:APIFY_TOKEN.StartsWith("COLLE_")) {
    Write-Host "[ERREUR] APIFY_TOKEN non renseigne dans .env.tache-zero.local" -ForegroundColor Red
    exit 1
}
if (-not $env:SCRAPECREATORS_API_KEY -or $env:SCRAPECREATORS_API_KEY.StartsWith("COLLE_")) {
    Write-Host "[ERREUR] SCRAPECREATORS_API_KEY non renseigne dans .env.tache-zero.local" -ForegroundColor Red
    exit 1
}

# ----- 2. Détecter plateforme ------------------------------------------------
$platform = if ($Url -match "tiktok\.com") { "tiktok" }
            elseif ($Url -match "instagram\.com") { "instagram" }
            else {
                Write-Host "[ERREUR] URL non reconnue (ni Instagram, ni TikTok) : $Url" -ForegroundColor Red
                exit 1
            }

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host " URL        : $Url" -ForegroundColor Cyan
Write-Host " Plateforme : $platform" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

# Dossier resultats
$resultsDir = Join-Path $PSScriptRoot "results"
if (-not (Test-Path $resultsDir)) { New-Item -ItemType Directory -Path $resultsDir | Out-Null }

# Slug pour le nom de fichier
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$rawSlug = ($Url -replace "[^a-zA-Z0-9]", "_")
$slugLen = [Math]::Min(40, $rawSlug.Length)
$urlSlug = $rawSlug.Substring(0, $slugLen)

# ----- 3. Helper : appel mesuré ---------------------------------------------
function Invoke-Provider {
    param([string]$Name, [scriptblock]$Block)
    Write-Host "[->] $Name ..." -ForegroundColor Yellow -NoNewline
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $result = & $Block
        $sw.Stop()
        Write-Host " OK ($($sw.ElapsedMilliseconds) ms)" -ForegroundColor Green
        return @{ Success = $true; Latency = $sw.ElapsedMilliseconds; Data = $result; Error = $null }
    }
    catch {
        $sw.Stop()
        Write-Host " ERREUR ($($sw.ElapsedMilliseconds) ms)" -ForegroundColor Red
        Write-Host "      $($_.Exception.Message)" -ForegroundColor Red
        return @{ Success = $false; Latency = $sw.ElapsedMilliseconds; Data = $null; Error = $_.Exception.Message }
    }
}

# ----- 4. APIFY --------------------------------------------------------------
$apifyResult = if ($platform -eq "instagram") {
    Invoke-Provider "Apify Instagram (apify/instagram-post-scraper)" {
        $body = @{
            username        = @($Url)
            resultsLimit    = 1
            dataDetailLevel = "detailedData"
        } | ConvertTo-Json -Compress
        $apifyUrl = "https://api.apify.com/v2/acts/apify~instagram-post-scraper/run-sync-get-dataset-items?token=$env:APIFY_TOKEN&timeout=120"
        Invoke-RestMethod -Method Post -Uri $apifyUrl -ContentType "application/json" -Body $body
    }
}
else {
    Invoke-Provider "Apify TikTok (clockworks/tiktok-scraper)" {
        # IMPORTANT : pour récupérer une URL .mp4 téléchargeable, clockworks/tiktok-scraper
        # exige shouldDownloadVideos=true (la mp4 transite alors via le storage Apify).
        # Sans ce flag, AUCUNE URL vidéo n'est renvoyée (juste les thumbnails + musique).
        # Idem pour shouldDownloadSlideshowImages pour le Photo Mode.
        $body = @{
            postURLs                       = @($Url)
            resultsPerPage                 = 1
            shouldDownloadVideos           = $true
            shouldDownloadCovers           = $false
            shouldDownloadSlideshowImages  = $true
            shouldDownloadSubtitles        = $false
            shouldDownloadAvatars          = $false
        } | ConvertTo-Json -Compress
        $apifyUrl = "https://api.apify.com/v2/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items?token=$env:APIFY_TOKEN&timeout=120"
        Invoke-RestMethod -Method Post -Uri $apifyUrl -ContentType "application/json" -Body $body
    }
}

# Sauve la réponse brute Apify
$apifyFile = Join-Path $resultsDir "$timestamp-$urlSlug-apify.json"
$apifyResult | ConvertTo-Json -Depth 30 | Set-Content -Path $apifyFile -Encoding utf8

# ----- 5. SCRAPECREATORS -----------------------------------------------------
$scResult = if ($platform -eq "instagram") {
    Invoke-Provider "ScrapeCreators Instagram (v1/instagram/post)" {
        $encoded = [Uri]::EscapeDataString($Url)
        Invoke-RestMethod -Method Get `
            -Uri "https://api.scrapecreators.com/v1/instagram/post?url=$encoded&trim=true" `
            -Headers @{ "x-api-key" = $env:SCRAPECREATORS_API_KEY }
    }
}
else {
    Invoke-Provider "ScrapeCreators TikTok (v2/tiktok/video)" {
        $encoded = [Uri]::EscapeDataString($Url)
        Invoke-RestMethod -Method Get `
            -Uri "https://api.scrapecreators.com/v2/tiktok/video?url=$encoded&trim=true" `
            -Headers @{ "x-api-key" = $env:SCRAPECREATORS_API_KEY }
    }
}

# Sauve la réponse brute ScrapeCreators
$scFile = Join-Path $resultsDir "$timestamp-$urlSlug-scrapecreators.json"
$scResult | ConvertTo-Json -Depth 30 | Set-Content -Path $scFile -Encoding utf8

# ----- 6. Extraire les champs clés pour comparaison -------------------------
function Get-ApifyInstaSummary {
    param($Result)
    if (-not $Result.Success) { return @{ Status = "ERREUR"; Note = $Result.Error } }
    $data = $Result.Data
    if (-not $data -or @($data).Count -eq 0) { return @{ Status = "VIDE" } }
    $item = @($data)[0]
    $typeName = "$($item.type)"
    $mediaType = switch ($typeName) {
        "Sidecar" { "carousel" }
        "Image"   { "image" }
        "Video"   { "video" }
        default   { $typeName }
    }
    $captionLen = if ($item.caption) { "$($item.caption)".Length } else { 0 }
    $itemsCount = if ($mediaType -eq "carousel" -and $item.images) { @($item.images).Count } else { 1 }
    $hasUrl = ($item.videoUrl -or $item.displayUrl) -as [bool]
    return @{
        Status     = "OK"
        MediaType  = $mediaType
        Items      = "$itemsCount"
        CaptionLen = "$captionLen"
        DirectUrl  = if ($hasUrl) { "oui" } else { "non" }
        Author     = "$($item.ownerUsername)"
        PostedAt   = "$($item.timestamp)"
        Latency    = "$($Result.Latency) ms"
    }
}

function Get-ApifyTikTokSummary {
    param($Result)
    if (-not $Result.Success) { return @{ Status = "ERREUR"; Note = $Result.Error } }
    $data = $Result.Data
    if (-not $data -or @($data).Count -eq 0) { return @{ Status = "VIDE" } }
    $item = @($data)[0]
    $isSlideshow = [bool]$item.isSlideshow
    $mediaType = if ($isSlideshow) { "carousel" } else { "video" }
    $captionLen = if ($item.text) { "$($item.text)".Length } else { 0 }
    $itemsCount = if ($isSlideshow -and $item.slideshowImageLinks) { @($item.slideshowImageLinks).Count } else { 1 }
    # URLs téléchargeables : mediaUrls[] (storage Apify) ou videoMeta.downloadAddr (CDN direct)
    # ou slideshowImageLinks[].downloadLink pour Photo Mode
    $hasMediaUrl = $item.mediaUrls -and (@($item.mediaUrls).Count -gt 0)
    $hasDownloadAddr = [bool]$item.videoMeta.downloadAddr
    $hasSlideshow = $isSlideshow -and $item.slideshowImageLinks -and (@($item.slideshowImageLinks).Count -gt 0)
    $hasUrl = ($hasMediaUrl -or $hasDownloadAddr -or $hasSlideshow)
    return @{
        Status     = "OK"
        MediaType  = $mediaType
        Items      = "$itemsCount"
        CaptionLen = "$captionLen"
        DirectUrl  = if ($hasUrl) { "oui" } else { "non" }
        Author     = "$($item.authorMeta.name)"
        PostedAt   = "$($item.createTimeISO)"
        Latency    = "$($Result.Latency) ms"
    }
}

function Get-ScInstaSummary {
    param($Result)
    if (-not $Result.Success) { return @{ Status = "ERREUR"; Note = $Result.Error } }
    # ScrapeCreators peut renvoyer soit { xdt_shortcode_media: ... } direct,
    # soit { data: { xdt_shortcode_media: ... } } selon la version d'API.
    $media = $null
    if ($Result.Data.xdt_shortcode_media) { $media = $Result.Data.xdt_shortcode_media }
    elseif ($Result.Data.data.xdt_shortcode_media) { $media = $Result.Data.data.xdt_shortcode_media }
    if (-not $media) { return @{ Status = "VIDE" } }
    $typeName = "$($media.__typename)"
    $mediaType = switch ($typeName) {
        "XDTGraphSidecar" { "carousel" }
        "XDTGraphImage"   { "image" }
        "XDTGraphVideo"   { "video" }
        default           { $typeName }
    }
    $captionText = ""
    if ($media.edge_media_to_caption.edges -and @($media.edge_media_to_caption.edges).Count -gt 0) {
        $captionText = "$(@($media.edge_media_to_caption.edges)[0].node.text)"
    }
    $captionLen = $captionText.Length
    $itemsCount = if ($mediaType -eq "carousel" -and $media.edge_sidecar_to_children.edges) {
        @($media.edge_sidecar_to_children.edges).Count
    } else { 1 }
    $hasUrl = ($media.video_url -or $media.display_url) -as [bool]
    $postedAt = if ($media.taken_at_timestamp) {
        (Get-Date "1970-01-01Z").AddSeconds([double]$media.taken_at_timestamp).ToString("o")
    } else { "" }
    return @{
        Status     = "OK"
        MediaType  = $mediaType
        Items      = "$itemsCount"
        CaptionLen = "$captionLen"
        DirectUrl  = if ($hasUrl) { "oui" } else { "non" }
        Author     = "$($media.owner.username)"
        PostedAt   = $postedAt
        Latency    = "$($Result.Latency) ms"
    }
}

function Get-ScTikTokSummary {
    param($Result)
    if (-not $Result.Success) { return @{ Status = "ERREUR"; Note = $Result.Error } }
    # ScrapeCreators peut renvoyer soit { aweme_detail: ... } direct,
    # soit { data: { aweme_detail: ... } } selon la version d'API.
    $detail = $null
    if ($Result.Data.aweme_detail) { $detail = $Result.Data.aweme_detail }
    elseif ($Result.Data.data.aweme_detail) { $detail = $Result.Data.data.aweme_detail }
    if (-not $detail) { return @{ Status = "VIDE" } }
    $isSlideshow = ($null -ne $detail.image_post_info) -and ($detail.image_post_info.images)
    $mediaType = if ($isSlideshow) { "carousel" } else { "video" }
    $captionLen = if ($detail.desc) { "$($detail.desc)".Length } else { 0 }
    $itemsCount = if ($isSlideshow) { @($detail.image_post_info.images).Count } else { 1 }
    $videoOk = $false
    if ($detail.video.play_addr.url_list -and @($detail.video.play_addr.url_list).Count -gt 0) { $videoOk = $true }
    $hasUrl = ($videoOk -or $isSlideshow) -as [bool]
    $postedAt = if ($detail.create_time) {
        (Get-Date "1970-01-01Z").AddSeconds([double]$detail.create_time).ToString("o")
    } else { "" }
    return @{
        Status     = "OK"
        MediaType  = $mediaType
        Items      = "$itemsCount"
        CaptionLen = "$captionLen"
        DirectUrl  = if ($hasUrl) { "oui" } else { "non" }
        Author     = "$($detail.author.unique_id)"
        PostedAt   = $postedAt
        Latency    = "$($Result.Latency) ms"
    }
}

$apifySummary = if ($platform -eq "instagram") {
    Get-ApifyInstaSummary $apifyResult
} else {
    Get-ApifyTikTokSummary $apifyResult
}
$scSummary = if ($platform -eq "instagram") {
    Get-ScInstaSummary $scResult
} else {
    Get-ScTikTokSummary $scResult
}

# ----- 7. Affichage tableau comparatif --------------------------------------
Write-Host ""
Write-Host "=== Resume comparatif ===" -ForegroundColor Magenta
Write-Host ""
$fmt = "{0,-18} {1,-30} {2,-30}"
Write-Host ($fmt -f "Champ", "Apify", "ScrapeCreators") -ForegroundColor White
Write-Host ($fmt -f "-----", "-----", "--------------")
foreach ($key in @("Status", "MediaType", "Items", "CaptionLen", "DirectUrl", "Author", "PostedAt", "Latency", "Note")) {
    $a = if ($apifySummary.ContainsKey($key)) { "$($apifySummary[$key])" } else { "-" }
    $s = if ($scSummary.ContainsKey($key)) { "$($scSummary[$key])" } else { "-" }
    Write-Host ($fmt -f $key, $a, $s)
}

Write-Host ""
Write-Host "Reponses JSON brutes sauvegardees :"
Write-Host "  - Apify         : $apifyFile" -ForegroundColor Gray
Write-Host "  - ScrapeCreators: $scFile" -ForegroundColor Gray
Write-Host ""
Write-Host "Reporte les resultats dans : scripts\tache-zero\SCORING.md" -ForegroundColor Cyan
Write-Host ""
