# Outlook Generator + Telegram Bot

Outlook Account Generator dengan kontrol via Telegram Bot.

## Quick Install di VPS

```bash
cd /root
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git outlook-gen
cd outlook-gen/outlook_gen
pip3 install -r requirements.txt
```

## Install Chrome Driver (Linux)

```bash
sudo apt update
sudo apt install -y chromium-chromedriver
```

## Konfigurasi

Edit `config.json`:
- `providers`: pilih `anycaptcha` atau `twocaptcha`
- `api_key`: masukkan API key captcha solver
- `Domain`: pilih `@hotmail.com` atau `@outlook.com`

Tambahkan proxy ke `proxy.txt` (format: `ip:port` atau `user:pass@ip:port`)

## Jalankan Manual

```bash
python3 main.py
```

## Jalankan via Telegram Bot

```bash
python3 telegram_bot.py
```

## Telegram Bot Commands

- `/start` - Menu utama
- `/generate [jumlah]` - Generate email
- `/status` - Status generator
- `/accounts` - List akun yang sudah digenerate
- `/config` - Lihat/edit config
- `/proxy` - Manage proxy list

## Original Credit

Based on [MatrixTM/OutlookGen](https://github.com/MatrixTM/OutlookGen)
