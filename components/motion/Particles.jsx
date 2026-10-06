'use client';

import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/lib/motion';

/**
 * Drifting dust motes (three.js points), ported from the prototype. three.js is
 * loaded lazily after the page is interactive, and the loop pauses while the
 * tab is hidden.
 */
export default function Particles() {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv || prefersReducedMotion()) return undefined;
    let disposed = false;
    let cleanup = () => {};

    const start = async () => {
      let THREE;
      try {
        THREE = await import('three');
      } catch {
        return;
      }
      if (disposed) return;
      try {
        const mobile = window.innerWidth < 860;
        const N = mobile ? 90 : 380;
        const renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        const scene = new THREE.Scene();
        const cam = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
        cam.position.z = 14;
        const pos = new Float32Array(N * 3);
        const spd = new Float32Array(N);
        for (let i = 0; i < N; i++) {
          pos[i * 3] = (Math.random() - 0.5) * 34;
          pos[i * 3 + 1] = (Math.random() - 0.5) * 22;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
          spd[i] = 0.004 + Math.random() * 0.012;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const s = document.createElement('canvas');
        s.width = s.height = 64;
        const sc = s.getContext('2d');
        const gr = sc.createRadialGradient(32, 32, 0, 32, 32, 32);
        gr.addColorStop(0, 'rgba(214,203,247,1)');
        gr.addColorStop(1, 'rgba(214,203,247,0)');
        sc.fillStyle = gr;
        sc.fillRect(0, 0, 64, 64);
        const tex = new THREE.CanvasTexture(s);
        tex.colorSpace = THREE.SRGBColorSpace;
        const m = new THREE.PointsMaterial({
          size: 0.14,
          map: tex,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const pts = new THREE.Points(g, m);
        scene.add(pts);

        const resize = () => {
          renderer.setSize(window.innerWidth, window.innerHeight, false);
          cam.aspect = window.innerWidth / window.innerHeight;
          cam.updateProjectionMatrix();
        };
        resize();
        window.addEventListener('resize', resize);
        let mx = 0;
        let my = 0;
        let sy = 0;
        const onMove = (e) => {
          mx = e.clientX / window.innerWidth - 0.5;
          my = e.clientY / window.innerHeight - 0.5;
        };
        window.addEventListener('mousemove', onMove, { passive: true });

        let raf = 0;
        const tick = () => {
          if (!document.hidden) {
            const p = g.attributes.position.array;
            for (let i = 0; i < N; i++) {
              p[i * 3 + 1] += spd[i];
              p[i * 3] += Math.sin((p[i * 3 + 1] + i) * 0.4) * 0.0015;
              if (p[i * 3 + 1] > 11) p[i * 3 + 1] = -11;
            }
            g.attributes.position.needsUpdate = true;
            sy += (window.scrollY * 0.0012 - sy) * 0.05;
            pts.position.y = sy;
            cam.position.x += (mx * 1.2 - cam.position.x) * 0.03;
            cam.position.y += (-my * 0.8 - cam.position.y) * 0.03;
            cam.lookAt(0, 0, 0);
            renderer.render(scene, cam);
          }
          raf = requestAnimationFrame(tick);
        };
        tick();

        cleanup = () => {
          cancelAnimationFrame(raf);
          window.removeEventListener('resize', resize);
          window.removeEventListener('mousemove', onMove);
          g.dispose();
          m.dispose();
          tex.dispose();
          renderer.dispose();
        };
      } catch {
        cv.style.display = 'none';
      }
    };

    // Let the page settle first; particles are atmosphere, not content.
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 400));
    const cancelIdle = window.cancelIdleCallback || clearTimeout;
    const id = idle(start);
    return () => {
      disposed = true;
      cancelIdle(id);
      cleanup();
    };
  }, []);

  return <canvas ref={ref} id="particles" />;
}
