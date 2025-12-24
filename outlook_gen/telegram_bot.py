#!/usr/bin/env python3
"""
Telegram Bot untuk kontrol OutlookGen
"""

import os
import json
import asyncio
import subprocess
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes

# ================== KONFIGURASI ==================
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")
ADMIN_IDS = [int(x) for x in os.environ.get("ADMIN_IDS", "").split(",") if x]  # Comma-separated admin IDs
WORK_DIR = os.path.dirname(os.path.abspath(__file__))
# =================================================

# Global state
generator_process = None
generated_count = 0
is_running = False

def is_admin(user_id: int) -> bool:
    """Check if user is admin"""
    if not ADMIN_IDS:
        return True  # No restriction if no admin IDs configured
    return user_id in ADMIN_IDS

def load_config() -> dict:
    """Load config.json"""
    config_path = os.path.join(WORK_DIR, "config.json")
    with open(config_path, 'r') as f:
        return json.load(f)

def save_config(config: dict):
    """Save config.json"""
    config_path = os.path.join(WORK_DIR, "config.json")
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)

def get_accounts() -> list:
    """Get generated accounts"""
    accounts_path = os.path.join(WORK_DIR, "account.txt")
    if not os.path.exists(accounts_path):
        return []
    with open(accounts_path, 'r') as f:
        lines = [l.strip() for l in f.readlines() if l.strip() and not l.startswith('#')]
    return lines

def get_proxies() -> list:
    """Get proxy list"""
    proxy_path = os.path.join(WORK_DIR, "proxy.txt")
    if not os.path.exists(proxy_path):
        return []
    with open(proxy_path, 'r') as f:
        lines = [l.strip() for l in f.readlines() if l.strip()]
    return lines

def save_proxies(proxies: list):
    """Save proxy list"""
    proxy_path = os.path.join(WORK_DIR, "proxy.txt")
    with open(proxy_path, 'w') as f:
        f.write('\n'.join(proxies))

# ================== HANDLERS ==================

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start command - show main menu"""
    user_id = update.effective_user.id
    if not is_admin(user_id):
        await update.message.reply_text("⛔ Unauthorized")
        return

    keyboard = [
        [InlineKeyboardButton("🚀 Generate Email", callback_data="generate")],
        [InlineKeyboardButton("📊 Status", callback_data="status"),
         InlineKeyboardButton("📧 Accounts", callback_data="accounts")],
        [InlineKeyboardButton("⚙️ Config", callback_data="config"),
         InlineKeyboardButton("🔌 Proxy", callback_data="proxy")],
        [InlineKeyboardButton("🛑 Stop Generator", callback_data="stop")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "🎯 *OutlookGen Telegram Bot*\n\n"
        "Pilih menu di bawah:",
        reply_markup=reply_markup,
        parse_mode="Markdown"
    )

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle button callbacks"""
    query = update.callback_query
    user_id = query.from_user.id
    
    if not is_admin(user_id):
        await query.answer("⛔ Unauthorized", show_alert=True)
        return
    
    await query.answer()
    data = query.data

    if data == "generate":
        await show_generate_menu(query, context)
    elif data == "status":
        await show_status(query, context)
    elif data == "accounts":
        await show_accounts(query, context)
    elif data == "config":
        await show_config(query, context)
    elif data == "proxy":
        await show_proxy(query, context)
    elif data == "stop":
        await stop_generator(query, context)
    elif data.startswith("gen_"):
        count = int(data.split("_")[1])
        await start_generator(query, context, count)
    elif data == "back":
        await back_to_menu(query, context)

async def show_generate_menu(query, context):
    """Show generate options"""
    keyboard = [
        [InlineKeyboardButton("1 Email", callback_data="gen_1"),
         InlineKeyboardButton("5 Email", callback_data="gen_5")],
        [InlineKeyboardButton("10 Email", callback_data="gen_10"),
         InlineKeyboardButton("25 Email", callback_data="gen_25")],
        [InlineKeyboardButton("50 Email", callback_data="gen_50"),
         InlineKeyboardButton("100 Email", callback_data="gen_100")],
        [InlineKeyboardButton("⬅️ Back", callback_data="back")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(
        "🚀 *Generate Email*\n\n"
        "Pilih jumlah email yang ingin digenerate:",
        reply_markup=reply_markup,
        parse_mode="Markdown"
    )

async def start_generator(query, context, count: int):
    """Start the generator"""
    global generator_process, is_running
    
    if is_running:
        await query.edit_message_text(
            "⚠️ Generator sudah berjalan!\n"
            "Stop dulu sebelum memulai yang baru."
        )
        return
    
    config = load_config()
    
    # Validate config
    if config['Captcha']['api_key'] == "":
        await query.edit_message_text("❌ Captcha API key belum diset!")
        return
    
    if config['Captcha']['providers'] == "anycaptcha/twocaptcha":
        await query.edit_message_text("❌ Pilih provider captcha (anycaptcha atau twocaptcha)!")
        return
    
    if config['EmailInfo']['Domain'] == "@hotmail.com/@outlook.com":
        await query.edit_message_text("❌ Pilih domain email (@hotmail.com atau @outlook.com)!")
        return
    
    proxies = get_proxies()
    if not proxies:
        await query.edit_message_text("❌ Tidak ada proxy! Tambahkan proxy dulu.")
        return
    
    is_running = True
    await query.edit_message_text(
        f"🚀 *Starting Generator*\n\n"
        f"Target: {count} email\n"
        f"Provider: {config['Captcha']['providers']}\n"
        f"Domain: {config['EmailInfo']['Domain']}\n"
        f"Proxy: {len(proxies)} available\n\n"
        f"⏳ Generating...",
        parse_mode="Markdown"
    )
    
    # Run generator in background
    # Note: This is simplified - in production you'd want better process management
    try:
        cmd = f"cd {WORK_DIR} && python3 main.py"
        generator_process = subprocess.Popen(
            cmd,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Monitor for a bit
        await asyncio.sleep(5)
        
        if generator_process.poll() is not None:
            # Process ended
            stdout, stderr = generator_process.communicate()
            is_running = False
            await query.edit_message_text(
                f"❌ Generator stopped unexpectedly\n\n"
                f"Error: {stderr.decode()[:500]}"
            )
        else:
            keyboard = [[InlineKeyboardButton("🛑 Stop", callback_data="stop"),
                        InlineKeyboardButton("📊 Status", callback_data="status")]]
            await query.edit_message_text(
                f"✅ Generator berjalan!\n\n"
                f"Gunakan /status untuk melihat progress.",
                reply_markup=InlineKeyboardMarkup(keyboard)
            )
    except Exception as e:
        is_running = False
        await query.edit_message_text(f"❌ Error: {str(e)}")

async def stop_generator(query, context):
    """Stop the generator"""
    global generator_process, is_running
    
    if not is_running:
        await query.edit_message_text("ℹ️ Generator tidak sedang berjalan.")
        return
    
    if generator_process:
        generator_process.terminate()
        generator_process = None
    
    is_running = False
    await query.edit_message_text("🛑 Generator dihentikan.")

async def show_status(query, context):
    """Show generator status"""
    global is_running
    
    accounts = get_accounts()
    proxies = get_proxies()
    config = load_config()
    
    status = "🟢 Running" if is_running else "🔴 Stopped"
    
    text = (
        f"📊 *Status Generator*\n\n"
        f"Status: {status}\n"
        f"Generated: {len(accounts)} accounts\n"
        f"Proxies: {len(proxies)} available\n"
        f"Provider: {config['Captcha']['providers']}\n"
        f"Domain: {config['EmailInfo']['Domain']}\n"
    )
    
    keyboard = [[InlineKeyboardButton("⬅️ Back", callback_data="back")]]
    await query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="Markdown")

async def show_accounts(query, context):
    """Show generated accounts"""
    accounts = get_accounts()
    
    if not accounts:
        text = "📧 *Generated Accounts*\n\nBelum ada akun yang digenerate."
    else:
        # Show last 10
        recent = accounts[-10:]
        text = f"📧 *Generated Accounts* ({len(accounts)} total)\n\n"
        text += "Last 10:\n"
        for acc in recent:
            text += f"• `{acc}`\n"
    
    keyboard = [[InlineKeyboardButton("⬅️ Back", callback_data="back")]]
    await query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="Markdown")

async def show_config(query, context):
    """Show current config"""
    config = load_config()
    
    text = (
        f"⚙️ *Configuration*\n\n"
        f"*Captcha:*\n"
        f"• Provider: `{config['Captcha']['providers']}`\n"
        f"• API Key: `{'*****' if config['Captcha']['api_key'] else 'NOT SET'}`\n\n"
        f"*Email:*\n"
        f"• Domain: `{config['EmailInfo']['Domain']}`\n"
        f"• Password Length: `{config['EmailInfo']['PasswordLength']}`\n\n"
        f"Untuk edit config, gunakan:\n"
        f"`/setprovider <anycaptcha/twocaptcha>`\n"
        f"`/setapikey <key>`\n"
        f"`/setdomain <@hotmail.com/@outlook.com>`"
    )
    
    keyboard = [[InlineKeyboardButton("⬅️ Back", callback_data="back")]]
    await query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="Markdown")

async def show_proxy(query, context):
    """Show proxy list"""
    proxies = get_proxies()
    
    if not proxies:
        text = "🔌 *Proxy List*\n\nTidak ada proxy."
    else:
        text = f"🔌 *Proxy List* ({len(proxies)} total)\n\n"
        for i, p in enumerate(proxies[:10], 1):
            # Mask proxy for security
            masked = p[:20] + "..." if len(p) > 20 else p
            text += f"{i}. `{masked}`\n"
        if len(proxies) > 10:
            text += f"\n... dan {len(proxies) - 10} lainnya"
    
    text += "\n\nUntuk tambah proxy:\n`/addproxy ip:port`\n`/clearproxy` - hapus semua"
    
    keyboard = [[InlineKeyboardButton("⬅️ Back", callback_data="back")]]
    await query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="Markdown")

async def back_to_menu(query, context):
    """Back to main menu"""
    keyboard = [
        [InlineKeyboardButton("🚀 Generate Email", callback_data="generate")],
        [InlineKeyboardButton("📊 Status", callback_data="status"),
         InlineKeyboardButton("📧 Accounts", callback_data="accounts")],
        [InlineKeyboardButton("⚙️ Config", callback_data="config"),
         InlineKeyboardButton("🔌 Proxy", callback_data="proxy")],
        [InlineKeyboardButton("🛑 Stop Generator", callback_data="stop")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(
        "🎯 *OutlookGen Telegram Bot*\n\n"
        "Pilih menu di bawah:",
        reply_markup=reply_markup,
        parse_mode="Markdown"
    )

# ================== CONFIG COMMANDS ==================

async def set_provider(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Set captcha provider"""
    user_id = update.effective_user.id
    if not is_admin(user_id):
        return
    
    if not context.args:
        await update.message.reply_text("Usage: /setprovider <anycaptcha/twocaptcha>")
        return
    
    provider = context.args[0].lower()
    if provider not in ['anycaptcha', 'twocaptcha']:
        await update.message.reply_text("❌ Provider harus 'anycaptcha' atau 'twocaptcha'")
        return
    
    config = load_config()
    config['Captcha']['providers'] = provider
    save_config(config)
    await update.message.reply_text(f"✅ Provider diset ke: {provider}")

async def set_apikey(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Set captcha API key"""
    user_id = update.effective_user.id
    if not is_admin(user_id):
        return
    
    if not context.args:
        await update.message.reply_text("Usage: /setapikey <api_key>")
        return
    
    api_key = context.args[0]
    config = load_config()
    config['Captcha']['api_key'] = api_key
    save_config(config)
    await update.message.reply_text("✅ API key berhasil diset!")
    
    # Delete the message containing API key for security
    try:
        await update.message.delete()
    except:
        pass

async def set_domain(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Set email domain"""
    user_id = update.effective_user.id
    if not is_admin(user_id):
        return
    
    if not context.args:
        await update.message.reply_text("Usage: /setdomain <@hotmail.com/@outlook.com>")
        return
    
    domain = context.args[0]
    if domain not in ['@hotmail.com', '@outlook.com']:
        await update.message.reply_text("❌ Domain harus '@hotmail.com' atau '@outlook.com'")
        return
    
    config = load_config()
    config['EmailInfo']['Domain'] = domain
    save_config(config)
    await update.message.reply_text(f"✅ Domain diset ke: {domain}")

async def add_proxy(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Add proxy to list"""
    user_id = update.effective_user.id
    if not is_admin(user_id):
        return
    
    if not context.args:
        await update.message.reply_text("Usage: /addproxy ip:port atau user:pass@ip:port")
        return
    
    proxy = context.args[0]
    proxies = get_proxies()
    proxies.append(proxy)
    save_proxies(proxies)
    await update.message.reply_text(f"✅ Proxy ditambahkan! Total: {len(proxies)}")

async def clear_proxy(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Clear all proxies"""
    user_id = update.effective_user.id
    if not is_admin(user_id):
        return
    
    save_proxies([])
    await update.message.reply_text("✅ Semua proxy dihapus!")

async def download_accounts(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Download accounts file"""
    user_id = update.effective_user.id
    if not is_admin(user_id):
        return
    
    accounts_path = os.path.join(WORK_DIR, "account.txt")
    if not os.path.exists(accounts_path) or os.path.getsize(accounts_path) == 0:
        await update.message.reply_text("❌ Tidak ada akun yang tersimpan.")
        return
    
    await update.message.reply_document(
        document=open(accounts_path, 'rb'),
        filename=f"accounts_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt",
        caption="📧 Generated Accounts"
    )

# ================== MAIN ==================

def main():
    """Start the bot"""
    if BOT_TOKEN == "YOUR_BOT_TOKEN_HERE":
        print("❌ Please set TELEGRAM_BOT_TOKEN environment variable!")
        return
    
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Commands
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("setprovider", set_provider))
    application.add_handler(CommandHandler("setapikey", set_apikey))
    application.add_handler(CommandHandler("setdomain", set_domain))
    application.add_handler(CommandHandler("addproxy", add_proxy))
    application.add_handler(CommandHandler("clearproxy", clear_proxy))
    application.add_handler(CommandHandler("download", download_accounts))
    
    # Callbacks
    application.add_handler(CallbackQueryHandler(button_callback))
    
    print("🤖 Bot started!")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
