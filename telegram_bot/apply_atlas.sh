#!/bin/bash

# Apply Atlas OS Playbook to Windows RDP
# Usage: bash apply_atlas.sh [IP] [PASSWORD] [CHAT_ID] [BOT_TOKEN]

IP=$1
PASSWORD=$2
CHAT_ID=$3
BOT_TOKEN=$4

send_telegram() {
    local message="$1"
    if [ -n "$BOT_TOKEN" ] && [ -n "$CHAT_ID" ]; then
        curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
            -d chat_id="$CHAT_ID" \
            -d text="$message" \
            -d parse_mode="HTML" > /dev/null 2>&1
    fi
}

# Validasi
if [ -z "$IP" ] || [ -z "$PASSWORD" ]; then
    echo "Error: IP dan PASSWORD harus diisi"
    exit 1
fi

echo "================================================"
echo "🎯 Atlas OS Applicator"
echo "📍 IP: $IP"
echo "================================================"

# Install sshpass jika belum ada
apt-get install -y sshpass > /dev/null 2>&1

# Test koneksi SSH (Windows OpenSSH)
echo "🔌 Testing koneksi ke Windows RDP..."

# Tunggu Windows siap (max 10 menit)
MAX_WAIT=600
WAITED=0
INTERVAL=30

while [ $WAITED -lt $MAX_WAIT ]; do
    if sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -o BatchMode=no "Administrator@$IP" "echo connected" 2>/dev/null; then
        echo "✅ Windows RDP terhubung!"
        break
    fi
    echo "⏳ Menunggu Windows ready... ($WAITED/$MAX_WAIT detik)"
    sleep $INTERVAL
    WAITED=$((WAITED + INTERVAL))
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo "❌ Timeout menunggu Windows"
    send_telegram "❌ <b>ATLAS GAGAL!</b>

📍 <b>IP:</b> <code>$IP</code>

<b>Penyebab:</b> Windows RDP tidak bisa diakses via SSH

<b>Solusi:</b>
1. Pastikan RDP sudah selesai install
2. Pastikan OpenSSH Server aktif di Windows
3. Coba apply Atlas manual via RDP"
    exit 1
fi

send_telegram "🎯 <b>MEMULAI ATLAS OS</b>

📍 <b>IP:</b> <code>$IP</code>

⏳ Downloading AME Wizard & Atlas Playbook...
⏱ Estimasi: 15-30 menit

💡 Windows akan restart beberapa kali."

# Download dan jalankan Atlas Playbook
echo "📥 Downloading Atlas tools..."

sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "Administrator@$IP" << 'WINSCRIPT'
# PowerShell script to apply Atlas OS

# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# Create temp directory
$tempDir = "$env:TEMP\AtlasOS"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
Set-Location $tempDir

Write-Host "📥 Downloading AME Wizard..."

# Download AME Wizard
$ameUrl = "https://download.ameliorated.io/AME%20Wizard%20Beta.zip"
$ameZip = "$tempDir\AMEWizard.zip"
$ameDir = "$tempDir\AMEWizard"

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $ameUrl -OutFile $ameZip -UseBasicParsing
    Expand-Archive -Path $ameZip -DestinationPath $ameDir -Force
    Write-Host "✅ AME Wizard downloaded"
} catch {
    Write-Host "❌ Failed to download AME Wizard: $_"
    exit 1
}

Write-Host "📥 Downloading Atlas Playbook..."

# Download Atlas Playbook (latest release)
$atlasApi = "https://api.github.com/repos/Atlas-OS/Atlas/releases/latest"
try {
    $release = Invoke-RestMethod -Uri $atlasApi -UseBasicParsing
    $playbookAsset = $release.assets | Where-Object { $_.name -like "*.apbx" } | Select-Object -First 1
    
    if ($playbookAsset) {
        $playbookUrl = $playbookAsset.browser_download_url
        $playbookFile = "$tempDir\Atlas.apbx"
        Invoke-WebRequest -Uri $playbookUrl -OutFile $playbookFile -UseBasicParsing
        Write-Host "✅ Atlas Playbook downloaded: $($playbookAsset.name)"
    } else {
        Write-Host "❌ No .apbx file found in latest release"
        exit 1
    }
} catch {
    Write-Host "❌ Failed to download Atlas Playbook: $_"
    exit 1
}

Write-Host "🔧 Preparing AME Wizard..."

# Find AME Wizard executable
$ameExe = Get-ChildItem -Path $ameDir -Filter "AME*.exe" -Recurse | Select-Object -First 1

if (-not $ameExe) {
    Write-Host "❌ AME Wizard executable not found"
    exit 1
}

Write-Host "✅ Found: $($ameExe.FullName)"

# Create startup script to run AME Wizard with playbook
$startupScript = @"
Start-Sleep -Seconds 30

# Start AME Wizard with playbook
`$ameExe = "$($ameExe.FullName)"
`$playbook = "$playbookFile"

Write-Host "Starting AME Wizard with Atlas Playbook..."
Start-Process -FilePath `$ameExe -ArgumentList "`$playbook" -Wait

# Cleanup after completion
Remove-Item -Path "$tempDir" -Recurse -Force -ErrorAction SilentlyContinue
"@

$startupPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\ApplyAtlas.ps1"
$startupScript | Out-File -FilePath $startupPath -Encoding UTF8 -Force

Write-Host "✅ Startup script created"
Write-Host ""
Write-Host "================================================"
Write-Host "🎯 ATLAS OS READY TO APPLY"
Write-Host "================================================"
Write-Host ""
Write-Host "AME Wizard dan Atlas Playbook sudah di-download."
Write-Host ""
Write-Host "LANGKAH SELANJUTNYA:"
Write-Host "1. Connect ke RDP: $env:COMPUTERNAME"
Write-Host "2. Jalankan: $($ameExe.FullName)"
Write-Host "3. Drag & drop Atlas.apbx ke AME Wizard"
Write-Host "4. Ikuti instruksi di layar"
Write-Host ""
Write-Host "Atau restart Windows untuk auto-run."
Write-Host "================================================"

# Write marker file
"ATLAS_READY" | Out-File -FilePath "$tempDir\atlas_ready.txt" -Encoding UTF8

exit 0
WINSCRIPT

RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo "✅ Atlas tools downloaded!"
    send_telegram "✅ <b>ATLAS TOOLS READY!</b>
━━━━━━━━━━━━━━━━━━

📍 <b>IP:</b> <code>$IP</code>

<b>AME Wizard & Atlas Playbook sudah di-download.</b>

<b>Cara Apply Atlas:</b>
1️⃣ Connect ke RDP: <code>$IP:3389</code>
   User: <code>Administrator</code>
   Pass: <code>$PASSWORD</code>

2️⃣ Buka folder: <code>%TEMP%\AtlasOS</code>

3️⃣ Jalankan <code>AME Wizard</code>

4️⃣ Drag & drop <code>Atlas.apbx</code> ke window

5️⃣ Ikuti instruksi (Windows akan restart)

⏱ Proses apply: ~15-20 menit

💡 Setelah selesai, buat Golden Image baru untuk menyimpan."
    exit 0
else
    send_telegram "⚠️ <b>ATLAS PARTIAL</b>

📍 <b>IP:</b> <code>$IP</code>

Download tools mungkin gagal sebagian.

<b>Cara Manual:</b>
1. RDP ke Windows
2. Download AME Wizard: https://ameliorated.io
3. Download Atlas: https://atlasos.net
4. Jalankan AME Wizard, drag Atlas.apbx"
    exit 1
fi
