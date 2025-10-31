"use client";

import Link from "next/link";
import React from "react";

export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "radial-gradient(circle at top, #0f2027, #203a43, #2c5364)",
        color: "#fff",
        fontFamily: "'Poppins', sans-serif",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "3rem",
          fontWeight: "700",
          letterSpacing: "1px",
          textShadow: "0 0 15px rgba(255, 255, 255, 0.2)",
          marginBottom: "1.5rem",
        }}
      >
        Welcome to <span style={{ color: "#00ffff" }}>Shafiriz PedoWatch</span>
      </h1>

      <p
        style={{
          maxWidth: "500px",
          opacity: 0.85,
          marginBottom: "2rem",
          fontSize: "1.1rem",
          lineHeight: "1.6",
        }}
      >
        Real-time AI detection powered by TensorFlow and a dash of tech magic.
        Let’s catch some action 👀.
      </p>

      <Link
        href="/menu"
        style={{
          display: "inline-block",
          padding: "1rem 2rem",
          background: "linear-gradient(90deg, #00c6ff, #0072ff)",
          borderRadius: "12px",
          color: "#fff",
          fontWeight: "600",
          textDecoration: "none",
          letterSpacing: "0.5px",
          boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)",
          transition: "transform 0.2s ease, box-shadow 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.boxShadow = "0 0 30px rgba(0, 255, 255, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.3)";
        }}
      >
        🚀 Start Detection
      </Link>

      <footer
        style={{
          position: "absolute",
          bottom: "1rem",
          fontSize: "0.9rem",
          opacity: 0.5,
        }}
      >
        Made with ❤️ and TensorFlow
      </footer>
    </main>
  );
}
