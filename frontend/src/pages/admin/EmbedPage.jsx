import { useState } from "react";
import BookingWidget from "@/components/BookingWidget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Copy, Check, Code, Blocks, Monitor, Smartphone } from "lucide-react";

const FRONTEND_URL = window.location.origin;

const EmbedPage = ({ businessId }) => {
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedReact, setCopiedReact] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop');

  const scriptCode = `<!-- Appointly Booking Widget -->
<div id="booking-widget"></div>
<script 
  src="${FRONTEND_URL}/booking-embed.js" 
  data-business-id="${businessId}"
  data-primary-color="#18181b">
</script>`;

  const reactCode = `import { BookingWidget } from '@appointly/widget';

function App() {
  return (
    <BookingWidget 
      businessId="${businessId}"
      primaryColor="#18181b"
    />
  );
}`;

  const nextjsCode = `// pages/booking.js or app/booking/page.js
'use client';

import Script from 'next/script';

export default function BookingPage() {
  return (
    <>
      <div id="booking-widget" />
      <Script
        src="${FRONTEND_URL}/booking-embed.js"
        data-business-id="${businessId}"
        data-primary-color="#18181b"
        strategy="lazyOnload"
      />
    </>
  );
}`;

  const handleCopy = async (code, type) => {
    await navigator.clipboard.writeText(code);
    if (type === 'script') {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } else {
      setCopiedReact(true);
      setTimeout(() => setCopiedReact(false), 2000);
    }
    toast.success("Code copied to clipboard!");
  };

  return (
    <div className="space-y-6" data-testid="embed-page">
      <div>
        <h1 className="text-2xl font-bold font-heading">Embed Widget</h1>
        <p className="text-muted-foreground text-sm mt-1">Add the booking widget to your website</p>
      </div>

      {/* Business ID Card */}
      <Card className="border-0 shadow-sm bg-primary text-white">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-white/70 mb-1">Your Business ID</p>
              <code className="text-sm sm:text-base font-mono font-semibold break-all">{businessId}</code>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(businessId);
                toast.success("Business ID copied!");
              }}
              className="shrink-0 w-full sm:w-auto"
              data-testid="copy-business-id"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy ID
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-heading">Live Preview</CardTitle>
              <CardDescription>This is how your widget looks</CardDescription>
            </div>
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-2 rounded-md transition-colors ${previewMode === 'desktop' ? 'bg-white shadow-sm' : 'hover:bg-zinc-200'}`}
                data-testid="preview-desktop"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-2 rounded-md transition-colors ${previewMode === 'mobile' ? 'bg-white shadow-sm' : 'hover:bg-zinc-200'}`}
                data-testid="preview-mobile"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`bg-zinc-100 rounded-xl p-4 sm:p-8 flex justify-center overflow-hidden transition-all ${
            previewMode === 'mobile' ? 'max-w-[380px] mx-auto' : ''
          }`}>
            <div className={`w-full ${previewMode === 'mobile' ? 'max-w-[360px]' : 'max-w-[440px]'}`}>
              <BookingWidget businessId={businessId} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Tabs */}
      <Tabs defaultValue="script" className="space-y-4">
        <TabsList className="bg-zinc-100 p-1 rounded-lg w-full sm:w-auto">
          <TabsTrigger value="script" className="flex-1 sm:flex-none rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm">
            <Code className="w-4 h-4 mr-1.5" />
            Script
          </TabsTrigger>
          <TabsTrigger value="react" className="flex-1 sm:flex-none rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm">
            <Blocks className="w-4 h-4 mr-1.5" />
            React
          </TabsTrigger>
        </TabsList>

        <TabsContent value="script">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading">HTML / Script Embed</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Works on any website - WordPress, Wix, Squarespace, etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="bg-zinc-900 text-zinc-100 p-3 sm:p-4 rounded-xl text-xs sm:text-sm overflow-x-auto font-mono leading-relaxed">
                  <code>{scriptCode}</code>
                </pre>
                <Button
                  size="sm"
                  className="absolute top-2 right-2 h-8 text-xs"
                  onClick={() => handleCopy(scriptCode, 'script')}
                  data-testid="copy-script-button"
                >
                  {copiedScript ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold text-amber-800 text-sm mb-2">Quick Setup</h4>
                <ol className="text-xs sm:text-sm text-amber-700 space-y-1 list-decimal list-inside">
                  <li>Copy the code above</li>
                  <li>Paste where you want the widget</li>
                  <li>Done! Widget loads automatically</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="react">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading">React / Next.js</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                For React-based frameworks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="bg-zinc-900 text-zinc-100 p-3 sm:p-4 rounded-xl text-xs sm:text-sm overflow-x-auto font-mono leading-relaxed">
                  <code>{reactCode}</code>
                </pre>
                <Button
                  size="sm"
                  className="absolute top-2 right-2 h-8 text-xs"
                  onClick={() => handleCopy(reactCode, 'react')}
                  data-testid="copy-react-button"
                >
                  {copiedReact ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              <div className="relative">
                <p className="text-xs text-muted-foreground mb-2">Next.js with Script component:</p>
                <pre className="bg-zinc-900 text-zinc-100 p-3 sm:p-4 rounded-xl text-xs sm:text-sm overflow-x-auto font-mono leading-relaxed">
                  <code>{nextjsCode}</code>
                </pre>
                <Button
                  size="sm"
                  className="absolute top-2 right-2 h-8 text-xs"
                  onClick={() => handleCopy(nextjsCode, 'nextjs')}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Customization */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading">Customization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <div className="p-3 bg-zinc-50 rounded-lg">
              <code className="text-xs sm:text-sm font-semibold text-primary">data-primary-color</code>
              <p className="text-xs text-muted-foreground mt-1">
                Set accent color (hex). Example: <code className="bg-zinc-200 px-1 rounded">#18181b</code>
              </p>
            </div>
            <div className="p-3 bg-zinc-50 rounded-lg">
              <code className="text-xs sm:text-sm font-semibold text-primary">data-container</code>
              <p className="text-xs text-muted-foreground mt-1">
                Custom container ID. Default: <code className="bg-zinc-200 px-1 rounded">booking-widget</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmbedPage;
