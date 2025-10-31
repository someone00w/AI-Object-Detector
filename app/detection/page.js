"use client";

import React from "react";
import DetectionCuh from "../components/detectioncuh"

export default function DetectionPage() {
  return (
    <main style={{ textAlign: "center", padding: "2rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>Detection System</h1>
      <DetectionCuh />
      <div style={{ marginTop: "1rem" }}>
        <a href="/" style={{ color: "#06f", textDecoration: "underline" }}>
          ⬅ Back to Menu
        </a>
      </div>
    </main
  );
}
