"use client";

import { useLayoutEffect, type RefObject } from "react";

/** Соцсети для водопада на /home */
const ICONS = [
  "facebook.svg",
  "instagram.svg",
  "tiktok.svg",
  "youtube.svg",
  "telegram.svg",
  "x.svg",
] as const;

const ICON_BASE = "/home/icons";

const STREAM_MIN = 0.28;
const STREAM_MAX = 1;
const EDGE_LANE_RATIO = 0.15;
const EDGE_FADE_OUT_SEC = 1.05;
const EDGE_SPAWN_BLEND_START = 0.18;
/** Доля scroll-track-post для blend 0→1 (больше = длиннее и плавнее) */
const EDGE_BLEND_SCROLL_RATIO = 0.88;
const SPEED_BOOST = 1.12;
const FALL_SECONDS_AT_START = 3.6;
/** Плавное следование display-значений за скроллом (1/с) */
const SCROLL_SMOOTH_HZ = 5.5;
const ICON_OPACITY_PEAK = 0.94;
const NARROW_BEAM_RATIO = STREAM_MIN + 0.06;
const SPAWN_MIN_AT_NARROW = 280 / SPEED_BOOST;
const SPAWN_MAX_AT_NARROW = 520 / SPEED_BOOST;
const SPAWN_MIN_AT_WIDE = 110 / SPEED_BOOST;
const SPAWN_MAX_AT_WIDE = 240 / SPEED_BOOST;
/** Верхняя граница одновременных иконок (ниже = стабильнее 60fps с DevTools) */
const PARTICLES_CAP_NARROW = 36;
const PARTICLES_CAP_WIDE_MAX = 44;
const PARTICLES_CAP_EDGE_MAX = 52;
const INITIAL_PARTICLES_MIN = 12;
const INITIAL_PARTICLES_MAX = 20;

type Lane = "left" | "right";

type Particle = {
  el: HTMLDivElement;
  x: number;
  y: number;
  size: number;
  lane: Lane | null;
  speed: number;
  drift: number;
  rot: number;
  rotSpeed: number;
  phase: number;
  swayAmp: number;
  swaySpeed: number;
  life: number;
  fadeInDur: number;
  fadeOut: boolean;
  fadeOutT: number;
};

export type FallingIconsTargets = {
  root: HTMLElement | null;
  hero: HTMLElement | null;
  stream: HTMLDivElement | null;
  scrollHint: RefObject<HTMLParagraphElement | null>;
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function smoothstep(t: number) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

/** Мягкая S-кривая для фаз скролла */
function easeScroll(t: number) {
  return smoothstep(Math.max(0, Math.min(1, t)));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function useFallingIcons(targets: FallingIconsTargets) {
  const { root, hero, stream } = targets;

  useLayoutEffect(() => {
    if (!root || !hero || !stream) return;

    const rootEl = root;
    const heroEl = hero;
    const streamEl = stream;
    const scrollHint = targets.scrollHint.current;

    const particles: Particle[] = [];
    let rafId = 0;
    let lastTime = 0;
    let spawnTimer = 0;
    let nextSpawnIn = SPAWN_MAX_AT_NARROW;
    let centerX = window.innerWidth / 2;
    let viewportH = window.innerHeight;
    let heroHeight = viewportH * 2;
    let streamRatio = STREAM_MIN;
    let streamWidth = window.innerWidth * streamRatio;
    let maxParticles = 24;
    let spawnMinMs = 240;
    let spawnMaxMs = 460;
    let burstChance = 0.1;
    let wasNarrowBeam = false;
    let wasEdgeDense = false;
    let dualLaneBlend = 0;
    let targetDualLaneBlend = 0;
    let targetStreamRatio = STREAM_MIN;
    let scrollStateSynced = false;
    let loopActive = true;
    let hasUserScrolled = false;

    function readHeroMetrics() {
      viewportH = window.innerHeight;
      heroHeight = Math.max(heroEl.offsetHeight, viewportH);
    }

    function streamProgress() {
      return Math.max(
        0,
        Math.min(1, (streamRatio - STREAM_MIN) / (STREAM_MAX - STREAM_MIN))
      );
    }

    function isNarrowBeamScroll() {
      if (dualLaneBlend > 0.08) return false;
      return streamRatio <= NARROW_BEAM_RATIO;
    }

    /** Боковые полосы отключены — иконки всегда на всю ширину (как на hero/blue). */
    function dualLaneBlendFromScroll() {
      return 0;
    }

    function spawnXInEdgeLane(size: number, side: Lane) {
      const w = window.innerWidth;
      const laneW = w * EDGE_LANE_RATIO;
      if (side === "left") {
        return randomBetween(0, Math.max(0, laneW - size));
      }
      return randomBetween(w - laneW, w - size);
    }

    function laneBounds(side: Lane, size: number) {
      const w = window.innerWidth;
      const laneW = w * EDGE_LANE_RATIO;
      if (side === "left") {
        return { minX: 0, maxX: laneW - size };
      }
      return { minX: w - laneW, maxX: w - size };
    }

    function spawnXForFall(size: number, beamHalf: number) {
      return centerX + randomBetween(-beamHalf, beamHalf) - size / 2;
    }

    function computeFallSpeed(size: number, startY: number) {
      const spawnAbove = startY < 0 ? -startY : 0;
      const travel = heroHeight + spawnAbove + size * 0.5;
      const fallSeconds =
        FALL_SECONDS_AT_START * Math.max(1, heroHeight / Math.max(1, viewportH));
      return (travel / fallSeconds) * randomBetween(0.94, 1.06);
    }

    function beginCenterFadeOut() {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p.lane && !p.fadeOut) {
          p.fadeOut = true;
          p.fadeOutT = 0;
        }
      }
    }

    function updateStreamMask() {
      const t = dualLaneBlend;
      if (t < 0.02) {
        streamEl.style.maskImage = "none";
        streamEl.style.webkitMaskImage = "none";
        return;
      }
      const lane = EDGE_LANE_RATIO * 100 * t;
      const feather = lerp(0.4, 1.35, easeScroll(t));
      const inner = lane + feather;
      const outer = 100 - lane - feather;
      const gradient =
        "linear-gradient(90deg, #000 0%, #000 " +
        lane +
        "%, transparent " +
        inner +
        "%, transparent " +
        outer +
        "%, #000 " +
        (100 - lane) +
        "%, #000 100%)";
      streamEl.style.webkitMaskImage = gradient;
      streamEl.style.maskImage = gradient;
    }

    function updateSpawnRates() {
      const t = streamProgress();
      const narrowBeam = isNarrowBeamScroll();

      if (dualLaneBlend > EDGE_SPAWN_BLEND_START) {
        const mix = smoothstep(
          (dualLaneBlend - EDGE_SPAWN_BLEND_START) /
            (1 - EDGE_SPAWN_BLEND_START)
        );
        maxParticles = Math.round(lerp(40, PARTICLES_CAP_EDGE_MAX, mix));
        spawnMinMs = lerp(140, 72, mix);
        spawnMaxMs = lerp(260, 120, mix);
        burstChance = lerp(0.12, 0.2, mix);
        return;
      }

      if (narrowBeam) {
        maxParticles = PARTICLES_CAP_NARROW;
        spawnMinMs = 130;
        spawnMaxMs = 240;
        burstChance = 0.14;
        return;
      }

      const cap = lerp(26, PARTICLES_CAP_WIDE_MAX, easeScroll(t));
      maxParticles = Math.round(cap);
      spawnMinMs = lerp(SPAWN_MIN_AT_NARROW, SPAWN_MIN_AT_WIDE, t);
      spawnMaxMs = lerp(SPAWN_MAX_AT_NARROW, SPAWN_MAX_AT_WIDE, t);
      burstChance = lerp(0.08, 0.14, t);
      nextSpawnIn = Math.min(
        nextSpawnIn,
        randomBetween(spawnMinMs, spawnMaxMs)
      );
    }

    function updateScrollHint() {
      if (!scrollHint) return;
      const vh = viewportH || window.innerHeight;
      const heroBottom = heroEl.getBoundingClientRect().bottom;
      scrollHint.classList.toggle(
        "is-hidden",
        vh > 0 && (window.scrollY > vh * 0.35 || heroBottom < vh * 0.25)
      );
    }

    function updateRootScrollClasses() {
      rootEl.classList.toggle("is-edge-transition", dualLaneBlend > 0.06);
      rootEl.classList.toggle("is-edge-lanes", dualLaneBlend > 0.72);
    }

    function shouldSpawnEdgeThisFrame() {
      if (dualLaneBlend >= 0.42) return true;
      if (dualLaneBlend < EDGE_SPAWN_BLEND_START) return false;
      const t =
        (dualLaneBlend - EDGE_SPAWN_BLEND_START) /
        (1 - EDGE_SPAWN_BLEND_START);
      return Math.random() < lerp(0.35, 0.88, easeScroll(t));
    }

    function edgeSpawnBatchSize() {
      if (dualLaneBlend >= 0.92) return 2;
      if (dualLaneBlend >= 0.72) return 2;
      if (dualLaneBlend >= 0.42) return 1;
      return 1;
    }

    function pickIconSrc() {
      const name = ICONS[(Math.random() * ICONS.length) | 0];
      const colored = Math.random() < 0.52;
      return (colored ? `${ICON_BASE}/color/` : `${ICON_BASE}/`) + name;
    }

    function pickBlurClass() {
      const r = Math.random();
      if (r < 0.06) return " icon-fall--blur-deep";
      if (r < 0.2) return " icon-fall--blur";
      return "";
    }

    function createIconElement(src: string, blurClass: string, size: number) {
      const el = document.createElement("div");
      el.className =
        "icon-fall" +
        (src.includes("/color/") ? " icon-fall--color" : "") +
        blurClass;
      const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.width = size;
      img.height = size;
      img.decoding = "async";
      el.appendChild(img);
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      streamEl.appendChild(el);
      return el;
    }

    function trimParticlesToCap() {
      while (particles.length > maxParticles) {
        const p = particles.pop();
        if (p) p.el.remove();
      }
    }

    function spawnFall(yOverride?: number, forceEdge?: boolean) {
      const blend = dualLaneBlend;
      const useEdge = forceEdge || shouldSpawnEdgeThisFrame();

      if (!useEdge && blend > 0.22) return;

      const blurClass = pickBlurClass();
      const isDeepBlur = blurClass.includes("deep");
      const edgeLane = useEdge;
      const narrowBeam = !edgeLane && isNarrowBeamScroll();
      const size =
        narrowBeam || edgeLane
          ? randomBetween(24, 34)
          : randomBetween(isDeepBlur ? 32 : 22, isDeepBlur ? 48 : 42);
      const startY =
        yOverride !== undefined
          ? yOverride
          : -size - randomBetween(24, 90);

      const src = pickIconSrc();
      const el = createIconElement(src, blurClass, size);

      let spawnX: number;
      let lane: Lane | null = null;
      let drift: number;
      let swayAmp: number;
      let fadeInDur = randomBetween(0.45, 0.82);

      if (edgeLane) {
        lane = Math.random() < 0.5 ? "left" : "right";
        spawnX = spawnXInEdgeLane(size, lane);
        drift =
          lane === "left"
            ? -randomBetween(0.01, 0.04)
            : randomBetween(0.01, 0.04);
        swayAmp = randomBetween(6, 16);
        if (blend < 1) {
          fadeInDur = randomBetween(0.55, 1.05);
        }
      } else {
        const beamHalf = narrowBeam
          ? (window.innerWidth * STREAM_MIN) / 2
          : streamWidth / 2;
        spawnX = spawnXForFall(size, beamHalf);
        drift = randomBetween(-0.05, 0.05);
        swayAmp = randomBetween(5, 12);
      }

      particles.push({
        el,
        x: spawnX,
        y: startY,
        size,
        lane,
        speed: computeFallSpeed(size, startY),
        drift,
        rot: randomBetween(-12, 12),
        rotSpeed: randomBetween(-0.35, 0.35),
        phase: Math.random() * Math.PI * 2,
        swayAmp,
        swaySpeed: randomBetween(0.45, 0.85),
        life: 0,
        fadeInDur,
        fadeOut: false,
        fadeOutT: 0,
      });
    }

    function spawn() {
      const batch = dualLaneBlend >= 0.4 ? edgeSpawnBatchSize() : 1;
      for (let i = 0; i < batch; i++) {
        if (particles.length >= maxParticles) break;
        if (dualLaneBlend >= 0.4) {
          spawnFall(undefined, true);
        } else {
          spawnFall();
        }
      }
    }

    function opacityForFall(p: Particle) {
      const enter = smoothstep(p.life / p.fadeInDur);
      const span = heroHeight + p.size;
      const travel = (p.y + p.size * 0.5) / span;
      const exit = travel > 0.88 ? 1 - smoothstep((travel - 0.88) / 0.12) : 1;
      let opacity = enter * exit * ICON_OPACITY_PEAK;

      if (p.fadeOut) {
        opacity *= 1 - easeScroll(p.fadeOutT / EDGE_FADE_OUT_SEC);
      } else if (!p.lane && dualLaneBlend > 0) {
        opacity *= 1 - easeScroll(dualLaneBlend * 0.92);
      }

      return opacity;
    }

    function clampFallX(p: Particle, x: number) {
      if (!p.lane) return x;
      const b = laneBounds(p.lane, p.size);
      return Math.max(b.minX, Math.min(b.maxX, x));
    }

    function updateFall(p: Particle, dt: number) {
      if (p.fadeOut) p.fadeOutT += dt;

      p.life += dt;
      p.y += p.speed * dt;
      p.x += p.drift * dt * 40;
      p.rot += p.rotSpeed * dt * 40;

      const swayX = Math.sin(p.life * p.swaySpeed + p.phase) * p.swayAmp;
      const drawX = clampFallX(p, p.x + swayX);
      const opacity = opacityForFall(p);

      p.el.style.opacity = String(Math.max(0, Math.min(1, opacity)));
      p.el.style.transform = `translate3d(${drawX}px,${p.y}px,0) rotate(${p.rot}deg)`;
    }

    function removeFadedAndDead() {
      const fallLimit = heroHeight + 80;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const faded = p.fadeOut && p.fadeOutT >= EDGE_FADE_OUT_SEC;
        const dead = p.y > fallLimit;

        if (faded || dead) {
          p.el.remove();
          particles.splice(i, 1);
        }
      }
    }

    function readScrollTargets() {
      targetDualLaneBlend = dualLaneBlendFromScroll();
      targetStreamRatio = streamRatioFromScroll();
    }

    function smoothScrollState(dt: number) {
      const k = 1 - Math.exp(-SCROLL_SMOOTH_HZ * dt);

      if (targetDualLaneBlend > 0.04 && dualLaneBlend < 0.04) {
        beginCenterFadeOut();
      }

      dualLaneBlend += (targetDualLaneBlend - dualLaneBlend) * k;
      streamRatio += (targetStreamRatio - streamRatio) * k;

      document.documentElement.style.setProperty(
        "--dual-lane-blend",
        String(dualLaneBlend)
      );
      document.documentElement.style.setProperty(
        "--stream-ratio",
        String(streamRatio)
      );
      document.documentElement.style.setProperty(
        "--edge-lane-pct",
        `${EDGE_LANE_RATIO * 100}%`
      );

      streamWidth = window.innerWidth * streamRatio;
      updateStreamMask();
      updateRootScrollClasses();
      updateSpawnRates();
    }

    function tick(now: number) {
      if (!loopActive || document.hidden) return;

      if (!lastTime) lastTime = now;
      const dt = Math.min(0.032, (now - lastTime) / 1000);
      lastTime = now;

      readScrollTargets();
      smoothScrollState(dt);

      if (dt > 0) {
        spawnTimer += dt * 1000;
        if (spawnTimer >= nextSpawnIn) {
          spawn();
          if (Math.random() < burstChance) spawn();
          spawnTimer = 0;
          nextSpawnIn = randomBetween(spawnMinMs, spawnMaxMs);
        }

        for (let i = 0; i < particles.length; i++) {
          updateFall(particles[i], dt);
        }
      }
      removeFadedAndDead();

      rafId = requestAnimationFrame(tick);
    }

    function startLoop() {
      if (rafId || document.hidden) return;
      loopActive = true;
      lastTime = 0;
      rafId = requestAnimationFrame(tick);
    }

    function stopLoop() {
      loopActive = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      lastTime = 0;
    }

    function streamRatioFromScroll() {
      const span = heroHeight;
      if (span <= 0) return STREAM_MIN;

      const y = window.scrollY;
      if (y <= span) {
        return (
          STREAM_MIN +
          (STREAM_MAX - STREAM_MIN) * easeScroll(y / span)
        );
      }
      return STREAM_MAX;
    }

    function syncScrollVisuals(instant = false) {
      readScrollTargets();
      if (instant || !scrollStateSynced) {
        dualLaneBlend = targetDualLaneBlend;
        streamRatio = targetStreamRatio;
        streamWidth = window.innerWidth * streamRatio;
        document.documentElement.style.setProperty(
          "--dual-lane-blend",
          String(dualLaneBlend)
        );
        document.documentElement.style.setProperty(
          "--stream-ratio",
          String(streamRatio)
        );
        document.documentElement.style.setProperty(
          "--edge-lane-pct",
          `${EDGE_LANE_RATIO * 100}%`
        );
        updateStreamMask();
        updateRootScrollClasses();
        updateSpawnRates();
        scrollStateSynced = true;
        return;
      }
      smoothScrollState(1 / 60);
    }

    function applyScrollState(options?: { allowBurstSpawn?: boolean }) {
      const allowBurstSpawn = options?.allowBurstSpawn !== false;
      const vh = viewportH || window.innerHeight;

      syncScrollVisuals();

      if (allowBurstSpawn && hasUserScrolled) {
        const narrowNow = isNarrowBeamScroll();
        const atScrollStart = window.scrollY < vh * 0.45;
        if (narrowNow && !wasNarrowBeam && atScrollStart) {
          const count = Math.min(maxParticles - 4, Math.round(heroHeight / 40));
          for (let i = 0; i < count; i++) {
            if (particles.length >= maxParticles) break;
            spawnFall(
              -heroHeight * 0.08 -
                (heroHeight / count) * i * randomBetween(0.9, 1.1)
            );
          }
        }
        wasNarrowBeam = narrowNow;

        if (dualLaneBlend >= 0.78 && !wasEdgeDense) {
          const count = Math.min(maxParticles - 2, Math.round(heroHeight / 28));
          for (let i = 0; i < count; i++) {
            if (particles.length >= maxParticles) break;
            spawnFall(
              -heroHeight * 0.06 -
                (heroHeight / count) * i * randomBetween(0.82, 1.1),
              true
            );
          }
        }
        wasEdgeDense = dualLaneBlend >= 0.78;
      }

      updateScrollHint();
    }

    function onScroll() {
      hasUserScrolled = true;
      applyScrollState({ allowBurstSpawn: true });
    }

    /** Только геометрия — без burst-спавна (DevTools resize). */
    function onResize() {
      centerX = window.innerWidth / 2;
      readHeroMetrics();
      readScrollTargets();
      syncScrollVisuals(true);
      updateSpawnRates();
      trimParticlesToCap();
      updateScrollHint();
    }

    function onVisibilityChange() {
      if (document.hidden) {
        stopLoop();
        return;
      }
      startLoop();
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibilityChange);

    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !document.hidden) {
          startLoop();
        } else {
          stopLoop();
        }
      },
      { threshold: 0 }
    );
    heroObserver.observe(heroEl);

    readHeroMetrics();

    // Первичная синхронизация без "burst" спавна (иначе при загрузке выглядит как внезапная пачка).
    applyScrollState({ allowBurstSpawn: false });
    wasNarrowBeam = isNarrowBeamScroll();
    wasEdgeDense = dualLaneBlend >= 0.78;

    const initial = Math.round(
      lerp(INITIAL_PARTICLES_MIN, INITIAL_PARTICLES_MAX, streamProgress())
    );
    for (let i = 0; i < initial; i++) {
      // Распределяем по всей высоте hero (200vh): сверху и внутри градиента.
      const roll = Math.random();
      let startY: number;
      if (roll < 0.45) {
        const spread = Math.max(1, heroHeight * 0.55);
        startY = -randomBetween(24, spread) - i * randomBetween(8, 18);
      } else {
        startY = randomBetween(-heroHeight * 0.05, heroHeight * 0.92);
      }
      spawnFall(startY);
    }

    for (const p of particles) {
      updateFall(p, 1 / 60);
    }

    if (!document.hidden) {
      const heroVisible = heroEl.getBoundingClientRect().bottom > 0;
      if (heroVisible) startLoop();
    }

    return () => {
      heroObserver.disconnect();
      stopLoop();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      for (const p of particles) {
        p.el.remove();
      }
      particles.length = 0;
      streamEl.replaceChildren();
      document.documentElement.style.removeProperty("--dual-lane-blend");
      document.documentElement.style.removeProperty("--edge-lane-pct");
      document.documentElement.style.removeProperty("--stream-ratio");
    };
  }, [root, hero, stream, targets.scrollHint]);
}
