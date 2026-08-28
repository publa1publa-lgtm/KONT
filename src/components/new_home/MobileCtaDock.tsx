"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuthModal } from "@/contexts/auth-modal-context";
import { useMessages } from "@/contexts/messages-context";
import { useStartWorkspace } from "@/hooks/useStartWorkspace";

export function MobileCtaDock() {
  const { landing, story } = useMessages();
  const { start, isAuthenticated, studioHref } = useStartWorkspace();
  const { open: authOpen } = useAuthModal();
  const [show, setShow] = useState(false);
  const label = isAuthenticated ? story.nav.studio : landing.hero.ctaPrimary;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    let io: IntersectionObserver | null = null;
    const heroVisible = { current: true };
    const footerVisible = { current: false };

    const apply = () => {
      setShow(mq.matches && !heroVisible.current && !footerVisible.current);
    };

    const observe = () => {
      io?.disconnect();
      io = null;
      if (!mq.matches) {
        heroVisible.current = true;
        footerVisible.current = false;
        apply();
        return;
      }

      const heroCta = document.querySelector(".hero2__actions .home-screen__cta");
      const footer = document.querySelector("#footer-cta");
      if (!heroCta) {
        apply();
        return;
      }

      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.target === heroCta) heroVisible.current = entry.isIntersecting;
            if (footer && entry.target === footer) footerVisible.current = entry.isIntersecting;
          }
          apply();
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
      );

      io.observe(heroCta);
      if (footer) io.observe(footer);
    };

    observe();
    mq.addEventListener("change", observe);
    return () => {
      mq.removeEventListener("change", observe);
      io?.disconnect();
      document.documentElement.classList.remove("nh-mobile-dock-active");
    };
  }, []);

  const visible = show && !authOpen;

  useEffect(() => {
    document.documentElement.classList.toggle("nh-mobile-dock-active", visible);
    return () => document.documentElement.classList.remove("nh-mobile-dock-active");
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="nh-mobile-dock" role="region" aria-label={label}>
      {isAuthenticated ? (
        <a href={studioHref} className="nh-mobile-dock__cta home-screen__cta">
          {label}
          <ArrowRight className="home-screen__cta-icon" aria-hidden />
        </a>
      ) : (
        <button type="button" className="nh-mobile-dock__cta home-screen__cta cursor-pointer" onClick={start}>
          {label}
          <ArrowRight className="home-screen__cta-icon" aria-hidden />
        </button>
      )}
    </div>
  );
}
