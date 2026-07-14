"use client";

import { useEffect, useRef } from "react";

const TEXTURES = {
  dark: "https://unpkg.com/three-globe@2.31.0/example/img/earth-night.jpg",
  light: "https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg",
};

export default function Globe3D() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      const container = ref.current;
      if (cancelled || !container) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.z = 3.1;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(window.innerWidth, window.innerHeight);
      container.appendChild(renderer.domElement);

      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;

      // World group so the planet can sit beside the content on wide screens
      const world = new THREE.Group();
      scene.add(world);

      // Earth (axially tilted like the real one)
      const globeGroup = new THREE.Group();
      globeGroup.rotation.z = (23.4 * Math.PI) / 180;
      world.add(globeGroup);

      const updateOffset = () => {
        const wide = window.innerWidth >= 768;
        world.position.x = wide ? 1.2 : 0;
        world.position.y = wide ? 0 : -0.5;
      };
      updateOffset();

      const sphereGeo = new THREE.SphereGeometry(1, 64, 64);

      // Wireframe placeholder shown until the texture arrives (and kept as fallback)
      const wire = new THREE.Mesh(
        sphereGeo,
        new THREE.MeshBasicMaterial({ color: 0x3b82f6, wireframe: true, transparent: true, opacity: 0.07 })
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

      // Atmosphere rim glow
      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.13, 64, 64),
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
              gl_FragColor = vec4(0.23, 0.51, 0.96, 1.0) * intensity;
            }`,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          transparent: true,
          depthWrite: false,
        })
      );
      world.add(atmosphere);

      // Starfield behind the globe
      const starCount = 700;
      const positions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        const r = 30 + Math.random() * 20;
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
          color: 0x93c5fd,
          size: 0.07,
          transparent: true,
          opacity: dark ? 0.8 : 0.4,
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
        globeGroup.rotation.y += dt * 0.055;
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

      if (reduced) {
        renderer.render(scene, camera);
      } else {
        start();
      }

      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        updateOffset();
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
        starGeo.dispose();
        container.removeChild(renderer.domElement);
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return <div ref={ref} className="globe3d" aria-hidden="true" />;
}
