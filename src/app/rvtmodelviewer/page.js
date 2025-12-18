"use client";
import { useEffect, useRef, useState } from "react";

export default function RVTModelViewerPage() {
  const viewerDivRef = useRef(null);
  const [viewerInstance, setViewerInstance] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: "" });
  const [tempTooltip, setTempTooltip] = useState({ visible: false, x: 0, y: 0, id: null, temp: null });

  const URN = "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bDQ0cWVuazBydmJtZ2J3ejlrZGRzcmEyaGp3NmZqZnNoa3JtYnh1ZjBmeXh2a2N0X3R1dG9yaWFsX2J1Y2tldC9ORVclMjBEaWdpdGFsJTIwVHdpbiUyMDIlMjAtJTIwSGVhdGluZyUyMGFuZCUyMENvb2xpbmclMjByb29tLnJ2dA";

  // Temperature data for specific tanks
  const temperatureData = {
    11018: 72.5,
    11019: 68.3,
    11020: 65.3
  };

  // Pipe IDs for flowing water effect (Blue Animation)
  const PIPE_IDS = [11071, 11037, 11035, 11067, 11052, 11024, 11043, 11041, 11064, 11055, 11028, 11032, 11021, 11058, 11061, 11045, 11047, 9655, 9621, 9831, 9827, 9605, 9544, 9548, 9827, 9605, 9544, 9548, 9552, 10224, 10339, 10331, 10221, 10336, 10333, 10197, 10182, 10160, ];
  
  // Element IDs for Red Flow Animation (new requirement: both IDs are animated)
  const RED_FLOW_PIPE_IDS = [11079, 11114, 11081, 11096, 11069, 11117, 11087, 11089, 11108, 11102, 11083, 11093, 11091, 11120, 9653, 9603, 9702, 9682, 10566, 10266, 10506, 9699, 10284, 10509, 9679, 10287, 10512, 9689, 9607, 9724, 9716, 9692, 9599, 9582, 9590, 9564, 10176, 10203, 9573, 10152, 10215, 9587, 9571, 10146, 10218, 9561, 9559, 9557, 10263, 10329, 10278, 10326, 10248, 9713, 10281, 10323, 10245, 9707, 10122, 9489, 9491, 10212, 9494, 9514, 9471, 9535, 10599, 10034, 9837, 9857, 9870];
   
  // Flow animation controls (used for speed/intensity of ALL flows)
  const [flowConfig, setFlowConfig] = useState({
    speed: 1.5,           // Animation speed (seconds per cycle)
    baseColor: { r: 0.1, g: 0.4, b: 0.8 },    // Dark blue base (for blue pipes)
    highlightColor: { r: 0.4, g: 0.8, b: 1.0 }, // Bright blue highlight (for blue pipes)
    pulseIntensity: 0.7,   // How much color varies (0-1)
  });

  async function waitForTranslation(urn, timeoutMs = 5 * 60 * 1000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const res = await fetch(`/api/forge/modelderivative/${urn}`);
      if (!res.ok) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      const manifest = await res.json();
      if (manifest.status === "success" || (manifest.derivatives && manifest.derivatives.length > 0)) {
        return true;
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
    throw new Error("Translation timeout");
  }

  async function loadViewer(urn) {
    if (!window.Autodesk) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.js";
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.css";
      document.head.appendChild(css);
    }

    const tokenRes = await fetch("/api/forge/token/public");
    const tokenJson = await tokenRes.json();

    const options = {
      env: "AutodeskProduction",
      accessToken: tokenJson.access_token,
    };

    return new Promise((resolve, reject) => {
      Autodesk.Viewing.Initializer(options, () => {
        // Create viewer instance
        const viewer = new Autodesk.Viewing.GuiViewer3D(viewerDivRef.current);
        viewer.start();

        Autodesk.Viewing.Document.load(
          "urn:" + urn,
          (doc) => {
            const defaultModel = doc.getRoot().getDefaultGeometry();
            viewer.loadDocumentNode(doc, defaultModel).then(() => {
              // Only resolve and set state once the document node is loaded
              setViewerInstance(viewer);
              resolve(viewer);
            });
          },
          (err) => reject(err)
        );
      });
    });
  }

  // Setup flowing liquid effect using color pulsing
  function setupFlowingLiquidEffect(viewer) {
    // Safety check: ensure THREE and Viewer Model exist
    if (!window.THREE || !viewer.model) return () => {};

    const THREE = window.THREE;
    let animationId = null;
    let startTime = Date.now();

    // Define colors for the RED PULSING effect (11079, 11114)
    const RED_FLOW_BASE = { r: 0.6, g: 0.0, b: 0.0 };      // Dark Red
    const RED_FLOW_HIGHLIGHT = { r: 1.0, g: 0.4, b: 0.4 }; // Bright Red

    // Animate color pulsing to simulate flow
    function animateFlow() {
      const elapsed = (Date.now() - startTime) / 1000; // seconds
      const speed = flowConfig.speed;
       
      // Create a sine wave for smooth pulsing (synchronized for all animations)
      const pulse = Math.sin(elapsed * (Math.PI * 2) / speed) * 0.5 + 0.5;
       
      // --- 1. Blue Flow Animation (PIPE_IDS) ---
      const r_blue = flowConfig.baseColor.r + (flowConfig.highlightColor.r - flowConfig.baseColor.r) * pulse * flowConfig.pulseIntensity;
      const g_blue = flowConfig.baseColor.g + (flowConfig.highlightColor.g - flowConfig.baseColor.g) * pulse * flowConfig.pulseIntensity;
      const b_blue = flowConfig.baseColor.b + (flowConfig.highlightColor.b - flowConfig.baseColor.b) * pulse * flowConfig.pulseIntensity;
      const blue_color = new THREE.Vector4(r_blue, g_blue, b_blue, 1.0);
       
      // Apply Blue to all PIPE_IDS
      PIPE_IDS.forEach(pipeId => {
        viewer.setThemingColor(pipeId, blue_color, null, true);
      });
      
      // --- 2. Red Flow Animation (RED_FLOW_PIPE_IDS) ---
      const r_red = RED_FLOW_BASE.r + (RED_FLOW_HIGHLIGHT.r - RED_FLOW_BASE.r) * pulse * flowConfig.pulseIntensity;
      const g_red = RED_FLOW_BASE.g + (RED_FLOW_HIGHLIGHT.g - RED_FLOW_BASE.g) * pulse * flowConfig.pulseIntensity;
      const b_red = RED_FLOW_BASE.b + (RED_FLOW_HIGHLIGHT.b - RED_FLOW_BASE.b) * pulse * flowConfig.pulseIntensity;
      const red_flow_color = new THREE.Vector4(r_red, g_red, b_red, 1.0);
      
      // Apply Red pulse to both specified pipe IDs
      RED_FLOW_PIPE_IDS.forEach(pipeId => {
        viewer.setThemingColor(pipeId, red_flow_color, null, true);
      });
       
      // *** CRITICAL FIX: Force the viewer to redraw the scene ***
      viewer.impl.invalidate(true, true, true);

      // Continue animation
      animationId = requestAnimationFrame(animateFlow);
    }

    // Start animation
    console.log("Starting dual liquid flow animation.");
    startTime = Date.now();
    animateFlow();

    // Cleanup function
    return () => {
      console.log("Cleaning up flow animation colors");
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
       
      // Clear theming colors for ALL custom elements
      if (viewer && viewer.model) {
        // Clear flow pipes (Blue)
        PIPE_IDS.forEach(pipeId => {
          viewer.clearThemingColors(pipeId);
        });
        // Clear flow pipes (Red)
        RED_FLOW_PIPE_IDS.forEach(pipeId => {
          viewer.clearThemingColors(pipeId);
        });
        
        viewer.impl.invalidate(true, true, true);
      }
    };
  }

  // Setup hover handlers
  function setupHoverHandlers(viewer) {
    function fetchProps(dbId) {
      return new Promise((resolve) => {
        viewer.getProperties(dbId, (props) => resolve(props));
      });
    }

    // HOVER EVENT
    viewer.addEventListener(Autodesk.Viewing.GEOMETRY_HOVER, async (e) => {
      if (e.dbId) {
        const props = await fetchProps(e.dbId);
        const name = props?.name || "Unknown";
        const category = props?.properties?.find(p => p.displayName === "Category")?.displayValue || "N/A";
        const family = props?.properties?.find(p => p.displayName === "Family")?.displayValue || "N/A";
        const type = props?.properties?.find(p => p.displayName === "Type Name")?.displayValue || "N/A";
        const level = props?.properties?.find(p => p.displayName === "Level")?.displayValue || "N/A";

        setTooltip({
          visible: true,
          x: e.originalEvent.clientX + 10,
          y: e.originalEvent.clientY + 10,
          text: `Name: ${name}
Category: ${category}
Family: ${family}
Type: ${type}
Level: ${level}`,
        });
      } else {
        setTooltip((t) => ({ ...t, visible: false }));
      }
    });

    // CLICK EVENT
    viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, async (e) => {
      if (e.dbIdArray && e.dbIdArray.length > 0) {
        const id = e.dbIdArray[0];

        // Check if clicked element is one of the tanks
        if (temperatureData[id] !== undefined) {
          // Get the bounding box of the selected element
          const fragList = viewer.model.getFragmentList();
          const tree = viewer.model.getInstanceTree();
           
          let elementBounds = new window.THREE.Box3();
          tree.enumNodeFragments(id, (fragId) => {
            const bbox = new window.THREE.Box3();
            fragList.getWorldBounds(fragId, bbox);
            elementBounds.union(bbox);
          });
           
          // Get top-right corner of the element in screen space
          const topRight = new window.THREE.Vector3(
            elementBounds.max.x,
            elementBounds.max.y,
            elementBounds.max.z
          );
          const screenPoint = viewer.worldToClient(topRight);
           
          setTempTooltip({
            visible: true,
            x: screenPoint.x + 30,
            y: screenPoint.y - 20,
            id: id,
            temp: temperatureData[id]
          });
        } else if (PIPE_IDS.includes(id)) {
          // Special message for the blue cooling pipes
          // alert("Cooling Water Pipe\nElement ID: " + id + "\nStatus: Active Flow (Animated Blue)");
        } else if (RED_FLOW_PIPE_IDS.includes(id)) {
          // Special message for the red animated pipes
          // alert("Heating Loop Pipe\nElement ID: " + id + "\nStatus: Active Flow (Animated Red)");
        } else {
          // alert("Element clicked!\nElement ID: " + id);
        }

        const props = await fetchProps(id);
        const name = props?.name || "Unknown";
        const category = props?.properties?.find(p => p.displayName === "Category")?.displayValue || "N/A";
        const family = props?.properties?.find(p => p.displayName === "Family")?.displayValue || "N/A";
        const type = props?.properties?.find(p => p.displayName === "Type Name")?.displayValue || "N/A";
        const level = props?.properties?.find(p => p.displayName === "Level")?.displayValue || "N/A";

        setTooltip((t) => ({
          ...t,
          text: `CLICKED → Name: ${name}
Category: ${category}
Family: ${family}
Type: ${type}
Level: ${level}
ID: ${id}`,
        }));
      } else {
        setTempTooltip({ visible: false, x: 0, y: 0, id: null, temp: null });
      }
    });
  }

  // Initial Load Effect
  useEffect(() => {
    (async () => {
      try {
        await waitForTranslation(URN);
        const v = await loadViewer(URN);
        setupHoverHandlers(v);
        // We setViewerInstance inside loadViewer, which triggers the second effect
      } catch (err) {
        console.error(err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animation Effect - Runs when viewerInstance or Config changes
  useEffect(() => {
    let cleanup = null;
    if (viewerInstance) {
      // We start animation/coloring once the viewer is ready
      cleanup = setupFlowingLiquidEffect(viewerInstance);
    }

    return () => {
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowConfig, viewerInstance]);

  return (
    <div className="relative w-full h-full bg-gray-300 rounded-xl overflow-hidden">
      {/* Hover Tooltip */}
      {tooltip.visible && (
        <div
          className="absolute bg-black text-white text-xs px-2 py-1 rounded pointer-events-none z-50 whitespace-pre-line"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Temperature Tooltip - Cooling Tower Style */}
      {tempTooltip.visible && (
        <div
          className="absolute bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-xl shadow-2xl pointer-events-none z-50 border border-slate-700"
          style={{ 
            left: tempTooltip.x, 
            top: tempTooltip.y,
            minWidth: '280px'
          }}
        >
          {/* Header */}
          <div className="px-4 py-2 border-b border-slate-700 flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-sm font-bold tracking-wide">TANK METRICS</h3>
            <div className="ml-auto flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
           
          {/* Content */}
          <div className="p-4">
            {/* Tank ID */}
            <div className="text-xs text-slate-400 mb-3">
              Tank ID: <span className="text-cyan-400 font-mono">{tempTooltip.id}</span>
            </div>
             
            {/* Temperature Display */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex-shrink-0">
                <svg className="w-10 h-10 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C10.343 2 9 3.343 9 5v6.586A4.986 4.986 0 007 15c0 2.757 2.243 5 5 5s5-2.243 5-5a4.986 4.986 0 00-2-3.414V5c0-1.657-1.343-3-3-3zm0 16c-1.654 0-3-1.346-3-3 0-1.143.647-2.175 1.656-2.708l.344-.181V5c0-.551.449-1 1-1s1 .449 1 1v7.111l.344.181A2.99 2.99 0 0115 15c0 1.654-1.346 3-3 3z"/>
                </svg>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">TEMPERATURE</div>
                <div className="text-3xl font-bold text-orange-400">
                  {tempTooltip.temp}<span className="text-2xl">°F</span>
                </div>
              </div>
            </div>
             
            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-700">
              <div>
                <div className="text-xs text-slate-500">Status</div>
                <div className="text-xs font-semibold text-green-400">Active</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Type</div>
                <div className="text-xs font-semibold text-slate-300">Storage Tank</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flow Status Indicator */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-90 px-4 py-2 rounded-lg shadow-lg z-40">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">Cooling Flow Active</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">Heating Flow Active</span>
        </div>
      </div>

      {/* Viewer */}
      <div
        ref={viewerDivRef}
        id="forgeViewer"
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}