"use client";

import { useEffect, useState } from "react";
import { NAV_ITEMS } from "@/data/nav-items";
import { COUPLE_MONOGRAM } from "@/data/site-config";
import { useActiveSection } from "./useActiveSection";
import { MobileMenu } from "./MobileMenu";

// Precisa bater com --nav-height em sections.css (usado no scroll-margin-top das seções).
const NAV_HEIGHT_PX = 72;

const SECTION_IDS = NAV_ITEMS.map((item) => item.id);

export function SiteNav() {
  const [solid, setSolid] = useState(false);
  const activeId = useActiveSection(SECTION_IDS, NAV_HEIGHT_PX);

  useEffect(() => {
    function handleScroll() {
      setSolid(window.scrollY > window.innerHeight * 0.7);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`site-nav ${solid ? "site-nav-solid" : ""}`}>
      <a href="#hero" className="site-nav-brand">
        {COUPLE_MONOGRAM}
      </a>
      <nav className="site-nav-links" aria-label="Navegação do site">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className={`site-nav-link ${activeId === item.id ? "is-active" : ""}`}
            aria-current={activeId === item.id ? "location" : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <MobileMenu items={NAV_ITEMS} activeId={activeId} />
    </header>
  );
}
