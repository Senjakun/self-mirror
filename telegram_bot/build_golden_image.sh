#!/bin/bash

# Build Golden Image Script
# Jalankan di VPS Tumbal untuk membuat golden image Windows
# Usage: bash build_golden_image.sh [WIN_CODE] [IMAGE_NAME] [CUSTOM_ISO_URL]
# 
# Now with BUILT-IN ISO URLs from massgrave.dev!
# No more manual ISO hunting for standard Windows versions

WIN_CODE=${1:-"10"}
IMAGE_NAME=${2:-"win10-golden"}
CUSTOM_ISO_URL=${3:-""}
WORK_DIR="/root/golden-build"
OUTPUT_DIR="/root/rdp-images"

# Windows versions
declare -A WIN_NAMES
WIN_NAMES["2019"]="Windows Server 2019"
WIN_NAMES["2022"]="Windows Server 2022"
WIN_NAMES["2025"]="Windows Server 2025"
WIN_NAMES["10ltsc"]="Windows 10 LTSC 2021"
WIN_NAMES["10iot"]="Windows 10 IoT Enterprise LTSC"
WIN_NAMES["11ltsc"]="Windows 11 LTSC 2024"
WIN_NAMES["11iot"]="Windows 11 IoT Enterprise LTSC"
WIN_NAMES["10pro"]="Windows 10 Pro"
WIN_NAMES["11pro"]="Windows 11 Pro"
WIN_NAMES["10atlas"]="Windows 10 Atlas"
WIN_NAMES["11atlas"]="Windows 11 Atlas"
WIN_NAMES["tiny10"]="Tiny10 23H1"
WIN_NAMES["tiny11"]="Tiny11 24H2"

# Built-in ISO URLs (verified working direct links)
declare -A ISO_URLS

# Windows 10 LTSC 2021 (Enterprise, stable, 10-year support) - massgrave.dev
ISO_URLS["10ltsc"]="https://drive.massgrave.dev/en-us_windows_10_enterprise_ltsc_2021_x64_dvd_d289cf96.iso"
# Windows 10 IoT Enterprise LTSC 2021 (includes Enterprise + IoT editions)
ISO_URLS["10iot"]="https://drive.massgrave.dev/en-us_windows_10_iot_enterprise_ltsc_2021_x64_dvd_257ad90f.iso"
# Windows 11 LTSC 2024 (Enterprise, latest)
ISO_URLS["11ltsc"]="https://drive.massgrave.dev/en-us_windows_11_enterprise_ltsc_2024_x64_dvd_965cfb00.iso"
# Windows 11 IoT Enterprise LTSC 2024 (no TPM required, 10-year support)
ISO_URLS["11iot"]="https://drive.massgrave.dev/en-us_windows_11_iot_enterprise_ltsc_2024_x64_dvd_f6b14814.iso"
# Windows 10/11 Pro - Microsoft direct download
ISO_URLS["10pro"]="https://software.download.prss.microsoft.com/dbazure/Win10_22H2_English_x64v1.iso"
ISO_URLS["11pro"]="https://software.download.prss.microsoft.com/dbazure/Win11_24H2_English_x64.iso"
# Server editions from evaluation center
ISO_URLS["2019"]="eval"
ISO_URLS["2022"]="eval"
ISO_URLS["2025"]="eval"

# Tiny10/11 from archive.org (NTDEV official uploads)
ISO_URLS["tiny10"]="https://archive.org/download/tiny-10_202301/tiny10%2023h1%20x64.iso"
ISO_URLS["tiny11"]="https://archive.org/download/tiny-11-24-h-2-x-64-26100.1742/tiny11%2024H2%20x64%20-%2026100.1742.iso"

# Atlas OS - NOTE: Atlas tidak menyediakan ISO!
# Atlas adalah script untuk modifikasi Windows yang sudah terinstall
# Gunakan Windows 10/11 LTSC lalu apply Atlas Playbook via AME Wizard
ISO_URLS["10atlas"]="USE_LTSC_THEN_APPLY_ATLAS"
ISO_URLS["11atlas"]="USE_LTSC_THEN_APPLY_ATLAS"

# Validate WIN_CODE
if [ -z "${WIN_NAMES[$WIN_CODE]}" ]; then
    echo "❌ WIN_CODE tidak valid: $WIN_CODE"
    echo ""
    echo "📦 Tersedia dengan AUTO-DOWNLOAD (dari massgrave.dev):"
    echo "   10ltsc  - Windows 10 LTSC 2021 (Recommended!)"
    echo "   10iot   - Windows 10 IoT Enterprise LTSC"
    echo "   11ltsc  - Windows 11 LTSC 2024"
    echo "   11iot   - Windows 11 IoT Enterprise LTSC (no TPM)"
    echo "   10pro   - Windows 10 Pro 22H2"
    echo "   11pro   - Windows 11 Pro 24H2"
    echo ""
    echo "🔧 Perlu Custom ISO URL:"
    echo "   10atlas, 11atlas, tiny10, tiny11"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
apt-get update -qq
apt-get install -y qemu-kvm qemu-utils libvirt-daemon-system virtinst \
    bridge-utils cpu-checker wget curl gzip pigz > /dev/null 2>&1

# Check KVM support
if ! kvm-ok 2>/dev/null | grep -q "can be used"; then
    echo "⚠️ KVM tidak tersedia, akan menggunakan emulasi (lebih lambat)"
    KVM_FLAG=""
else
    echo "✅ KVM tersedia"
    KVM_FLAG="-enable-kvm"
fi

# Create directories
mkdir -p "$WORK_DIR" "$OUTPUT_DIR"
cd "$WORK_DIR"

# Download Windows ISO
WIN_ISO="$WORK_DIR/windows.iso"
if [ ! -f "$WIN_ISO" ]; then
    
    # Get built-in URL if available
    BUILTIN_URL="${ISO_URLS[$WIN_CODE]}"
    
    # Priority 1: Custom URL provided via argument
    if [ -n "$CUSTOM_ISO_URL" ]; then
        echo "📥 Using custom ISO URL..."
        
        if echo "$CUSTOM_ISO_URL" | grep -q "gdrive:"; then
            echo "   Downloading from GDrive..."
            rclone copy "$CUSTOM_ISO_URL" "$WORK_DIR/" --progress
            find "$WORK_DIR" -name "*.iso" -exec mv {} "$WIN_ISO" \; 2>/dev/null
        else
            wget --progress=bar:force -O "$WIN_ISO" "$CUSTOM_ISO_URL" || {
                echo "❌ Gagal download dari: $CUSTOM_ISO_URL"
                exit 1
            }
        fi
    
    # Priority 2: Built-in URL (massgrave.dev, archive.org, etc)
    elif [ -n "$BUILTIN_URL" ] && [ "$BUILTIN_URL" != "eval" ] && [ "$BUILTIN_URL" != "USE_LTSC_THEN_APPLY_ATLAS" ]; then
        echo "📥 Auto-downloading ${WIN_NAMES[$WIN_CODE]} ISO..."
        
        if echo "$BUILTIN_URL" | grep -q "massgrave.dev"; then
            echo "   Source: massgrave.dev (genuine Microsoft ISOs)"
        elif echo "$BUILTIN_URL" | grep -q "archive.org"; then
            echo "   Source: archive.org (NTDEV Tiny10/11)"
        else
            echo "   Source: $BUILTIN_URL"
        fi
        echo ""
        
        wget --progress=bar:force -O "$WIN_ISO" "$BUILTIN_URL" || {
            echo "❌ Gagal download ISO"
            echo "   Coba lagi nanti atau gunakan custom URL"
            exit 1
        }
    
    # Priority 3: Atlas OS - special handling (use LTSC + apply Atlas playbook)
    elif [ "$BUILTIN_URL" == "USE_LTSC_THEN_APPLY_ATLAS" ]; then
        echo ""
        echo "⚠️ ATLAS OS - PERHATIAN!"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Atlas OS TIDAK menyediakan ISO file!"
        echo "Atlas adalah script untuk modifikasi Windows yang sudah terinstall."
        echo ""
        echo "📝 Cara membuat Atlas Golden Image:"
        echo ""
        echo "1. Build golden image dengan Windows 10/11 LTSC dulu:"
        echo "   bash build_golden_image.sh 10ltsc golden-atlas-base"
        echo ""
        echo "2. Setelah build selesai, deploy ke RDP dan login"
        echo ""
        echo "3. Di dalam Windows RDP, jalankan Atlas Playbook:"
        echo "   - Download: https://github.com/Atlas-OS/Atlas/releases"
        echo "   - Download AME Wizard: https://ameliorated.io/"
        echo "   - Jalankan AME Wizard dan apply Atlas Playbook"
        echo ""
        echo "4. Setelah Atlas terapply, shutdown dan backup image"
        echo ""
        exit 1
    
    # Priority 4: Server evaluation editions (special handling)
    elif [ "$BUILTIN_URL" == "eval" ]; then
        echo "📥 Downloading Windows Server evaluation ISO..."
        echo "   Note: Evaluation = 180 days trial, use MAS to activate"
        echo ""
        
        case "$WIN_CODE" in
            "2019")
                EVAL_URL="https://go.microsoft.com/fwlink/p/?linkid=2195167&clcid=0x409&culture=en-us&country=us"
                ;;
            "2022")
                EVAL_URL="https://go.microsoft.com/fwlink/p/?linkid=2195280&clcid=0x409&culture=en-us&country=us"
                ;;
            "2025")
                EVAL_URL="https://go.microsoft.com/fwlink/p/?linkid=2293205&clcid=0x409&culture=en-us&country=us"
                ;;
        esac
        
        wget --progress=bar:force -O "$WIN_ISO" "$EVAL_URL" || {
            echo "❌ Gagal download Server evaluation ISO"
            echo "   Microsoft mungkin mengubah link, coba custom URL"
            exit 1
        }
    
    # Priority 5: Check GDrive
    else
        GDRIVE_ISO="gdrive:rdp-isos/${WIN_CODE}.iso"
        echo "🔍 Checking GDrive: $GDRIVE_ISO"
        
        if rclone lsf "$GDRIVE_ISO" 2>/dev/null | grep -q ".iso"; then
            echo "✅ Found in GDrive, downloading..."
            rclone copy "$GDRIVE_ISO" "$WORK_DIR/" --progress
            mv "$WORK_DIR/${WIN_CODE}.iso" "$WIN_ISO" 2>/dev/null || true
        fi
    fi
    
    # Final check
    if [ ! -f "$WIN_ISO" ] || [ ! -s "$WIN_ISO" ]; then
        echo ""
        echo "❌ Windows ISO tidak tersedia!"
        echo ""
        echo "🔗 Jalankan ulang dengan custom URL:"
        echo "   bash build_golden_image.sh ${WIN_CODE} ${IMAGE_NAME} 'https://direct-download-url.iso'"
        exit 1
    fi
    
    echo "✅ Windows ISO ready: $(du -h "$WIN_ISO" | cut -f1)"
fi

# Download VirtIO drivers if not exists
VIRTIO_ISO="$WORK_DIR/virtio-win.iso"
if [ ! -f "$VIRTIO_ISO" ]; then
    echo "📥 Downloading VirtIO drivers..."
    wget -q --show-progress -O "$VIRTIO_ISO" "$VIRTIO_URL"
fi

# Create virtual disk
DISK_IMG="$WORK_DIR/disk.qcow2"
DISK_SIZE="25G"

echo "💿 Creating virtual disk ($DISK_SIZE)..."
qemu-img create -f qcow2 "$DISK_IMG" "$DISK_SIZE"

# Create autounattend.xml for unattended installation
cat > "$WORK_DIR/autounattend.xml" << 'AUTOUNATTEND'
<?xml version="1.0" encoding="utf-8"?>
<unattend xmlns="urn:schemas-microsoft-com:unattend">
    <settings pass="windowsPE">
        <component name="Microsoft-Windows-International-Core-WinPE" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS">
            <SetupUILanguage>
                <UILanguage>en-US</UILanguage>
            </SetupUILanguage>
            <InputLocale>en-US</InputLocale>
            <SystemLocale>en-US</SystemLocale>
            <UILanguage>en-US</UILanguage>
            <UserLocale>en-US</UserLocale>
        </component>
        <component name="Microsoft-Windows-Setup" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS">
            <DiskConfiguration>
                <Disk wcm:action="add">
                    <CreatePartitions>
                        <CreatePartition wcm:action="add">
                            <Order>1</Order>
                            <Type>Primary</Type>
                            <Extend>true</Extend>
                        </CreatePartition>
                    </CreatePartitions>
                    <ModifyPartitions>
                        <ModifyPartition wcm:action="add">
                            <Order>1</Order>
                            <PartitionID>1</PartitionID>
                            <Format>NTFS</Format>
                            <Label>Windows</Label>
                            <Letter>C</Letter>
                            <Active>true</Active>
                        </ModifyPartition>
                    </ModifyPartitions>
                    <DiskID>0</DiskID>
                    <WillWipeDisk>true</WillWipeDisk>
                </Disk>
            </DiskConfiguration>
            <ImageInstall>
                <OSImage>
                    <InstallTo>
                        <DiskID>0</DiskID>
                        <PartitionID>1</PartitionID>
                    </InstallTo>
                </OSImage>
            </ImageInstall>
            <UserData>
                <AcceptEula>true</AcceptEula>
                <ProductKey>
                    <WillShowUI>Never</WillShowUI>
                </ProductKey>
            </UserData>
        </component>
    </settings>
    <settings pass="specialize">
        <component name="Microsoft-Windows-Shell-Setup" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS">
            <ComputerName>RDPSERVER</ComputerName>
            <TimeZone>UTC</TimeZone>
        </component>
        <component name="Microsoft-Windows-TerminalServices-LocalSessionManager" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS">
            <fDenyTSConnections>false</fDenyTSConnections>
        </component>
        <component name="Microsoft-Windows-TerminalServices-RDP-WinStationExtensions" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS">
            <UserAuthentication>0</UserAuthentication>
        </component>
        <component name="Networking-MPSSVC-Svc" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS">
            <FirewallGroups>
                <FirewallGroup wcm:action="add" wcm:keyValue="RemoteDesktop">
                    <Active>true</Active>
                    <Group>Remote Desktop</Group>
                    <Profile>all</Profile>
                </FirewallGroup>
            </FirewallGroups>
        </component>
    </settings>
    <settings pass="oobeSystem">
        <component name="Microsoft-Windows-Shell-Setup" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS">
            <OOBE>
                <HideEULAPage>true</HideEULAPage>
                <HideLocalAccountScreen>true</HideLocalAccountScreen>
                <HideOEMRegistrationScreen>true</HideOEMRegistrationScreen>
                <HideOnlineAccountScreens>true</HideOnlineAccountScreens>
                <HideWirelessSetupInOOBE>true</HideWirelessSetupInOOBE>
                <ProtectYourPC>3</ProtectYourPC>
            </OOBE>
            <UserAccounts>
                <AdministratorPassword>
                    <Value>Admin@123</Value>
                    <PlainText>true</PlainText>
                </AdministratorPassword>
                <LocalAccounts>
                    <LocalAccount wcm:action="add">
                        <Password>
                            <Value>Admin@123</Value>
                            <PlainText>true</PlainText>
                        </Password>
                        <DisplayName>Administrator</DisplayName>
                        <Group>Administrators</Group>
                        <Name>Admin</Name>
                    </LocalAccount>
                </LocalAccounts>
            </UserAccounts>
            <AutoLogon>
                <Password>
                    <Value>Admin@123</Value>
                    <PlainText>true</PlainText>
                </Password>
                <Enabled>true</Enabled>
                <Username>Admin</Username>
            </AutoLogon>
            <FirstLogonCommands>
                <SynchronousCommand wcm:action="add">
                    <Order>1</Order>
                    <CommandLine>powershell -Command "Enable-NetFirewallRule -DisplayGroup 'Remote Desktop'"</CommandLine>
                </SynchronousCommand>
                <SynchronousCommand wcm:action="add">
                    <Order>2</Order>
                    <CommandLine>powershell -Command "Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -Name 'fDenyTSConnections' -Value 0"</CommandLine>
                </SynchronousCommand>
                <SynchronousCommand wcm:action="add">
                    <Order>3</Order>
                    <CommandLine>powershell -Command "Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp' -Name 'UserAuthentication' -Value 0"</CommandLine>
                </SynchronousCommand>
            </FirstLogonCommands>
        </component>
    </settings>
</unattend>
AUTOUNATTEND

# Create floppy image with autounattend
echo "📝 Creating autounattend floppy..."
dd if=/dev/zero of="$WORK_DIR/floppy.img" bs=1440K count=1 2>/dev/null
mkfs.msdos "$WORK_DIR/floppy.img" > /dev/null 2>&1
mkdir -p /mnt/floppy
mount -o loop "$WORK_DIR/floppy.img" /mnt/floppy
cp "$WORK_DIR/autounattend.xml" /mnt/floppy/
umount /mnt/floppy

echo ""
echo "🚀 Starting Windows installation..."
echo "⏳ Ini akan memakan waktu 20-40 menit..."
echo ""

# Run QEMU for installation
qemu-system-x86_64 \
    $KVM_FLAG \
    -m 4096 \
    -smp 2 \
    -cpu host \
    -drive file="$DISK_IMG",format=qcow2,if=virtio \
    -drive file="$WIN_ISO",media=cdrom \
    -drive file="$VIRTIO_ISO",media=cdrom \
    -drive file="$WORK_DIR/floppy.img",format=raw,if=floppy \
    -boot d \
    -vga std \
    -net nic,model=virtio \
    -net user \
    -vnc :0 \
    -daemonize

QEMU_PID=$!

echo "📺 VNC tersedia di port 5900"
echo "⏳ Menunggu instalasi selesai..."
echo ""
echo "💡 Tips: Gunakan VNC viewer untuk monitor progress"
echo "   - Alamat: $(hostname -I | awk '{print $1}'):5900"
echo ""

# Wait for installation (check if QEMU is still running)
echo "⏳ Menunggu instalasi selesai (auto-detect shutdown)..."
while pgrep -x qemu-system-x86_64 > /dev/null; do
    sleep 30
    echo "   ... masih berjalan"
done

echo ""
echo "✅ Instalasi Windows selesai!"
echo ""

# Convert to raw image for faster deployment
echo "🔄 Converting to raw image..."
RAW_IMG="$OUTPUT_DIR/${IMAGE_NAME}.img"
qemu-img convert -f qcow2 -O raw "$DISK_IMG" "$RAW_IMG"

# Compress the image
echo "📦 Compressing image..."
pigz -k -f "$RAW_IMG"
COMPRESSED_IMG="${RAW_IMG}.gz"

# Get file sizes
RAW_SIZE=$(du -h "$RAW_IMG" | cut -f1)
COMPRESSED_SIZE=$(du -h "$COMPRESSED_IMG" | cut -f1)

echo ""
echo "================================================"
echo "✅ BUILD COMPLETE!"
echo "================================================"
echo "📁 Raw Image: $RAW_IMG ($RAW_SIZE)"
echo "📦 Compressed: $COMPRESSED_IMG ($COMPRESSED_SIZE)"
echo ""
echo "🔐 Default Credentials:"
echo "   Username: Admin"
echo "   Password: Admin@123"
echo ""
echo "📤 Upload ke GDrive dengan:"
echo "   rclone copy $COMPRESSED_IMG gdrive:rdp-images/"
echo ""
echo "================================================"
