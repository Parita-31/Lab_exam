import React from "react";

function DduLogo({ height = 45 }) {
    return (
        <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
            {/* SVG Representation of DDU Emblem */}
            <svg
                width={Math.round(height * 1.05)}
                height={height}
                viewBox="0 0 120 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Black tilted square background */}
                <path
                    d="M25 5 L115 5 L95 95 L5 95 Z"
                    fill="#111111"
                />

                {/* White Italic Outer 'D' */}
                <path
                    d="M32 18 C32 18 55 16 68 28 C82 41 80 62 65 76 C53 87 33 82 33 82 L38 68 C38 68 52 72 61 64 C70 54 70 40 60 32 C51 25 36 27 36 27 Z"
                    fill="#FFFFFF"
                />
                
                {/* White vertical bar of 'D' */}
                <path
                    d="M26 18 L36 18 L24 82 L14 82 Z"
                    fill="#FFFFFF"
                />

                {/* Inner Orange Flame / Curved Accent */}
                <path
                    d="M44 32 C48 30 60 30 64 42 C67 52 58 66 48 70 C42 72 40 65 44 58 C47 52 52 45 48 40 C44 36 40 38 44 32 Z"
                    fill="#EA580C"
                />
            </svg>

            {/* DDU Text Typography */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    lineHeight: "1.1",
                    fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
                    fontStyle: "italic",
                    fontWeight: "800",
                    color: "#111827",
                    letterSpacing: "0.02em"
                }}
            >
                <span style={{ fontSize: `${Math.round(height * 0.34)}px` }}>DHARMSINH</span>
                <span style={{ fontSize: `${Math.round(height * 0.34)}px` }}>DESAI</span>
                <span style={{ fontSize: `${Math.round(height * 0.34)}px` }}>UNIVERSITY</span>
            </div>
        </div>
    );
}

export default DduLogo;
