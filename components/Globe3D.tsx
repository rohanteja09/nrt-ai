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

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.z = 2.15;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(window.innerWidth, window.innerHeight);
      container.appendChild(renderer.domElement);

      // Sunlight (creates a realistic day/night terminator across the sphere)
      const sun = new THREE.DirectionalLight(0xffffff, 2.4);
      sun.position.set(-4, 2, 4);
      scene.add(sun);
      scene.add(new THREE.AmbientLight(0x3355aa, 0.35));

      const globeGroup = new THREE.Group();
      globeGroup.rotation.z = (23.4 * Math.PI) / 180;
      globeGroup.rotation.y = 2.4; // start facing a continent, not open ocean
      scene.add(globeGroup);

      const sphereGeo = new THREE.SphereGeometry(1, 96, 96);

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
            emissiveIntensity: 1.4,
            roughness: 0.85,
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
        const geo = new THREE.BufferGeometry().setFromPoints(points);
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
      const nodeGeo = new THREE.BufferGeometry();
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
        new THREE.SphereGeometry(1.15, 64, 64),
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

      // Starfield
      const starCount = 900;
      const positions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        const r = 20 + Math.random() * 25;
        const theta = Math.acos(2 * Math.random() - 1);
        const phi = Math.random() * Math.PI * 2;
        positions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
        positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
        positions[i * 3 + 2] = -Math.abs(r * Math.cos(theta));
      }
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const stars = new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({ color: 0x93c5fd, size: 0.05, transparent: true, opacity: 0.7, depthWrite: false })
      );
      scene.add(stars);

      const clock = new THREE.Clock();
      let raf = 0;
      let running = false;

      function frame() {
        raf = requestAnimationFrame(frame);
        const dt = clock.getDelta();
        globeGroup.rotation.y += dt * 0.065;
        stars.rotation.y += dt * 0.004;
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
        sphereGeo.dispose();
        nodeGeo.dispose();
        starGeo.dispose();
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
