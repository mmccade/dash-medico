// src/components/Logo.jsx
export default function Logo({ small }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", lineHeight: 0.92 }}>
      <span style={{
        fontSize: small ? 20 : 24, fontWeight: 600, color: "var(--brand)",
        letterSpacing: 0.5,
      }}>
        MUREV
      </span>
      <span style={{
        fontSize: small ? 8 : 9.5, fontWeight: 600, color: "var(--inkFaint)",
        letterSpacing: small ? 1.5 : 2.4, textTransform: "uppercase",
      }}>
        Acompanha
      </span>
    </div>
  );
}
