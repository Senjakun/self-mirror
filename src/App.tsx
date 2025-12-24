import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const queryClient = new QueryClient();

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">OutlookGen + Telegram Bot</h1>
        <p className="text-muted-foreground text-lg">
          Outlook Account Generator dengan kontrol via Telegram Bot
        </p>
        
        <div className="bg-card border border-border rounded-lg p-6 text-left space-y-4">
          <h2 className="text-xl font-semibold">Quick Install di VPS</h2>
          <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
{`cd /root
git clone YOUR_REPO_URL outlook-gen
cd outlook-gen/outlook_gen
chmod +x install.sh
./install.sh`}
          </pre>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 text-left space-y-4">
          <h2 className="text-xl font-semibold">Setup Telegram Bot</h2>
          <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
{`export TELEGRAM_BOT_TOKEN='your_token'
export ADMIN_IDS='your_telegram_id'
python3 telegram_bot.py`}
          </pre>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 text-left space-y-4">
          <h2 className="text-xl font-semibold">Bot Commands</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li><code className="bg-muted px-2 py-1 rounded">/start</code> - Menu utama</li>
            <li><code className="bg-muted px-2 py-1 rounded">/setprovider</code> - Set captcha provider</li>
            <li><code className="bg-muted px-2 py-1 rounded">/setapikey</code> - Set API key</li>
            <li><code className="bg-muted px-2 py-1 rounded">/setdomain</code> - Set email domain</li>
            <li><code className="bg-muted px-2 py-1 rounded">/addproxy</code> - Tambah proxy</li>
            <li><code className="bg-muted px-2 py-1 rounded">/download</code> - Download accounts</li>
          </ul>
        </div>

        <p className="text-sm text-muted-foreground">
          Based on <a href="https://github.com/MatrixTM/OutlookGen" className="underline hover:text-foreground">MatrixTM/OutlookGen</a>
        </p>
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
