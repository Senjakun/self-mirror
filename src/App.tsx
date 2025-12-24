import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            🔐 Microsoft Account Creator
          </h1>
          <p className="text-gray-400">Hybrid Version - Auto Captcha + Anti-Detection</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-blue-400">✨ Features</h3>
            <ul className="space-y-2 text-gray-300">
              <li>🤖 Auto Captcha (2Captcha/AnyCaptcha)</li>
              <li>🎭 Anti-Detection Fingerprinting</li>
              <li>📧 Auto Recovery Email</li>
              <li>🌐 Proxy Support</li>
              <li>📱 Telegram Bot Control</li>
              <li>🔄 Batch Generation</li>
            </ul>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-green-400">💰 Captcha Pricing</h3>
            <ul className="space-y-2 text-gray-300">
              <li>🔵 2Captcha: ~$2.99/1000</li>
              <li>🟣 AnyCaptcha: ~$2.99/1000</li>
              <li>👤 Manual: Free (slower)</li>
            </ul>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-8">
          <h3 className="text-xl font-semibold mb-4 text-yellow-400">🚀 VPS Installation</h3>
          <pre className="bg-black/50 p-4 rounded-lg text-sm overflow-x-auto">
{`# Clone and install
git pull
cd microsoft-account-creator
chmod +x install.sh && ./install.sh

# Configure (edit src/config.js)
# Set CAPTCHA_PROVIDER and CAPTCHA_API_KEY

# Run directly
npm start              # 1 account
node src/index.js 5    # 5 accounts
node src/index.js 10   # 10 accounts

# Or run with Telegram Bot
export TELEGRAM_BOT_TOKEN='your-token'
export ADMIN_IDS='your-id'
npm run bot`}
          </pre>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-purple-400">📱 Telegram Commands</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <code className="text-cyan-400">/start</code> - Main menu
            </div>
            <div>
              <code className="text-cyan-400">/setapikey KEY</code> - Set captcha API key
            </div>
            <div>
              <code className="text-cyan-400">/setproxy ip:port</code> - Set proxy
            </div>
            <div>
              <code className="text-cyan-400">🚀 Generate</code> - 1/5/10/25/50/100 accounts
            </div>
            <div>
              <code className="text-cyan-400">⚙️ Settings</code> - Provider, domain, etc.
            </div>
            <div>
              <code className="text-cyan-400">📥 Download</code> - Get accounts file
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 mt-8 text-sm">
          ⚠️ For educational purposes only. Use responsibly.
        </p>
      </div>
    </div>
  );
}

export default App;
