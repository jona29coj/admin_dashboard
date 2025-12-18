"use client";

import { useEffect, useRef, useState } from "react";

export default function RVTModelViewerPage() {
  const viewerDivRef = useRef(null);
  const [viewerInstance, setViewerInstance] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: "" });
  const [tempTooltip, setTempTooltip] = useState({ visible: false, x: 0, y: 0, id: null, temp: null });

  const URN =
    "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bDQ0cWVuazBydmJtZ2J3ejlrZGRzcmEyaGp3NmZqZnNoa3JtYnh1ZjBmeXh2a2N0X3R1dG9yaWFsX2J1Y2tldC9ERUxISSUyMEFJUlBPUlQlMjAoMikucnZ0";

  // Temperature data for specific tanks
  const temperatureData = {
    11018: 72.5,
    11019: 68.3
  };

  // Pipe IDs for flowing water effect
  const PIPE_IDS = [11071];
  
  // Flow animation controls
  const [flowConfig, setFlowConfig] = useState({
    speed: 0.02,        // Arrow movement speed (0.001 - 0.1)
    pipeColor: { r: 0.2, g: 0.5, b: 0.9 }, // Fixed pipe color (light blue)
    arrowColor: { r: 1.0, g: 1.0, b: 1.0 }, // Arrow color (white)
    arrowSpacing: 2.0,  // Space between arrows (1-5 meters)
    arrowSize: 0.3,     // Arrow size (0.1-1.0)
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
        const viewer = new Autodesk.Viewing.GuiViewer3D(viewerDivRef.current);
        viewer.start();

        Autodesk.Viewing.Document.load(
          "urn:" + urn,
          (doc) => {
            const defaultModel = doc.getRoot().getDefaultGeometry();
            viewer.loadDocumentNode(doc, defaultModel).then(() => {
              setViewerInstance(viewer);
              resolve(viewer);
            });
          },
          (err) => reject(err)
        );
      });
    });
  }

  // Setup flowing arrow animation on pipes
  function setupFlowingArrowEffect(viewer) {
    const THREE = window.THREE;
    let animationId = null;
    let flowOffset = 0;
    let arrowMeshes = [];

    // Set fixed color on pipes
    function setFixedPipeColor() {
      const pipeColor = new THREE.Vector4(
        flowConfig.pipeColor.r,
        flowConfig.pipeColor.g,
        flowConfig.pipeColor.b,
        1.0
      );
      
      PIPE_IDS.forEach(pipeId => {
        viewer.setThemingColor(pipeId, pipeColor, null, true);
      });
    }

    // Create arrow geometry (simple cone/triangle shape)
    function createArrowGeometry() {
      // Create a cone that points along the pipe direction
      const geometry = new THREE.ConeGeometry(
        flowConfig.arrowSize * 0.5, // radius
        flowConfig.arrowSize * 1.5, // height (length of arrow)
        8 // segments
      );
      
      // Rotate to point along X-axis (typical pipe direction)
      geometry.rotateZ(-Math.PI / 2);
      
      return geometry;
    }

    // Create arrow material
    function createArrowMaterial() {
      return new THREE.MeshBasicMaterial({
        color: new THREE.Color(
          flowConfig.arrowColor.r,
          flowConfig.arrowColor.g,
          flowConfig.arrowColor.b
        ),
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      });
    }

    // Get pipe geometry and create arrows along its path
    function createArrowsForPipe(pipeId) {
      const tree = viewer.model.getInstanceTree();
      const fragList = viewer.model.getFragmentList();
      
      tree.enumNodeFragments(pipeId, (fragId) => {
        const bbox = new THREE.Box3();
        fragList.getWorldBounds(fragId, bbox);
        
        // Get pipe dimensions
        const length = bbox.max.x - bbox.min.x;
        const center = bbox.getCenter(new THREE.Vector3());
        
        // Create multiple arrows along the pipe length
        const numArrows = Math.max(2, Math.floor(length / flowConfig.arrowSpacing));
        
        for (let i = 0; i < numArrows; i++) {
          const arrowGeometry = createArrowGeometry();
          const arrowMaterial = createArrowMaterial();
          const arrowMesh = new THREE.Mesh(arrowGeometry, arrowMaterial);
          
          // Position arrow along pipe
          const t = i / numArrows;
          arrowMesh.position.copy(center);
          arrowMesh.position.x = bbox.min.x + length * t;
          
          // Store initial position and pipe info
          arrowMesh.userData = {
            pipeId: pipeId,
            startX: bbox.min.x,
            endX: bbox.max.x,
            length: length,
            initialOffset: t
          };
          
          viewer.impl.addOverlay("arrow-overlay", arrowMesh);
          arrowMeshes.push(arrowMesh);
        }
      });
    }

    // Initialize arrows for all pipes
    function initializeArrows() {
      // Clear existing arrows
      arrowMeshes.forEach(mesh => {
        viewer.impl.removeOverlay("arrow-overlay", mesh);
      });
      arrowMeshes = [];
      
      // Create new arrows
      PIPE_IDS.forEach(pipeId => {
        createArrowsForPipe(pipeId);
      });
    }

    // Animate arrows moving along pipes
    function animateArrows() {
      flowOffset += flowConfig.speed;
      
      arrowMeshes.forEach(arrow => {
        const { startX, length, initialOffset } = arrow.userData;
        
        // Calculate new position with wrapping
        let newPos = (flowOffset + initialOffset) % 1.0;
        arrow.position.x = startX + length * newPos;
        
        // FIX: Force THREE.js to update the mesh's world matrix so position changes are rendered.
        arrow.matrixWorldNeedsUpdate = true;
        
        // Fade in/out at edges for smooth transition
        const edgeFade = 0.1;
        if (newPos < edgeFade) {
          arrow.material.opacity = 0.9 * (newPos / edgeFade);
        } else if (newPos > 1 - edgeFade) {
          arrow.material.opacity = 0.9 * ((1 - newPos) / edgeFade);
        } else {
          arrow.material.opacity = 0.9;
        }
      });
      
      viewer.impl.invalidate(true);
      animationId = requestAnimationFrame(animateArrows);
    }

    // Set initial pipe color
    setFixedPipeColor();
    
    // Initialize and start animation
    setTimeout(() => {
      initializeArrows();
      animateArrows();
    }, 1000);

    // Cleanup function
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      arrowMeshes.forEach(mesh => {
        viewer.impl.removeOverlay("arrow-overlay", mesh);
      });
      arrowMeshes = [];
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
          const bounds = viewer.model.getBoundingBox();
          viewer.getProperties(id, (props) => {
            const screenPoint = viewer.worldToClient(bounds.center());
            
            setTempTooltip({
              visible: true,
              x: screenPoint.x + 20,
              y: screenPoint.y - 20,
              id: id,
              temp: temperatureData[id]
            });
          });
        } 
        // else if (PIPE_IDS.includes(id)) {
        //   // Special message for the cooling pipes
        //   alert("Cooling Water Pipe\nElement ID: " + id + "\nStatus: Active Flow");
        // } else {
        //   alert("Element clicked!\nElement ID: " + id);
        // }

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

  useEffect(() => {
    let cleanupFlow = null;

    (async () => {
      try {
        await waitForTranslation(URN);
        const v = await loadViewer(URN);
        setupHoverHandlers(v);
        
        // Wait for model to be fully loaded before applying effects
        v.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, () => {
          cleanupFlow = setupFlowingArrowEffect(v);
        });
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      if (cleanupFlow) {
        cleanupFlow();
      }
    };
  }, []);

  // Update animation when config changes
  useEffect(() => {
    if (viewerInstance) {
      const cleanup = setupFlowingArrowEffect(viewerInstance);
      return cleanup;
    }
  }, [flowConfig, viewerInstance]);

  return (      
    <div className="relative w-full h-full bg-gray-300 rounded-xl overflow-hidden">
      <div
        ref={viewerDivRef}
        id="forgeViewer"
        className="absolute inset-0 w-full h-full"
      />
      {/* Tooltip for hover events */}
      {tooltip.visible && (
        <div
          style={{ top: tooltip.y, left: tooltip.x }}
          className="absolute z-50 p-2 bg-black text-white text-xs whitespace-pre-line pointer-events-none rounded shadow-lg"
        >
          {tooltip.text}
        </div>
      )}
      {/* Tooltip for temperature display on click */}
      {tempTooltip.visible && (
        <div
          style={{ top: tempTooltip.y, left: tempTooltip.x }}
          className="absolute z-50 p-3 bg-red-600 text-white text-sm font-bold pointer-events-none rounded-lg shadow-xl animate-pulse"
        >
          TANK {tempTooltip.id}<br/>TEMP: {tempTooltip.temp} °C
        </div>
      )}
    </div>
  );
}