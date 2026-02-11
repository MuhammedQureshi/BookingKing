import { useState } from "react";
import BookingWidget from "@/components/BookingWidget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Copy, Check, Code, Blocks, Monitor, Smartphone } from "lucide-react";

const FRONTEND_URL = 'https://reserve-js.preview.emergentagent.com';

const EmbedPage = ({ businessId }) => {
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedReact, setCopiedReact] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop');

  const scriptCode = `<!-- Add this where you want the widget to appear -->
<div id="booking-widget"></div>
<script 
  src="${FRONTEND_URL}/booking-embed.js" 
  data-business-id="${businessId}"
  data-primary-color="#18181b">
</script>`;

  const reactCode = `// 1. Add the script to your index.html or _document.js
<script src="${FRONTEND_URL}/booking-embed.js"></script>

// 2. Create a component
import { useEffect } from 'react';

function BookingWidget() {
  useEffect(() => {
    // Initialize widget after component mounts
    if (window.AppointlyWidget) {
      window.AppointlyWidget.init({
        businessId: '${businessId}',
        container: 'booking-widget',
        primaryColor: '#18181b'
      });
    }
    
    // Cleanup on unmount
    return () => {
      if (window.AppointlyWidget) {
        window.AppointlyWidget.destroy('booking-widget');
      }
    };
  }, []);

  return <div id="booking-widget" />;
}

export default BookingWidget;`;

  const nextjsCode = `// app/booking/page.tsx or pages/booking.tsx
'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function BookingPage() {
  useEffect(() => {
    // Initialize after script loads
    const init = () => {
      if (window.AppointlyWidget) {
        window.AppointlyWidget.init({
          businessId: '${businessId}',
          container: 'booking-widget',
          primaryColor: '#18181b'
        });
      }
    };
    
    // Check if already loaded
    if (window.AppointlyWidget) {
      init();
    } else {
      window.addEventListener('appointly-loaded', init);
    }
    
    return () => {
      if (window.AppointlyWidget) {
        window.AppointlyWidget.destroy('booking-widget');
      }
    };
  }, []);

  return (
    <>
      <Script 
        src="${FRONTEND_URL}/booking-embed.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.AppointlyWidget) {
            window.AppointlyWidget.init({
              businessId: '${businessId}',
              container: 'booking-widget'
            });
          }
        }}
      />
      <div id="booking-widget" />
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
    toast.success("Copied!");
  };

  return (
    <div className="space-y-6" data-testid="embed-page">
      <div>
        <h1 className="text-2xl font-bold font-heading">Embed Widget</h1>
        <p className="text-muted-foreground text-sm mt-1">Add booking to your website</p>
      </div>

      {/* Business ID */}
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
                toast.success("Copied!");
              }}
              className="shrink-0 w-full sm:w-auto"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
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
              <CardDescription>How your widget looks</CardDescription>
            </div>
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-2 rounded-md transition-colors ${previewMode === 'desktop' ? 'bg-white shadow-sm' : 'hover:bg-zinc-200'}`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-2 rounded-md transition-colors ${previewMode === 'mobile' ? 'bg-white shadow-sm' : 'hover:bg-zinc-200'}`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`bg-zinc-100 rounded-xl p-4 sm:p-8 flex justify-center overflow-hidden ${
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
            HTML
          </TabsTrigger>
          <TabsTrigger value="react" className="flex-1 sm:flex-none rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm">
            <Blocks className="w-4 h-4 mr-1.5" />
            React
          </TabsTrigger>
          <TabsTrigger value="nextjs" className="flex-1 sm:flex-none rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm">
            <Blocks className="w-4 h-4 mr-1.5" />
            Next.js
          </TabsTrigger>
        </TabsList>

        <TabsContent value="script">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading">HTML / WordPress / Webflow</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Just paste this code where you want the widget
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="bg-zinc-900 text-zinc-100 p-3 sm:p-4 rounded-xl text-xs sm:text-sm overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">
                  <code>{scriptCode}</code>
                </pre>
                <Button
                  size="sm"
                  className="absolute top-2 right-2 h-8 text-xs"
                  onClick={() => handleCopy(scriptCode, 'script')}
                >
                  {copiedScript ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copiedScript ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="react">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading">React (Create React App, Vite)</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Use the AppointlyWidget API for React apps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-zinc-900 text-zinc-100 p-3 sm:p-4 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">
                  <code>{reactCode}</code>
                </pre>
                <Button
                  size="sm"
                  className="absolute top-2 right-2 h-8 text-xs"
                  onClick={() => handleCopy(reactCode, 'react')}
                >
                  {copiedReact ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copiedReact ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nextjs">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading">Next.js (App Router or Pages)</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Use Next.js Script component for optimal loading
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-zinc-900 text-zinc-100 p-3 sm:p-4 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">
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

      {/* Important Notes */}
      <Card className="border-0 shadow-sm border-l-4 border-l-amber-400">
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm mb-2">Important Notes</h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>The widget uses <code className="bg-zinc-100 px-1 rounded">window.AppointlyWidget</code> API</li>
            <li>Call <code className="bg-zinc-100 px-1 rounded">.init()</code> after the container div exists</li>
            <li>Call <code className="bg-zinc-100 px-1 rounded">.destroy()</code> on cleanup to prevent memory leaks</li>
            <li>The container div must have the matching ID</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmbedPage;
