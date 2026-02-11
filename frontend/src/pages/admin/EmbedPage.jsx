import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Check, Code, Blocks, ExternalLink, Smartphone, Monitor } from "lucide-react";

const FRONTEND_URL = window.location.origin;

const EmbedPage = ({ businessId }) => {
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedReact, setCopiedReact] = useState(false);

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
    <div className="space-y-6 max-w-4xl" data-testid="embed-page">
      <div>
        <h1 className="text-2xl font-bold font-heading">Embed Widget</h1>
        <p className="text-muted-foreground text-sm mt-1">Add the booking widget to your website</p>
      </div>

      {/* Business ID Card */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-primary to-zinc-800 text-white">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-white/70 mb-1">Your Business ID</p>
              <code className="text-lg font-mono font-semibold">{businessId}</code>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(businessId);
                toast.success("Business ID copied!");
              }}
              className="shrink-0"
              data-testid="copy-business-id"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy ID
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-heading">Live Preview</CardTitle>
              <CardDescription>See how your widget looks on different devices</CardDescription>
            </div>
            <a
              href={`/?businessId=${businessId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Open in new tab
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-zinc-100 rounded-xl p-8 flex items-center justify-center min-h-[200px]">
            <div className="text-center text-muted-foreground">
              <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Widget Preview</p>
              <p className="text-sm mt-1">Visit your website to see the widget in action</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Tabs */}
      <Tabs defaultValue="script" className="space-y-4">
        <TabsList className="bg-zinc-100 p-1 rounded-lg">
          <TabsTrigger value="script" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Code className="w-4 h-4 mr-2" />
            Script Tag
          </TabsTrigger>
          <TabsTrigger value="react" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Blocks className="w-4 h-4 mr-2" />
            React / Next.js
          </TabsTrigger>
        </TabsList>

        <TabsContent value="script">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-heading flex items-center gap-2">
                    HTML / Script Embed
                    <Badge variant="secondary">Recommended</Badge>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Works on any website - WordPress, Wix, Squarespace, plain HTML, etc.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-xl text-sm overflow-x-auto font-mono leading-relaxed">
                  <code>{scriptCode}</code>
                </pre>
                <Button
                  size="sm"
                  className="absolute top-3 right-3"
                  onClick={() => handleCopy(scriptCode, 'script')}
                  data-testid="copy-script-button"
                >
                  {copiedScript ? (
                    <>
                      <Check className="w-4 h-4 mr-1.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-800 text-sm mb-2">Quick Setup Guide</h4>
                <ol className="text-sm text-amber-700 space-y-1.5 list-decimal list-inside">
                  <li>Copy the code above</li>
                  <li>Paste it where you want the widget to appear on your page</li>
                  <li>The widget will load automatically</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="react">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-heading">React Component</CardTitle>
              <CardDescription>
                For React, Next.js, Gatsby, or other React-based frameworks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* React */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">React</Badge>
                </div>
                <div className="relative">
                  <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-xl text-sm overflow-x-auto font-mono leading-relaxed">
                    <code>{reactCode}</code>
                  </pre>
                  <Button
                    size="sm"
                    className="absolute top-3 right-3"
                    onClick={() => handleCopy(reactCode, 'react')}
                    data-testid="copy-react-button"
                  >
                    {copiedReact ? (
                      <>
                        <Check className="w-4 h-4 mr-1.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Next.js */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">Next.js</Badge>
                </div>
                <div className="relative">
                  <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-xl text-sm overflow-x-auto font-mono leading-relaxed">
                    <code>{nextjsCode}</code>
                  </pre>
                  <Button
                    size="sm"
                    className="absolute top-3 right-3"
                    onClick={() => handleCopy(nextjsCode, 'nextjs')}
                  >
                    <Copy className="w-4 h-4 mr-1.5" />
                    Copy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Customization */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-heading">Customization Options</CardTitle>
          <CardDescription>Personalize the widget to match your brand</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-50 rounded-xl">
              <code className="text-sm font-semibold text-primary">data-primary-color</code>
              <p className="text-sm text-muted-foreground mt-1">
                Set the primary accent color (hex value)
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Example: <code className="bg-zinc-200 px-1.5 py-0.5 rounded">#18181b</code>
              </p>
            </div>
            <div className="p-4 bg-zinc-50 rounded-xl">
              <code className="text-sm font-semibold text-primary">data-container</code>
              <p className="text-sm text-muted-foreground mt-1">
                Custom container ID (default: booking-widget)
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Example: <code className="bg-zinc-200 px-1.5 py-0.5 rounded">my-booking</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmbedPage;
