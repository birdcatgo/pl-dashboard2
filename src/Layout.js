import Link from "next/link";

export default function Layout({ children }) {
  return (
    <div>
      <header style={{ padding: "1rem", background: "#333", color: "#fff" }}>
        <h1>My Dashboard</h1>
        <nav style={{ marginTop: "1rem" }}>
          <Link href="/" style={{ color: "#fff", marginRight: "1rem" }}>
            Home
          </Link>
          <Link href="/about" style={{ color: "#fff", marginRight: "1rem" }}>
            About
          </Link>
          <Link href="/dashboard" style={{ color: "#fff" }}>
            Dashboard
          </Link>
        </nav>
      </header>
      <main style={{ padding: "1rem" }}>{children}</main>
      <footer style={{ padding: "1rem", background: "#333", color: "#fff" }}>
        <p>&copy; 2024 My Dashboard</p>
      </footer>
    </div>
  );
}
