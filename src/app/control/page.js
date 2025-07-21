"use client";

import React, { useEffect, useRef, useState } from "react";
import mqtt from "mqtt";

const Control = () => {
  const clientRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const connectUrl = "wss://broker.hivemq.com:8884/mqtt"; // HiveMQ over WebSockets (SSL)

    const client = mqtt.connect(connectUrl);

    client.on("connect", () => {
      console.log("Connected to MQTT broker");
      setIsConnected(true);
    });

    client.on("error", (err) => {
      console.error("Connection error: ", err);
      client.end();
    });

    clientRef.current = client;

    return () => {
      if (clientRef.current) {
        clientRef.current.end();
      }
    };
  }, []);

  const sendCommand = (command) => {
    if (clientRef.current && isConnected) {
      clientRef.current.publish("ac-command", command);
      console.log(`Published "${command}" to topic "ac-command"`);
    } else {
      console.error("MQTT client not connected");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">AC Control Panel</h1>
      <div className="flex gap-4">
        <button
          onClick={() => sendCommand("on")}
          className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
        >
          AC ON
        </button>
        <button
          onClick={() => sendCommand("off")}
          className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
        >
          AC OFF
        </button>
      </div>
      {!isConnected && (
        <p className="text-sm text-red-500 mt-4">⚠️ Connecting to MQTT broker...</p>
      )}
    </div>
  );
};

export default Control;
