"use client";

import { useEffect, useRef } from "react";

const NIGHT_TEXTURE = "https://unpkg.com/three-globe@2.31.0/example/img/earth-night.jpg";

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
      camera.position.z = 2.2;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(window.innerWidth, window.innerHeight);
      container.appendChild(renderer.domElement);

      // Earth (always the dramatic night-lights look, tilted like the real planet)
      const globeGroup = new THREE.Group();
      globeGroup.rotation.z = (23.4 * Math.PI) / 180;
      scene.add(globeGroup);

      const sphereGeo = new THREE.SphereGeometry(1, 64, 64);

      const wire = new THREE.Mesh(
        sphereGeo,
        new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.2 })
      );
      globeGroup.add(wire);

      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      loader.load(NIGHT_TEXTURE, (tex) => {
        if (cancelled) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        const earth = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ map: tex }));
        globeGroup.add(earth);
        wire.visible = false;
      });

      // Geodesic network-mesh overlay (the "global data grid" look), rotating independently
      const networkGroup = new THREE.Group();
      globeGroup.add(networkGroup);
      const netGeo = new THREE.IcosahedronGeometry(1.012, 3);
      const network = new THREE.LineSegments(
        new THREE.WireframeGeometry(netGeo),
        new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.32 })
      );
      networkGroup.add(network);

      // Glowing node points at a subset of the mesh vertices ("city" nodes)
      const vertexPositions = netGeo.getAttribute("position");
      const nodeCount = Math.min(90, vertexPositions.count);
      const nodePositions = new Float32Array(nodeCount * 3);
      const step = Math.floor(vertexPositions.count / nodeCount);
      for (let i = 0; i < nodeCount; i++) {
        const vi = i * step;
        nodePositions[i * 3] = vertexPositions.getX(vi) * 1.014;
        nodePositions[i * 3 + 1] = vertexPositions.getY(vi) * 1.014;
        nodePositions[i * 3 + 2] = vertexPositions.getZ(vi) * 1.014;
      }
      const nodeGeo = new THREE.BufferGeometry();
      nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));
      const nodes = new THREE.Points(
        nodeGeo,
        new THREE.PointsMaterial({ color: 0x67e8f9, size: 0.02, transparent: true, opacity: 0.9 })
      );
      networkGroup.add(nodes);

      // Atmosphere rim glow
      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.16, 64, 64),
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
              float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
              gl_FragColor = vec4(0.16, 0.71, 0.93, 1.0) * intensity;
            }`,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          transparent: true,
          depthWrite: false,
        })
      );
      scene.add(atmosphere);

      // Starfield
      const starCount = 1100;
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
        new THREE.PointsMaterial({ color: 0x93c5fd, size: 0.055, transparent: true, opacity: 0.8, depthWrite: false })
      );
      scene.add(stars);

      const clock = new THREE.Clock();
      let raf = 0;
      let running = false;

      function frame() {
        raf = requestAnimationFrame(frame);
        const dt = clock.getDelta();
        globeGroup.rotation.y += dt * 0.05;
        networkGroup.rotation.y += dt * 0.018;
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
        netGeo.dispose();
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

  return (
    <div className="hud-viewport" aria-hidden="true">
      <div ref={containerRef} className="hud-globe-canvas" />
      <span className="hud-corner tl" />
      <span className="hud-corner tr" />
      <span className="hud-corner bl" />
      <span className="hud-corner br" />
      <div className="hud-scanline" />
      <div className="hud-label">
        <span className="hud-dot" />
        EARTH&nbsp;·&nbsp;LIVE
      </div>
    </div>
  );
}
