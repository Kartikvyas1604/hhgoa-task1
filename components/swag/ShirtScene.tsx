"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type RootState } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import gsap from "gsap";
import { createTeeBodyGeometry, createTeeDecalGeometry } from "./tee";

export type ShirtView = "front" | "back";

export interface ShirtSceneProps {
  texFront: THREE.Texture | null;
  texBack: THREE.Texture | null;
  baseColor: string;
  view: ShirtView;
  punch: number;
  onLowFps: () => void;
  onCreated?: (state: RootState) => void;
}

type ControlsRef = React.ElementRef<typeof OrbitControls>;

function TeeModel({
  texFront,
  texBack,
  baseColor,
}: {
  texFront: THREE.Texture | null;
  texBack: THREE.Texture | null;
  baseColor: string;
}) {
  const bodyGeo = useMemo(() => createTeeBodyGeometry(), []);
  const frontGeo = useMemo(() => createTeeDecalGeometry(), []);
  const backGeo = useMemo(() => createTeeDecalGeometry(), []);

  const bodyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.8,
        metalness: 0.02,
      }),
    [baseColor],
  );
  const frontMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: texFront ?? null,
        roughness: 0.85,
        metalness: 0.02,
        side: THREE.FrontSide,
      }),
    [texFront],
  );
  const backMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: texBack ?? null,
        roughness: 0.85,
        metalness: 0.02,
        side: THREE.BackSide,
      }),
    [texBack],
  );

  useEffect(() => {
    frontMat.needsUpdate = true;
  }, [frontMat]);
  useEffect(() => {
    backMat.needsUpdate = true;
  }, [backMat]);

  useEffect(
    () => () => {
      bodyGeo.dispose();
      frontGeo.dispose();
      backGeo.dispose();
      bodyMat.dispose();
      frontMat.dispose();
      backMat.dispose();
    },
    [bodyGeo, frontGeo, backGeo, bodyMat, frontMat, backMat],
  );

  return (
    <group>
      <mesh geometry={bodyGeo} material={bodyMat} />
      <mesh geometry={frontGeo} material={frontMat} position={[0, 0, 0.082]} />
      <mesh geometry={backGeo} material={backMat} position={[0, 0, -0.082]} />
    </group>
  );
}

function CameraRig({
  view,
  punch,
  camera,
  controlsRef,
}: {
  view: ShirtView;
  punch: number;
  camera: THREE.Camera;
  controlsRef: React.MutableRefObject<ControlsRef | null>;
}) {
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const controls = controlsRef.current;
    const target = view === "back" ? { x: 0, y: 0.25, z: -3.6 } : { x: 0, y: 0.25, z: 3.6 };
    if (controls) controls.enabled = false;
    const tween = gsap.to(camera.position, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration: 0.8,
      ease: "power2.inOut",
      onUpdate: () => controls?.update(),
      onComplete: () => {
        if (controls) {
          controls.enabled = true;
          controls.update();
        }
      },
    });
    return () => {
      tween.kill();
    };
  }, [view, camera, controlsRef]);

  useEffect(() => {
    if (punch === 0) return;
    const controls = controlsRef.current;
    const z0 = camera.position.z;
    const targetZ = z0 >= 0 ? 3.05 : -3.05;
    const tween = gsap.to(camera.position, {
      z: targetZ,
      duration: 0.16,
      yoyo: true,
      repeat: 1,
      ease: "power2.out",
      onUpdate: () => controls?.update(),
    });
    return () => {
      tween.kill();
    };
  }, [punch, camera, controlsRef]);

  return null;
}

function FpsWatch({ onLow }: { onLow: () => void }) {
  const acc = useRef({ t: 0, n: 0, fired: false });
  useFrame((_, dt) => {
    const a = acc.current;
    a.t += Math.min(dt, 0.2);
    a.n += 1;
    if (a.t >= 2.2) {
      const fps = a.n / a.t;
      if (fps < 26 && !a.fired) {
        a.fired = true;
        onLow();
      }
      a.t = 0;
      a.n = 0;
    }
  });
  return null;
}

function SceneInner(props: ShirtSceneProps) {
  const camera = useThree((s) => s.camera);
  const controlsRef = useRef<ControlsRef | null>(null);

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 5, 4]} intensity={1.5} />
      <directionalLight position={[-4, 2, 3]} intensity={0.5} color="#ffb37a" />
      <directionalLight position={[0, -2, -5]} intensity={0.4} color="#7fff9e" />
      <TeeModel
        texFront={props.texFront}
        texBack={props.texBack}
        baseColor={props.baseColor}
      />
      <CameraRig
        view={props.view}
        punch={props.punch}
        camera={camera}
        controlsRef={controlsRef}
      />
      <FpsWatch onLow={props.onLowFps} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        enableZoom
        minDistance={2.6}
        maxDistance={5}
        minPolarAngle={0.85}
        maxPolarAngle={1.72}
        minAzimuthAngle={-Math.PI * 0.92}
        maxAzimuthAngle={Math.PI * 0.92}
        target={[0, 0, 0]}
      />
    </>
  );
}

export function ShirtScene(props: ShirtSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.25, 3.6], fov: 40, near: 0.1, far: 60 }}
      dpr={[1, 1.75]}
      gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
      onCreated={props.onCreated}
    >
      <SceneInner {...props} />
    </Canvas>
  );
}
