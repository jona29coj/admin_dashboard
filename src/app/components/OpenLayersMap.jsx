'use client';

import React, { useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Style, Icon, Text, Fill, Stroke } from 'ol/style';

const OpenLayersMap = () => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef();

  useEffect(() => {
    if (mapRef.current) return;

    const metalwareCoordinates = fromLonLat([77.2090, 28.6139]);

    const marker = new Feature({
      geometry: new Point(metalwareCoordinates),
    });

    marker.setStyle(
      new Style({
        image: new Icon({
          anchor: [0.5, 1],
          src: 'https://cdn-icons-png.flaticon.com/512/252/252025.png',
    scale: 0.03,
        }),
        text: new Text({
          text: 'Metalware',
          offsetY: -25,
          font: 'bold 12px Arial',
          fill: new Fill({ color: '#000' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
        }),
      })
    );

    const vectorLayer = new VectorLayer({
      source: new VectorSource({
        features: [marker],
      }),
    });

    mapRef.current = new Map({
      target: mapContainerRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        vectorLayer,
      ],
      view: new View({
        center: metalwareCoordinates,
        zoom: 14,
      }),
    });
  }, []);

  return <div ref={mapContainerRef} className="w-full h-full" />;
};

export default OpenLayersMap;
