"use client";

import { useEffect, useRef, useState } from "react";

const DAY_TEXTURE = "https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg";
const NIGHT_TEXTURE = "https://unpkg.com/three-globe@2.31.0/example/img/earth-night.jpg";

function toVector3(lat: number, lon: number, radius: number, THREE: typeof import("three")) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/** Simple gradient-with-noise sphere texture, generated on a canvas — no network request. */
function planetTexture(THREE: typeof import("three"), stops: [number, string][], bands = false) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  stops.forEach(([offset, color]) => grad.addColorStop(offset, color));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 128);

  if (bands) {
    // horizontal storm bands for gas giants
    for (let i = 0; i < 10; i++) {
      const y = (i / 10) * 128 + Math.random() * 4;
      ctx.globalAlpha = 0.12 + Math.random() * 0.15;
      ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#000000";
      ctx.fillRect(0, y, 256, 4 + Math.random() * 5);
    }
  }
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#000000" : "#ffffff";
    const r = 2 + Math.random() * 6;
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 128, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Jupiter needs its Great Red Spot on top of the banded gradient. */
function jupiterTexture(THREE: typeof import("three")) {
  const tex = planetTexture(
    THREE,
    [
      [0, "#e8d2a8"],
      [0.35, "#c9a26b"],
      [0.5, "#a9744a"],
      [0.65, "#c9a26b"],
      [1, "#8a6238"],
    ],
    true
  );
  const ctx = (tex.image as HTMLCanvasElement).getContext("2d")!;
  const grsGrad = ctx.createRadialGradient(190, 78, 2, 190, 78, 16);
  grsGrad.addColorStop(0, "#c1512f");
  grsGrad.addColorStop(1, "rgba(193,81,47,0)");
  ctx.fillStyle = grsGrad;
  ctx.beginPath();
  ctx.ellipse(190, 78, 16, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  tex.needsUpdate = true;
  return tex;
}

/** Soft radial glow sprite texture (comet heads, sun corona flares, distant galaxies). */
function glowTexture(THREE: typeof import("three"), inner: string, outer: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.4, outer);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

interface StreakBody {
  group: import("three").Group;
  lineMat: import("three").LineBasicMaterial;
  lineGeo: import("three").BufferGeometry;
  headMat: import("three").SpriteMaterial;
  start: import("three").Vector3;
  dir: import("three").Vector3;
  t: number;
  duration: number;
  travel: number;
}

export default function Globe3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

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

      // Deep-space background: radial gradient plus a couple of soft nebula
      // tints, so no page background ever shows through and the void has
      // some color instead of being flat black.
      const bgCanvas = document.createElement("canvas");
      bgCanvas.width = bgCanvas.height = 512;
      const bgCtx = bgCanvas.getContext("2d")!;
      const grad = bgCtx.createRadialGradient(256, 220, 40, 256, 256, 380);
      grad.addColorStop(0, "#0b1330");
      grad.addColorStop(0.55, "#04070f");
      grad.addColorStop(1, "#000103");
      bgCtx.fillStyle = grad;
      bgCtx.fillRect(0, 0, 512, 512);
      bgCtx.globalCompositeOperation = "screen";
      const nebulaA = bgCtx.createRadialGradient(90, 380, 10, 90, 380, 220);
      nebulaA.addColorStop(0, "rgba(99,60,180,0.35)");
      nebulaA.addColorStop(1, "rgba(99,60,180,0)");
      bgCtx.fillStyle = nebulaA;
      bgCtx.fillRect(0, 0, 512, 512);
      const nebulaB = bgCtx.createRadialGradient(430, 120, 10, 430, 120, 200);
      nebulaB.addColorStop(0, "rgba(37,99,235,0.3)");
      nebulaB.addColorStop(1, "rgba(37,99,235,0)");
      bgCtx.fillStyle = nebulaB;
      bgCtx.fillRect(0, 0, 512, 512);
      bgCtx.globalCompositeOperation = "source-over";
      const bgTexture = track(new THREE.CanvasTexture(bgCanvas));
      scene.background = bgTexture;

      const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.z = 2.15;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(window.innerWidth, window.innerHeight);
      container.appendChild(renderer.domElement);

      // Sunlight — a fixed-direction light approximating rays from the Sun
      // mesh's position, so every planet is lit consistently from one side.
      const SUN_POS = new THREE.Vector3(-10.5, 2, -16);
      const sunLight = new THREE.DirectionalLight(0xffffff, 2.8);
      sunLight.position.copy(SUN_POS).normalize().multiplyScalar(4);
      scene.add(sunLight);
      scene.add(new THREE.AmbientLight(0x4466bb, 0.38));

      const commonSphereGeo = track(new THREE.SphereGeometry(1, 48, 48));

      // ---- The Sun: emissive core + additive corona + occasional flare bursts
      const sunGroup = new THREE.Group();
      sunGroup.position.copy(SUN_POS);
      scene.add(sunGroup);
      const sunCore = new THREE.Mesh(
        commonSphereGeo,
        new THREE.MeshBasicMaterial({ color: 0xfff4d6 })
      );
      sunCore.scale.setScalar(1.3);
      sunGroup.add(sunCore);
      const sunCorona = new THREE.Mesh(
        track(new THREE.SphereGeometry(1.7, 48, 48)),
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
              float intensity = pow(0.55 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
              gl_FragColor = vec4(1.0, 0.75, 0.35, 1.0) * intensity;
            }`,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          transparent: true,
          depthWrite: false,
        })
      );
      sunGroup.add(sunCorona);
      const flareTexture = track(glowTexture(THREE, "rgba(255,240,200,1)", "rgba(255,180,90,0.7)"));
      const flareSprites = [0, 1, 2].map(() => {
        const mat = new THREE.SpriteMaterial({
          map: flareTexture,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.setScalar(0.6);
        sunGroup.add(sprite);
        return { sprite, mat, t: Math.random() * 10, active: false };
      });

      // ---- Planets, spread wide left-to-right so the center stays clear
      // for the chat UI, each lit by the fixed sun-direction light above.
      function makePlanet(radius: number, position: [number, number, number], tex: import("three").Texture) {
        const mesh = new THREE.Mesh(commonSphereGeo, new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
        mesh.scale.setScalar(radius);
        mesh.position.set(...position);
        scene.add(mesh);
        return mesh;
      }

      const mercury = makePlanet(0.1, [-8.05, 0.8, -15], track(planetTexture(THREE, [[0, "#b9ada0"], [1, "#7c7166"]])));
      const venus = makePlanet(0.16, [-5.95, -1.0, -15.5], track(planetTexture(THREE, [[0, "#f3e2b3"], [1, "#c9a86a"]])));

      // Earth keeps its day/night blend + a tiny moon, now scaled down as
      // one planet among many rather than the single hero of the scene.
      const earthGroup = new THREE.Group();
      earthGroup.position.set(-3.5, 1.3, -16);
      earthGroup.rotation.z = (23.4 * Math.PI) / 180;
      scene.add(earthGroup);
      const earthRadius = 0.2;
      const earthPlaceholder = new THREE.Mesh(
        commonSphereGeo,
        new THREE.MeshBasicMaterial({ color: 0x1e293b })
      );
      earthPlaceholder.scale.setScalar(earthRadius);
      earthGroup.add(earthPlaceholder);
      const earthAtmosphere = new THREE.Mesh(
        track(new THREE.SphereGeometry(earthRadius * 1.16, 32, 32)),
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
      earthGroup.add(earthAtmosphere);
      const moon = new THREE.Mesh(
        track(new THREE.SphereGeometry(0.045, 20, 20)),
        new THREE.MeshStandardMaterial({ color: 0xd6dbe6, roughness: 0.9 })
      );
      moon.position.set(earthRadius * 2.1, earthRadius * 0.6, 0);
      earthGroup.add(moon);

      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      let dayTex: import("three").Texture | null = null;
      let nightTex: import("three").Texture | null = null;
      const tryBuildEarth = () => {
        if (!dayTex || !nightTex || cancelled) return;
        const earth = new THREE.Mesh(
          commonSphereGeo,
          new THREE.MeshStandardMaterial({
            map: dayTex,
            emissiveMap: nightTex,
            emissive: new THREE.Color(0xffffff),
            emissiveIntensity: 1.5,
            roughness: 0.75,
          })
        );
        earth.scale.setScalar(earthRadius);
        earthGroup.add(earth);
        earthPlaceholder.visible = false;
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

      // Orient Earth so India faces the sun (day) or faces away (night),
      // matching the real clock in India right now (IST, UTC+5:30).
      const now = new Date();
      const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
      const istHour = (utcHours + 5.5) % 24;
      const isDayInIndia = istHour >= 6 && istHour < 18;
      moon.visible = !isDayInIndia;
      const INDIA: [number, number] = [21, 78.96];
      const indiaLocal = toVector3(INDIA[0], INDIA[1], 1, THREE);
      const indiaAzimuth = Math.atan2(indiaLocal.x, indiaLocal.z);
      const sunAzimuth = Math.atan2(sunLight.position.x, sunLight.position.z);
      const targetAzimuth = isDayInIndia ? sunAzimuth : sunAzimuth + Math.PI;
      earthGroup.rotation.y = targetAzimuth - indiaAzimuth;

      const mars = makePlanet(0.14, [-1.26, -1.4, -16.5], track(planetTexture(THREE, [[0, "#e2795a"], [0.5, "#b8492e"], [1, "#7a2c1c"]])));
      const jupiter = makePlanet(0.55, [1.82, 1.6, -18], track(jupiterTexture(THREE)));
      const saturn = makePlanet(0.46, [4.9, -1.0, -19], track(planetTexture(THREE, [[0, "#e8d5a8"], [0.5, "#c9ac74"], [1, "#8a6f45"]])));
      const saturnRing = new THREE.Mesh(
        track(new THREE.RingGeometry(0.62, 0.98, 64)),
        new THREE.MeshBasicMaterial({ color: 0xd8c396, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
      );
      saturnRing.rotation.x = Math.PI / 2.4;
      saturn.add(saturnRing);
      const uranus = makePlanet(0.28, [7.35, 1.2, -20], track(planetTexture(THREE, [[0, "#c9f3ee"], [1, "#8fd0c9"]])));
      const neptune = makePlanet(0.27, [9.45, -0.6, -21], track(planetTexture(THREE, [[0, "#5b7fe0"], [1, "#2c3fa0"]])));

      const pluto = makePlanet(0.06, [11.5, 0.4, -24], track(planetTexture(THREE, [[0, "#cbb8a3"], [1, "#8a7867"]])));

      const orbitingPlanets = [mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto];

      // ---- Orbital motion: each body swings back and forth along a bounded
      // arc of its own circular path around the Sun (not a full revolution —
      // that would eventually swing some planets through the clear center
      // zone). A full glowing ring shows the trajectory each swings along.
      interface OrbitEntry {
        object: import("three").Object3D;
        baseAngle: number;
        radius: number;
        amplitude: number;
        speed: number;
        phase: number;
      }
      const orbits: OrbitEntry[] = [];
      const orbitLineMat = track(
        new THREE.LineBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending })
      );
      function registerOrbit(object: import("three").Object3D, amplitude: number, speed: number) {
        const relX = object.position.x - SUN_POS.x;
        const relZ = object.position.z - SUN_POS.z;
        const radius = Math.sqrt(relX * relX + relZ * relZ);
        const baseAngle = Math.atan2(relZ, relX);
        orbits.push({ object, baseAngle, radius, amplitude, speed, phase: Math.random() * Math.PI * 2 });

        const segments = 96;
        const pts: import("three").Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
          const a = (i / segments) * Math.PI * 2;
          pts.push(new THREE.Vector3(SUN_POS.x + Math.cos(a) * radius, object.position.y, SUN_POS.z + Math.sin(a) * radius));
        }
        const geo = track(new THREE.BufferGeometry().setFromPoints(pts));
        scene.add(new THREE.LineLoop(geo, orbitLineMat));
      }
      registerOrbit(mercury, 0.35, 0.15);
      registerOrbit(venus, 0.28, 0.11);
      registerOrbit(earthGroup, 0.22, 0.08);
      registerOrbit(mars, 0.18, 0.065);
      registerOrbit(jupiter, 0.13, 0.045);
      registerOrbit(saturn, 0.1, 0.035);
      registerOrbit(uranus, 0.08, 0.028);
      registerOrbit(neptune, 0.065, 0.022);
      registerOrbit(pluto, 0.055, 0.018);

      // ---- Aurora glow above Earth's pole, shimmering between green and cyan
      const auroraMat = track(new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          varying vec2 vUv;
          uniform float uTime;
          void main() {
            float d = distance(vUv, vec2(0.5));
            float ring = smoothstep(0.5, 0.32, d) * smoothstep(0.14, 0.28, d);
            float shimmer = 0.55 + 0.45 * sin(uTime * 2.2 + vUv.x * 12.0);
            vec3 color = mix(vec3(0.25, 1.0, 0.6), vec3(0.3, 0.7, 1.0), sin(uTime + vUv.y * 6.0) * 0.5 + 0.5);
            gl_FragColor = vec4(color, ring * shimmer * 0.75);
          }`,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }));
      const aurora = new THREE.Mesh(track(new THREE.RingGeometry(earthRadius * 1.05, earthRadius * 1.6, 48)), auroraMat);
      aurora.rotation.x = -Math.PI / 2.3;
      aurora.position.y = earthRadius * 0.35;
      earthGroup.add(aurora);

      // ---- Asteroid belt between Mars and Jupiter, Kuiper belt beyond Neptune
      function makeBelt(count: number, xRange: [number, number], yRange: [number, number], z: number, color: number, sizeRange: [number, number]) {
        const geo = track(new THREE.IcosahedronGeometry(1, 0));
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true });
        const mesh = new THREE.InstancedMesh(geo, mat, count);
        const dummy = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
          dummy.position.set(
            xRange[0] + Math.random() * (xRange[1] - xRange[0]),
            yRange[0] + Math.random() * (yRange[1] - yRange[0]),
            z + (Math.random() - 0.5) * 1.5
          );
          dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
          const s = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
          dummy.scale.set(s, s * (0.7 + Math.random() * 0.6), s);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        }
        scene.add(mesh);
        return { mesh, mat };
      }
      const asteroidBelt = makeBelt(60, [-0.28, 1.26], [-0.9, 0.9], -17, 0x8b7d6b, [0.02, 0.05]);
      const kuiperBelt = makeBelt(45, [10.5, 14], [-1.2, 1.2], -23, 0xaebfd6, [0.015, 0.035]);

      // ---- A couple of soft distant galaxies for background depth
      const galaxyTexture = track(glowTexture(THREE, "rgba(196,181,253,0.9)", "rgba(129,140,248,0.4)"));
      const galaxies: import("three").Sprite[] = [
        [-6, 4.5, -28],
        [12, -4.5, -30],
      ].map(([x, y, z]) => {
        const mat = new THREE.SpriteMaterial({ map: galaxyTexture, transparent: true, opacity: 0.5, depthWrite: false });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.setScalar(6);
        sprite.position.set(x, y, z);
        scene.add(sprite);
        return sprite;
      });

      // ---- Twinkling point field, shared by the starfield and the closer
      // cosmic-dust layer. uScale mirrors what THREE.PointsMaterial computes
      // internally (half the drawing-buffer height) so uSize behaves like a
      // normal "world size" instead of a mystery constant that renders
      // sub-pixel and effectively invisible.
      function makeTwinkleField(count: number, radiusRange: [number, number], size: number, color: number, opacityFloor: number) {
        const positions = new Float32Array(count * 3);
        const phases = new Float32Array(count);
        for (let i = 0; i < count; i++) {
          const r = radiusRange[0] + Math.random() * (radiusRange[1] - radiusRange[0]);
          const theta = Math.acos(2 * Math.random() - 1);
          const phi = Math.random() * Math.PI * 2;
          positions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
          positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
          positions[i * 3 + 2] = r * Math.cos(theta);
          phases[i] = Math.random() * Math.PI * 2;
        }
        const geo = track(new THREE.BufferGeometry());
        geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geo.setAttribute("phase", new THREE.BufferAttribute(phases, 1));
        const material = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uSize: { value: size },
            uScale: { value: (window.innerHeight * Math.min(window.devicePixelRatio, 1.5)) / 2 },
            uColor: { value: new THREE.Color(color) },
          },
          vertexShader: `
            attribute float phase;
            uniform float uTime;
            uniform float uSize;
            uniform float uScale;
            varying float vTwinkle;
            void main() {
              vTwinkle = 0.5 + 0.5 * sin(uTime * 1.6 + phase);
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = uSize * (uScale / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            uniform vec3 uColor;
            varying float vTwinkle;
            void main() {
              float d = length(gl_PointCoord - vec2(0.5));
              if (d > 0.5) discard;
              gl_FragColor = vec4(uColor, (${opacityFloor.toFixed(2)} + ${(1 - opacityFloor).toFixed(2)} * vTwinkle) * (1.0 - d * 1.7));
            }
          `,
          transparent: true,
          depthWrite: false,
        });
        const points = new THREE.Points(geo, material);
        scene.add(points);
        return { points, material };
      }

      const { points: stars, material: starMaterial } = makeTwinkleField(1800, [6, 46], 0.11, 0xdbeafe, 0.45);
      const { points: dust, material: dustMaterial } = makeTwinkleField(280, [2, 9], 0.045, 0xffe6b8, 0.3);

      // ---- Shooting stars (quick) and a comet (slower, bigger, brighter) —
      // both use a camera-facing glow sprite for the head so they're never
      // at risk of being an easy-to-miss 1px GL line.
      const meteorHeadTexture = track(glowTexture(THREE, "rgba(255,255,255,1)", "rgba(224,242,254,0.85)"));
      const cometHeadTexture = track(glowTexture(THREE, "rgba(255,255,255,1)", "rgba(165,243,252,0.9)"));

      function spawnStreak(list: StreakBody[], opts: { texture: import("three").Texture; headScale: number; trailLen: number; travel: number; duration: number; radius: [number, number] }) {
        const r = opts.radius[0] + Math.random() * (opts.radius[1] - opts.radius[0]);
        const theta = Math.acos(2 * Math.random() - 1);
        const phi = Math.random() * Math.PI * 2;
        const start = new THREE.Vector3(
          r * Math.sin(theta) * Math.cos(phi),
          r * Math.sin(theta) * Math.sin(phi),
          r * Math.cos(theta)
        );
        const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.3 - 0.6, Math.random() - 0.5).normalize();

        const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), dir.clone().multiplyScalar(-opts.trailLen)]);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
        const line = new THREE.Line(lineGeo, lineMat);

        const headMat = new THREE.SpriteMaterial({ map: opts.texture, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
        const head = new THREE.Sprite(headMat);
        head.scale.setScalar(opts.headScale);

        const group = new THREE.Group();
        group.add(line, head);
        group.position.copy(start);
        scene.add(group);
        list.push({ group, lineMat, lineGeo, headMat, start, dir, t: 0, duration: opts.duration, travel: opts.travel });
      }

      const meteors: StreakBody[] = [];
      let meteorCooldown = 1.5 + Math.random() * 2.5;
      const comets: StreakBody[] = [];
      let cometCooldown = 10 + Math.random() * 12;

      function updateStreaks(list: StreakBody[], dt: number) {
        for (let i = list.length - 1; i >= 0; i--) {
          const m = list[i];
          m.t += dt;
          const p = m.t / m.duration;
          if (p >= 1) {
            scene.remove(m.group);
            m.lineMat.dispose();
            m.lineGeo.dispose();
            m.headMat.dispose();
            list.splice(i, 1);
            continue;
          }
          m.group.position.copy(m.start).addScaledVector(m.dir, p * m.travel);
          const fade = p < 0.12 ? p / 0.12 : p > 0.65 ? Math.max(0, (1 - p) / 0.35) : 1;
          m.lineMat.opacity = fade * 0.85;
          m.headMat.opacity = fade;
        }
      }

      // Subtle mouse-parallax: the camera drifts a little toward the cursor
      // and re-centers on the scene, so it feels responsive rather than a
      // static loop. Disabled on touch-only devices.
      const pointer = { x: 0, y: 0 };
      const cameraOffset = { x: 0, y: 0 };
      const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
      const onPointerMove = (e: PointerEvent) => {
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      };
      if (hasFinePointer && !reduced) {
        window.addEventListener("pointermove", onPointerMove);
      }

      // ---- Satellites: a few small craft on tilted orbital planes near the
      // camera, circling independently — the "foreground" layer.
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

      const clock = new THREE.Clock();
      let raf = 0;
      let running = false;

      function frame() {
        raf = requestAnimationFrame(frame);
        const dt = clock.getDelta();

        earthGroup.rotation.y += dt * 0.08;
        orbitingPlanets.forEach((p, i) => (p.rotation.y += dt * (0.03 + i * 0.006)));
        sunCore.rotation.y += dt * 0.01;
        stars.rotation.y += dt * 0.004;
        starMaterial.uniforms.uTime.value += dt;
        dust.rotation.y += dt * 0.01;
        dustMaterial.uniforms.uTime.value += dt;
        auroraMat.uniforms.uTime.value += dt;
        asteroidBelt.mesh.rotation.y += dt * 0.01;
        kuiperBelt.mesh.rotation.y += dt * 0.006;
        satellites.forEach(({ pivot, craft, speed }) => {
          pivot.rotation.y += dt * speed;
          craft.lookAt(pivot.position);
        });

        // Each planet swings back and forth along its orbital ring, staying
        // within a bounded arc so it never drifts into the clear center zone.
        const elapsed = clock.elapsedTime;
        orbits.forEach((o) => {
          const angle = o.baseAngle + o.amplitude * Math.sin(elapsed * o.speed + o.phase);
          o.object.position.x = SUN_POS.x + Math.cos(angle) * o.radius;
          o.object.position.z = SUN_POS.z + Math.sin(angle) * o.radius;
        });

        flareSprites.forEach((f) => {
          f.t -= dt;
          if (f.t <= 0 && !f.active) {
            f.active = true;
            f.t = 0;
            const angle = Math.random() * Math.PI * 2;
            f.sprite.position.set(Math.cos(angle) * 1.4, Math.sin(angle) * 1.4, 0.3);
          }
          if (f.active) {
            f.t += dt;
            const p = f.t / 1.4;
            if (p >= 1) {
              f.active = false;
              f.mat.opacity = 0;
              f.t = 3 + Math.random() * 5;
            } else {
              f.mat.opacity = p < 0.3 ? p / 0.3 : (1 - p) / 0.7;
              f.sprite.scale.setScalar(0.5 + p * 0.5);
            }
          }
        });

        meteorCooldown -= dt;
        if (meteorCooldown <= 0 && meteors.length < 1) {
          spawnStreak(meteors, { texture: meteorHeadTexture, headScale: 0.7, trailLen: 2.2, travel: 7, duration: 1.1 + Math.random() * 0.7, radius: [10, 14] });
          meteorCooldown = 3 + Math.random() * 5;
        }
        updateStreaks(meteors, dt);

        cometCooldown -= dt;
        if (cometCooldown <= 0 && comets.length < 1) {
          spawnStreak(comets, { texture: cometHeadTexture, headScale: 1.4, trailLen: 5, travel: 10, duration: 3 + Math.random() * 1.5, radius: [16, 22] });
          cometCooldown = 14 + Math.random() * 16;
        }
        updateStreaks(comets, dt);

        if (hasFinePointer) {
          cameraOffset.x += (pointer.x * 0.4 - cameraOffset.x) * Math.min(1, dt * 2.5);
          cameraOffset.y += (-pointer.y * 0.25 - cameraOffset.y) * Math.min(1, dt * 2.5);
          camera.position.x = cameraOffset.x;
          camera.position.y = cameraOffset.y;
          camera.lookAt(0, 0, -2);
        }

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
      setReady(true);

      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        starMaterial.uniforms.uScale.value = (window.innerHeight * Math.min(window.devicePixelRatio, 1.5)) / 2;
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
        window.removeEventListener("pointermove", onPointerMove);
        [...meteors, ...comets].forEach((m) => {
          m.lineMat.dispose();
          m.lineGeo.dispose();
          m.headMat.dispose();
        });
        starMaterial.dispose();
        dustMaterial.dispose();
        satPanelMat.dispose();
        asteroidBelt.mat.dispose();
        kuiperBelt.mat.dispose();
        flareSprites.forEach((f) => f.mat.dispose());
        galaxies.forEach((g) => (g.material as import("three").SpriteMaterial).dispose());
        renderer.dispose();
        disposables.forEach((d) => d.dispose());
        container.removeChild(renderer.domElement);
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <div className="globe-backdrop" aria-hidden="true">
      <div ref={containerRef} className="absolute inset-0" />
      <div className={`globe-placeholder ${ready ? "globe-placeholder-hidden" : ""}`} />
    </div>
  );
}
