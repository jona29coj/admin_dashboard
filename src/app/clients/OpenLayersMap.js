"use client";
import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { fromLonLat } from "ol/proj";
import { Point } from "ol/geom";
import Feature from "ol/Feature";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import Overlay from "ol/Overlay";

const metalwareOnly = {
  id: 1,
  name: "Metalware",
  position: [77.2090, 28.6139],
  meters: [
    { id: "M1", label: "Main Panel", position: [77.2095, 28.6145], status: "Active" },
    { id: "M2", label: "DG Set", position: [77.2085, 28.6135], status: "Inactive" },
  ],
};

const OpenLayersMap = () => {
  const mapRef = useRef();
  const popupRef = useRef();
  const overlayRef = useRef();

  useEffect(() => {
    const overlay = new Overlay({
      element: popupRef.current,
      positioning: "bottom-center",
      stopEvent: false,
      offset: [0, -10],
    });

    const map = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() })],
      view: new View({
        center: fromLonLat(metalwareOnly.position),
        zoom: 15,
      }),
      overlays: [overlay],
    });

    overlayRef.current = overlay;

    const source = new VectorSource();
    metalwareOnly.meters.forEach((meter) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat(meter.position)),
        label: meter.label,
        id: meter.id,
        status: meter.status,
      });
      feature.setStyle(
        new Style({
          image: new Icon({
            src: "https://cdn-icons-png.flaticon.com/512/149/149059.png",
            scale: 0.04,
          }),
        })
      );
      source.addFeature(feature);
    });

    const vectorLayer = new VectorLayer({ source });
    map.addLayer(vectorLayer);

    map.on("pointermove", (e) => {
      const feature = map.forEachFeatureAtPixel(e.pixel, (f) => f);
      if (feature && feature.get("id")) {
        popupRef.current.innerHTML = `<b>${feature.get("label")}</b><br />ID: ${feature.get("id")}<br />Status: ${feature.get("status")}`;
        overlayRef.current.setPosition(e.coordinate);
      } else {
        overlayRef.current.setPosition(undefined);
      }
    });

    return () => map.setTarget(null);
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="w-full h-full" />
      <div
        ref={popupRef}
        className="absolute z-10 bg-white text-xs px-2 py-1 rounded shadow-md"
        style={{ pointerEvents: "none" }}
      />
    </div>
  );
};

export default OpenLayersMap;
