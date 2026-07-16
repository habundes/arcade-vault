"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/auth-provider";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const isInicio = pathname === "/";
  const isBiblioteca =
    pathname.startsWith("/games") || pathname.startsWith("/juego") || pathname.startsWith("/jugar");
  const isSalon = pathname.startsWith("/salon");
  const isAbout = pathname.startsWith("/about");
  const isAuth = pathname.startsWith("/auth");

  const close = () => setOpen(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <>
      <nav className="av-nav">
        <Link href="/" className="logo">
          <div className="logo-mark"></div>
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          <Link href="/" className={isInicio ? "active" : ""}>
            Inicio
          </Link>
          <Link href="/games" className={isBiblioteca ? "active" : ""}>
            Biblioteca
          </Link>
          <Link href="/salon" className={isSalon ? "active" : ""}>
            Salón de la Fama
          </Link>
          <Link href="/about" className={isAbout ? "active" : ""}>
            Acerca de
          </Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        {user ? (
          <>
            <div className="user-chip">
              <span className="user-name">{user.name}</span>
            </div>
            <button className="btn ghost auth-btn" onClick={handleSignOut}>
              Cerrar Sesión
            </button>
          </>
        ) : (
          <Link href="/auth" className="btn auth-btn">
            Iniciar Sesión
          </Link>
        )}
        <button
          className="btn ghost hamburger"
          onClick={() => setOpen(true)}
          aria-label="Menú"
        >
          ≡
        </button>
      </nav>

      <div
        className={"av-mobile-backdrop" + (open ? " open" : "")}
        onClick={close}
      ></div>
      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>
          MENÚ
        </div>
        <Link href="/" className={isInicio ? "active" : ""} onClick={close}>
          Inicio
        </Link>
        <Link href="/games" className={isBiblioteca ? "active" : ""} onClick={close}>
          Biblioteca
        </Link>
        <Link href="/salon" className={isSalon ? "active" : ""} onClick={close}>
          Salón de la Fama
        </Link>
        <Link href="/about" className={isAbout ? "active" : ""} onClick={close}>
          Acerca de
        </Link>
        {!user && (
          <Link href="/auth" className={isAuth ? "active" : ""} onClick={close}>
            Iniciar Sesión
          </Link>
        )}
        <div style={{ flex: 1 }}></div>
        {user && (
          <>
            <div
              className="pixel neon-magenta"
              style={{ fontSize: 10, marginBottom: 8, textAlign: "center" }}
            >
              {user.name}
            </div>
            <button
              className="btn ghost"
              style={{ width: "100%", marginBottom: 12 }}
              onClick={() => {
                close();
                handleSignOut();
              }}
            >
              Cerrar Sesión
            </button>
          </>
        )}
        <div
          className="pixel"
          style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}
        >
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
