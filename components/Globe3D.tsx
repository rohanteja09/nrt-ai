"use client";

import { useEffect, useRef } from "react";

const TEXTURES = {
  dark: "https://unpkg.com/three-globe@2.31.0/example/img/earth-night.jpg",
  light: "https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg",
};

export default function Globe3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      const container = containerRef.current;
      const panel = panelRef.current;
      if (cancelled || !container || !panel) return;

      const size = () => panel.getBoundingClientRect();
      const initial = size();

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, initial.width / initial.height, 0.1, 100);
      camera.position.z = 2.7;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(initial.width, initial.height);
      container.appendChild(renderer.domElement);

      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;

      const globeGroup = new THREE.Group();
      globeGroup.rotation.z = (23.4 * Math.PI) / 180;
      scene.add(globeGroup);

      const sphereGeo = new THREE.SphereGeometry(1, 64, 64);

      const wire = new THREE.Mesh(
        sphereGeo,
        new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.25 })
      );
      globeGroup.add(wire);

      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      loader.load(TEXTURES[dark ? "dark" : "light"], (tex) => {
        if (cancelled) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        const earth = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ map: tex }));
        globeGroup.add(earth);
        wire.visible = false;
      });

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
              gl_FragColor = vec4(0.13, 0.83, 0.93, 1.0) * intensity;
            }`,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          transparent: true,
          depthWrite: false,
        })
      );
      scene.add(atmosphere);

      const starCount = 220;
      const positions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        const r = 6 + Math.random() * 4;
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
        new THREE.PointsMaterial({
          color: 0x67e8f9,
          size: 0.045,
          transparent: true,
          opacity: dark ? 0.9 : 0.5,
          depthWrite: false,
        })
      );
      scene.add(stars);

      const clock = new THREE.Clock();
      let raf = 0;
      let running = false;

      function frame() {
        raf = requestAnimationFrame(frame);
        const dt = clock.getDelta();
        globeGroup.rotation.y += dt * 0.09;
        stars.rotation.y += dt * 0.006;
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

      const ro = new ResizeObserver(() => {
        const { width, height } = size();
        if (width === 0 || height === 0) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        if (reduced) renderer.render(scene, camera);
      });
      ro.observe(panel);

      const onVisibility = () => {
        if (document.hidden) pause();
        else if (!reduced) start();
      };
      document.addEventListener("visibilitychange", onVisibility);

      cleanup = () => {
        pause();
        ro.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        renderer.dispose();
        sphereGeo.dispose();
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
    <div className="hud-globe" aria-hidden="true">
      <div ref={panelRef} className="hud-globe-frame">
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
    </div>
  );
}
