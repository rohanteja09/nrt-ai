"use client";

import { useEffect, useRef } from "react";

const DAY_TEXTURE = "https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg";
const NIGHT_TEXTURE = "https://unpkg.com/three-globe@2.31.0/example/img/earth-night.jpg";

// Rough lat/lon of major hubs, used as endpoints for the glowing connection arcs.
const HUBS: [number, number][] = [
  [37.77, -122.42], // San Francisco
  [40.71, -74.0], // New York
  [51.51, -0.13], // London
  [48.85, 2.35], // Paris
  [35.68, 139.69], // Tokyo
  [1.35, 103.82], // Singapore
  [19.08, 72.88], // Mumbai
  [-33.87, 151.21], // Sydney
  [55.76, 37.62], // Moscow
  [-23.55, -46.63], // Sao Paulo
  [25.2, 55.27], // Dubai
  [13.09, 80.27], // Chennai
];

function toVector3(lat: number, lon: number, radius: number, THREE: typeof import("three")) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/** Simple radial-gradient sphere texture, generated on a canvas — no network request. */
function planetTexture(THREE: typeof import("three"), stops: [number, string][]) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  stops.forEach(([offset, color]) => grad.addColorStop(offset, color));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  // a few faint noise patches for a less flat look
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#000000" : "#ffffff";
    const r = 3 + Math.random() * 8;
    ctx.beginPath();
    ctx.arc(Math.random() * 128, Math.random() * 128, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function Globe3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      const container = containerRef.current;
      if (cancelled || !container) return;

      const disposables: { dispose: () => void }[] = [];
      const track = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x);

      const scene = new THREE.Scene();

      // Deep-space background (radial gradient) so no page background ever
      // shows through the gaps between stars — solid space, not white/gray.
      const bgCanvas = document.createElement("canvas");
      bgCanvas.width = bgCanvas.height = 512;
      const bgCtx = bgCanvas.getContext("2d")!;
      const grad = bgCtx.createRadialGradient(256, 220, 40, 256, 256, 380);
      grad.addColorStop(0, "#0b1330");
      grad.addColorStop(0.55, "#04070f");
      grad.addColorStop(1, "#000103");
      bgCtx.fillStyle = grad;
      bgCtx.fillRect(0, 0, 512, 512);
      const bgTexture = track(new THREE.CanvasTexture(bgCanvas));
      scene.background = bgTexture;

      const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.z = 2.15;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(window.innerWidth, window.innerHeight);
      container.appendChild(renderer.domElement);

      // Sunlight (creates a realistic day/night terminator across the sphere).
      // Fixed in world space — the globe rotates under it, like the real thing.
      const sun = new THREE.DirectionalLight(0xffffff, 2.8);
      sun.position.set(4, 1.6, 2.5);
      scene.add(sun);
      scene.add(new THREE.AmbientLight(0x4466bb, 0.42));

      // Small moon, visible only when it's night in India right now
      const moon = new THREE.Mesh(
        track(new THREE.SphereGeometry(0.16, 32, 32)),
        new THREE.MeshStandardMaterial({ color: 0xd6dbe6, roughness: 0.9, metalness: 0 })
      );
      moon.position.set(-3.4, 2.1, -5.5);
      scene.add(moon);

      const globeGroup = new THREE.Group();
      globeGroup.rotation.z = (23.4 * Math.PI) / 180;
      scene.add(globeGroup);

      // Orient the globe so India faces the fixed sun (day) or faces away
      // from it (night), matching the real clock in India right now (IST,
      // UTC+5:30) — so opening the site in the morning shows a lit globe
      // and opening it at night shows the dark side with city lights + moon.
      const now = new Date();
      const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
      const istHour = (utcHours + 5.5) % 24;
      const isDayInIndia = istHour >= 6 && istHour < 18;
      moon.visible = !isDayInIndia;

      const INDIA: [number, number] = [21, 78.96];
      const indiaLocal = toVector3(INDIA[0], INDIA[1], 1, THREE);
      const indiaAzimuth = Math.atan2(indiaLocal.x, indiaLocal.z);
      const sunAzimuth = Math.atan2(sun.position.x, sun.position.z);
      const targetAzimuth = isDayInIndia ? sunAzimuth : sunAzimuth + Math.PI;
      globeGroup.rotation.y = targetAzimuth - indiaAzimuth;

      const sphereGeo = track(new THREE.SphereGeometry(1, 96, 96));

      const placeholder = new THREE.Mesh(
        sphereGeo,
        new THREE.MeshBasicMaterial({ color: 0x1e293b, transparent: true, opacity: 0.9 })
      );
      globeGroup.add(placeholder);

      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      let dayTex: import("three").Texture | null = null;
      let nightTex: import("three").Texture | null = null;

      const tryBuildEarth = () => {
        if (!dayTex || !nightTex || cancelled) return;
        const earth = new THREE.Mesh(
          sphereGeo,
          new THREE.MeshStandardMaterial({
            map: dayTex,
            emissiveMap: nightTex,
            emissive: new THREE.Color(0xffffff),
            emissiveIntensity: 1.5,
            roughness: 0.75,
            metalness: 0,
          })
        );
        globeGroup.add(earth);
        placeholder.visible = false;
      };

      loader.load(DAY_TEXTURE, (tex) => {
        if (cancelled) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        dayTex = tex;
        tryBuildEarth();
      });
      loader.load(NIGHT_TEXTURE, (tex) => {
        if (cancelled) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        nightTex = tex;
        tryBuildEarth();
      });

      // Warm glowing arcs connecting hub cities, like flight/data routes
      const arcsGroup = new THREE.Group();
      globeGroup.add(arcsGroup);
      const arcMaterial = new THREE.LineBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
      });
      const arcCount = 16;
      for (let i = 0; i < arcCount; i++) {
        const a = HUBS[Math.floor(Math.random() * HUBS.length)];
        let b = HUBS[Math.floor(Math.random() * HUBS.length)];
        while (b === a) b = HUBS[Math.floor(Math.random() * HUBS.length)];

        const start = toVector3(a[0], a[1], 1.006, THREE);
        const end = toVector3(b[0], b[1], 1.006, THREE);
        const mid = start.clone().add(end).multiplyScalar(0.5);
        const arcHeight = 1 + start.distanceTo(end) * 0.35;
        mid.normalize().multiplyScalar(arcHeight);

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const points = curve.getPoints(48);
        const geo = track(new THREE.BufferGeometry().setFromPoints(points));
        arcsGroup.add(new THREE.Line(geo, arcMaterial));
      }

      // Glowing node points at the hub cities
      const nodePositions = new Float32Array(HUBS.length * 3);
      HUBS.forEach(([lat, lon], i) => {
        const v = toVector3(lat, lon, 1.012, THREE);
        nodePositions[i * 3] = v.x;
        nodePositions[i * 3 + 1] = v.y;
        nodePositions[i * 3 + 2] = v.z;
      });
      const nodeGeo = track(new THREE.BufferGeometry());
      nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));
      const nodes = new THREE.Points(
        nodeGeo,
        new THREE.PointsMaterial({
          color: 0xfcd34d,
          size: 0.022,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
        })
      );
      arcsGroup.add(nodes);

      // Atmosphere rim glow
      const atmosphere = new THREE.Mesh(
        track(new THREE.SphereGeometry(1.15, 64, 64)),
        new THREE.ShaderMaterial({
          vertexShader: `
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,
          fragmentShader: `
            varying vec3 vNormal;
            void main() {
              float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
              gl_FragColor = vec4(0.35, 0.55, 0.98, 1.0) * intensity;
            }`,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          transparent: true,
          depthWrite: false,
        })
      );
      scene.add(atmosphere);

      // Starfield — stars all around, so rotating the view never reveals a gap
      const starCount = 1800;
      const starPositions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        const r = 6 + Math.random() * 40;
        const theta = Math.acos(2 * Math.random() - 1);
        const phi = Math.random() * Math.PI * 2;
        starPositions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
        starPositions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
        starPositions[i * 3 + 2] = r * Math.cos(theta);
      }
      const starGeo = track(new THREE.BufferGeometry());
      starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
      const stars = new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({ color: 0xbfdbfe, size: 0.045, transparent: true, opacity: 0.85, depthWrite: false })
      );
      scene.add(stars);

      // ---- Satellites: a few small craft, each on its own tilted orbital
      // plane fixed in world space, circling independently of the globe's spin.
      const satBodyGeo = track(new THREE.BoxGeometry(0.045, 0.045, 0.07));
      const satPanelGeo = track(new THREE.BoxGeometry(0.16, 0.005, 0.05));
      const satDishGeo = track(new THREE.ConeGeometry(0.02, 0.025, 12));
      const satPanelMat = new THREE.MeshStandardMaterial({
        color: 0x1d4ed8,
        emissive: 0x3b82f6,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.2,
      });

      function buildSatellite(scale: number, bodyColor: number) {
        const group = new THREE.Group();
        group.add(new THREE.Mesh(satBodyGeo, new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.4, metalness: 0.6 })));
        const panelL = new THREE.Mesh(satPanelGeo, satPanelMat);
        panelL.position.x = -0.11;
        const panelR = new THREE.Mesh(satPanelGeo, satPanelMat);
        panelR.position.x = 0.11;
        group.add(panelL, panelR);
        const dish = new THREE.Mesh(satDishGeo, new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5, metalness: 0.4 }));
        dish.position.z = 0.045;
        dish.rotation.x = Math.PI / 2;
        group.add(dish);
        group.scale.setScalar(scale);
        return group;
      }

      const satelliteConfigs = [
        { incline: 32, twist: 8, radius: 1.55, speed: 0.18, scale: 1, color: 0xcbd5e1 },
        { incline: -18, twist: 55, radius: 1.85, speed: -0.11, scale: 0.8, color: 0xe2c9a0 },
        { incline: 60, twist: -30, radius: 1.4, speed: 0.26, scale: 0.65, color: 0xbcd4f0 },
      ];
      const satellites = satelliteConfigs.map((cfg) => {
        const pivot = new THREE.Group();
        pivot.rotation.x = THREE.MathUtils.degToRad(cfg.incline);
        pivot.rotation.z = THREE.MathUtils.degToRad(cfg.twist);
        scene.add(pivot);
        const craft = buildSatellite(cfg.scale, cfg.color);
        craft.position.set(cfg.radius, 0, 0);
        pivot.add(craft);
        return { pivot, craft, speed: cfg.speed };
      });

      // ---- Asteroid belt: an instanced ring of small irregular rocks,
      // tilted away from Earth's equatorial plane, rotating as a group.
      const asteroidCount = 70;
      const asteroidGeo = track(new THREE.IcosahedronGeometry(1, 0));
      const asteroidMat = new THREE.MeshStandardMaterial({ color: 0x8b7d6b, roughness: 1, flatShading: true });
      const asteroidMesh = new THREE.InstancedMesh(asteroidGeo, asteroidMat, asteroidCount);
      const dummy = new THREE.Object3D();
      const beltRadius = 2.6;
      for (let i = 0; i < asteroidCount; i++) {
        const angle = (i / asteroidCount) * Math.PI * 2 + Math.random() * 0.15;
        const r = beltRadius + (Math.random() - 0.5) * 0.35;
        const y = (Math.random() - 0.5) * 0.25;
        dummy.position.set(r * Math.cos(angle), y, r * Math.sin(angle));
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        const s = 0.012 + Math.random() * 0.028;
        dummy.scale.set(s, s * (0.7 + Math.random() * 0.6), s);
        dummy.updateMatrix();
        asteroidMesh.setMatrixAt(i, dummy.matrix);
      }
      const asteroidBelt = new THREE.Group();
      asteroidBelt.rotation.x = THREE.MathUtils.degToRad(14);
      asteroidBelt.rotation.z = THREE.MathUtils.degToRad(-6);
      asteroidBelt.add(asteroidMesh);
      scene.add(asteroidBelt);

      // ---- Distant background planets, purely decorative
      const marsTex = track(planetTexture(THREE, [
        [0, "#e2795a"],
        [0.5, "#b8492e"],
        [1, "#7a2c1c"],
      ]));
      const mars = new THREE.Mesh(
        track(new THREE.SphereGeometry(0.55, 32, 32)),
        new THREE.MeshStandardMaterial({ map: marsTex, roughness: 1 })
      );
      mars.position.set(-9, -3.5, -18);
      scene.add(mars);

      const ringedTex = track(planetTexture(THREE, [
        [0, "#e8d5a8"],
        [0.5, "#c9ac74"],
        [1, "#8a6f45"],
      ]));
      const ringedPlanet = new THREE.Mesh(
        track(new THREE.SphereGeometry(0.75, 32, 32)),
        new THREE.MeshStandardMaterial({ map: ringedTex, roughness: 1 })
      );
      ringedPlanet.position.set(10, 4.5, -22);
      const ring = new THREE.Mesh(
        track(new THREE.RingGeometry(1.1, 1.7, 64)),
        new THREE.MeshBasicMaterial({ color: 0xd8c396, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
      );
      ring.rotation.x = Math.PI / 2.4;
      ringedPlanet.add(ring);
      scene.add(ringedPlanet);

      const clock = new THREE.Clock();
      let raf = 0;
      let running = false;

      function frame() {
        raf = requestAnimationFrame(frame);
        const dt = clock.getDelta();
        globeGroup.rotation.y += dt * 0.065;
        stars.rotation.y += dt * 0.004;
        asteroidBelt.rotation.y += dt * 0.012;
        mars.rotation.y += dt * 0.02;
        ringedPlanet.rotation.y += dt * 0.015;
        satellites.forEach(({ pivot, craft, speed }) => {
          pivot.rotation.y += dt * speed;
          craft.lookAt(pivot.position);
        });
        renderer.render(scene, camera);
      }
      function start() {
        if (running) return;
        running = true;
        clock.getDelta();
        frame();
      }
      function pause() {
        running = false;
        cancelAnimationFrame(raf);
      }

      if (reduced) renderer.render(scene, camera);
      else start();

      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        if (reduced) renderer.render(scene, camera);
      };
      const onVisibility = () => {
        if (document.hidden) pause();
        else if (!reduced) start();
      };
      window.addEventListener("resize", onResize);
      document.addEventListener("visibilitychange", onVisibility);

      cleanup = () => {
        pause();
        window.removeEventListener("resize", onResize);
        document.removeEventListener("visibilitychange", onVisibility);
        renderer.dispose();
        disposables.forEach((d) => d.dispose());
        satPanelMat.dispose();
        asteroidMat.dispose();
        container.removeChild(renderer.domElement);
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return <div ref={containerRef} className="globe-backdrop" aria-hidden="true" />;
}
