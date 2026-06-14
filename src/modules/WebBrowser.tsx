import { Html } from "@react-three/drei";
import { ModuleManifest, SpatialVolume } from "../sdk/types";
import { useState, useEffect } from "react";
import { useAgentStore } from "../store/useAgentStore";

export const webBrowserManifest: ModuleManifest = {
  id: "core.web_browser",
  name: "Spatial Web Browser",
  purpose: "Browse the traditional web within a volumetric spatial enclosure with live agent interaction.",
  version: "0.2.0",
  capabilities: [{ name: "network.fetch" }],
  surface: "volumetric",
  defaultAnchor: "floating",
};

export function WebBrowser({
  volume,
  instanceId,
  instance,
}: {
  volume: SpatialVolume;
  instanceId: string;
  instance: any;
}) {
  const updateInstanceData = useAgentStore((state) => state.updateInstanceData);
  
  // Extract and default state parameters from dynamic store data
  const pageData = instance?.data || {};
  const currentUrl = pageData.url || "https://en.wikipedia.org/wiki/Ghost_in_the_Shell";
  const title = pageData.title || "CyberNet Core Index";
  const pageType = pageData.type || "article"; // 'article' | 'search'
  const summary = pageData.summary || "Synchronized with Agent subnet. Secure connection active.";
  const sections = pageData.sections || [
    {
      heading: "Overview",
      content: "Welcome to the CyberNet Spatial Browser. Enter any web link, domain name, or request a general query to crawl the grid. The spatial AI Agent has full eyes on your active tabs and can browse pages based on your conversational objectives."
    }
  ];
  const links = pageData.links || [
    { text: "Read Ghost in the Shell", url: "https://en.wikipedia.org/wiki/Ghost_in_the_Shell" },
    { text: "Artificial Intelligence News", url: "artificial intelligence breakthroughs" },
    { text: "Hacker News Index", url: "https://news.ycombinator.com" }
  ];
  const searchResults = pageData.searchResults || [];
  const isLoading = pageData.loading || false;

  const [inputUrl, setInputUrl] = useState(currentUrl);

  // Synchronize input bar with external nav actions (e.g. triggered by Agent)
  useEffect(() => {
    setInputUrl(currentUrl);
  }, [currentUrl]);

  const handleNavigate = async (target?: string) => {
    const query = (target || inputUrl).trim();
    if (!query) return;

    // Set loading state in Zustand first
    updateInstanceData(instanceId, { loading: true, url: query });

    try {
      const response = await fetch("/api/browser/load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urlOrQuery: query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP transaction status ${response.status}`);
      }

      const payload = await response.json();
      
      updateInstanceData(instanceId, {
        loading: false,
        url: payload.url,
        title: payload.title,
        type: payload.type,
        summary: payload.summary,
        sections: payload.sections || [],
        links: payload.links || [],
        searchResults: payload.searchResults || [],
      });
    } catch (err: any) {
      updateInstanceData(instanceId, {
        loading: false,
        title: "Connection Failed - Protocol Error",
        type: "article",
        summary: "The CyberProxy failed to decrypt packets from this coordinate.",
        sections: [
          {
            heading: "CRAWL_EXCEPTION",
            content: `The remote target rejected proxy forwarding. Specific error message: ${err.message || "Unknown routing exception."}`
          }
        ],
        links: [
          { text: "Retry Home", url: "https://en.wikipedia.org/wiki/Main_Page" }
        ],
        searchResults: [],
      });
    }
  };

  return (
    <group
      position={volume.position}
      rotation={volume.rotation}
      scale={volume.scale}
    >
      {/* Volumetric Housing/Chassis */}
      <mesh position={[0, 0, -0.1]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 3.2, 0.2]} />
        <meshStandardMaterial color="#0b1329" roughness={0.8} metalness={0.4} />
      </mesh>

      {/* Screen Bezel */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[4.05, 3.05, 0.05]} />
        <meshStandardMaterial color="#020617" roughness={0.5} />
      </mesh>

      {/* Volumetric Details - Glowing Side panels */}
      <mesh position={[-2.15, 0, -0.1]}>
        <boxGeometry args={[0.05, 2.5, 0.25]} />
        <meshStandardMaterial
          color="#0ea5e9"
          emissive="#0284c7"
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[2.15, 0, -0.1]}>
        <boxGeometry args={[0.05, 2.5, 0.25]} />
        <meshStandardMaterial
          color="#0ea5e9"
          emissive="#0284c7"
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </mesh>

      <Html
        transform
        occlude
        wrapperClass="pointer-events-auto"
        distanceFactor={1.5}
        position={[0, 0, 0.02]}
      >
        <div className="w-[1280px] h-[960px] bg-[#020617]/95 flex flex-col font-mono text-cyan-50 overflow-hidden cursor-default shadow-[0_0_50px_rgba(14,165,233,0.3)] border border-sky-500/30">
          {/* Browser Chrome */}
          <div className="bg-[#02050a] p-4 border-b border-sky-500/40 flex items-center space-x-6 backdrop-blur-md">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-[0_0_5px_rgba(244,63,94,0.8)]"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_5px_rgba(245,158,11,0.8)]"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div>
            </div>

            <div className="flex-1 flex bg-[#010a17] border border-sky-500/30 rounded-sm overflow-hidden shadow-inner drop-shadow-[0_0_10px_rgba(14,165,233,0.1)]">
              <div className="px-4 py-3 bg-sky-900/20 border-r border-sky-500/30 flex items-center justify-center">
                <span className="text-sky-400 font-bold uppercase tracking-widest text-[10px]">
                  SSL_PROXY
                </span>
              </div>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNavigate()}
                className="flex-1 bg-transparent px-4 py-3 outline-none text-sm text-sky-200 placeholder-sky-800 tracking-wide font-mono"
                placeholder="Request Link, Node IP, or Search term..."
              />
              <button
                onClick={() => handleNavigate()}
                className="px-6 py-3 bg-sky-600/20 hover:bg-sky-500/40 text-sky-300 text-[10px] uppercase tracking-[0.2em] font-bold transition-colors border-l border-sky-500/30 cursor-pointer"
              >
                EXECUTE
              </button>
            </div>
          </div>

          {/* Viewport content */}
          <div className="flex-1 p-8 bg-[#010712] relative overflow-y-auto flex flex-col">
            {isLoading ? (
              // Cyber loading overlay
              <div className="absolute inset-0 bg-[#010712] z-40 flex flex-col items-center justify-center space-y-4 font-mono">
                <div className="w-24 h-1 bg-sky-950 overflow-hidden relative rounded-full">
                  <div className="absolute top-0 bottom-0 left-0 bg-sky-500 w-1/3 animate-[pulse_1s_infinite] rounded-full" style={{ width: "30%", left: "35%" }}></div>
                </div>
                <div className="text-sky-400 text-xs tracking-[0.3em] font-bold uppercase animate-pulse">
                  CRAWLING CORE NETWORK NODE...
                </div>
                <div className="text-[10px] text-sky-600 tracking-wider">
                  SSL Handshake | Translating schema structures | Synthesizing grid logs
                </div>
              </div>
            ) : null}

            {/* Simulated browser interior */}
            <div className="flex justify-between items-center border-b border-sky-500/20 pb-4 mb-6">
              <div>
                <span className="text-[9px] text-sky-500 tracking-widest uppercase block mb-1">NODE_LOCATION</span>
                <span className="text-xs text-sky-300 font-bold tracking-wide">{currentUrl}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-sky-500 tracking-widest uppercase block mb-1">CRAWLED_TITLE</span>
                <span className="text-sm text-emerald-400 font-bold tracking-tight drop-shadow-[0_0_5px_rgba(52,211,153,0.3)]">{title}</span>
              </div>
            </div>

            {/* Quick action links rail */}
            {links.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2.5 items-center bg-blue-950/10 p-3 rounded-sm border border-sky-500/10">
                <span className="text-[9px] text-sky-500 tracking-wider font-bold uppercase mr-1">TABS_RELATION:</span>
                {links.map((link: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleNavigate(link.url)}
                    className="px-3 py-1 bg-sky-950/40 hover:bg-sky-500/20 border border-sky-500/30 hover:border-sky-400 rounded-sm text-[10px] text-sky-300 hover:text-sky-100 transition-colors uppercase font-bold tracking-wide cursor-pointer"
                  >
                    🚀 {link.text}
                  </button>
                ))}
              </div>
            )}

            {/* Page content representation */}
            {pageType === "search" ? (
              // Search view
              <div className="space-y-6 flex-1">
                <div className="p-4 bg-emerald-950/10 border border-emerald-500/20 rounded-sm">
                  <span className="text-[10px] text-emerald-500 font-bold tracking-widest uppercase block mb-1">SEARCH_ABSTRACT</span>
                  <p className="text-xs text-emerald-100/80 leading-relaxed font-sans">{summary}</p>
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] text-sky-500 font-bold tracking-widest uppercase block pt-2 border-b border-sky-500/20 pb-1">SEARCH_RESULTS ({searchResults.length})</span>
                  {searchResults.map((res: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 bg-[#020b1c] border border-sky-500/15 hover:border-sky-500/40 hover:bg-sky-950/10 rounded-sm transition-all group"
                    >
                      <button
                        onClick={() => handleNavigate(res.url)}
                        className="text-sm text-sky-300 group-hover:text-emerald-300 font-bold tracking-wide text-left block mb-1 transition-colors cursor-pointer"
                      >
                        {res.title}
                      </button>
                      <span className="text-[9px] text-sky-500/70 font-mono block mb-2">{res.url}</span>
                      <p className="text-xs text-sky-100/70 leading-relaxed font-sans">{res.snippet}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Standard site article view
              <div className="space-y-6 flex-1 flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-6">
                  {/* Summary card */}
                  <div className="p-5 bg-sky-950/20 border-l-4 border-emerald-400 rounded-sm">
                    <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase block mb-1">SECURE_SUMMARY_PACKET</span>
                    <p className="text-xs text-emerald-100/90 leading-relaxed font-sans">{summary}</p>
                  </div>

                  {/* Sections */}
                  <div className="space-y-6">
                    {sections.map((sec: any, idx: number) => (
                      <div key={idx} className="space-y-2">
                        <h4 className="text-xs text-sky-400 font-bold tracking-widest uppercase border-b border-sky-500/20 pb-1">{`> ${sec.heading}`}</h4>
                        <p className="text-xs text-sky-100/80 leading-relaxed font-sans whitespace-pre-line">{sec.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Html>
    </group>
  );
}
