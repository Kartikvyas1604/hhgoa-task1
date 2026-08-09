"use client";

import * as THREE from "three";
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture, Environment, Lightformer } from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import { CARD_SIZE } from "@/components/frame/types";

extend({ MeshLineGeometry, MeshLineMaterial });

const TAG_GLB = "/assets/3d/tag.glb";
useGLTF.preload(TAG_GLB);

// the collider/joint numbers below are tuned to the real tag.glb card mesh —
// half-extents matching our portrait aspect ratio (1200x1623)
const CARD_HALF_W = 0.8;
const CARD_HALF_H = CARD_HALF_W * (CARD_SIZE.portrait.h / CARD_SIZE.portrait.w);

// tag.glb's "card" mesh local bounds (measured from the GLTF accessors):
// x [-0.358, 0.358], y [0.023, 1.023] — its baked UVs only cover a cropped
// sub-region of its own source texture (v: 0–0.757), so mapping an arbitrary
// full-frame texture through them renders cropped/mirrored. We keep that
// geometry for the physical slab (edges/back), but draw our own texture on a
// plain plane sized to the same footprint, which has standard 0–1 UVs.
const TAG_CARD_W = 0.7164;
const TAG_CARD_H = 1.0;
const TAG_CARD_CENTER_Y = 0.523;

interface BandProps {
  imageUrl: string;
  backImageUrl?: string;
  maxSpeed?: number;
  minSpeed?: number;
}

/**
 * The rope-and-badge rig — three rope-jointed segments plus a spherically
 * jointed card, all real Rapier rigid bodies, with a MeshLine band drawn
 * through a Catmull-Rom curve fit to their positions. Ported from Vercel's
 * "Building an interactive 3D event badge with React Three Fiber" reference
 * (pmndrs/react-three-rapier + meshline), swapping their branded card face
 * for ours.
 */
/**
 * The lanyard band texture. The source is a very thin, non-power-of-two SVG
 * strip (2418×74). Sampling it raw with LinearFilter aliases into the
 * shimmering/"glitchy" moiré the band had while swinging. Fix: bake it once
 * into a power-of-two canvas (2048×128) so it can be mipmapped cleanly on
 * every GPU (NPOT mipmaps are WebGL2-only), then use linear-mipmap filtering
 * so distance/motion samples a pre-filtered mip instead of raw pixels.
 */
function useBandTexture(): THREE.Texture {
  const src = useTexture("/assets/border-botanical.svg");
  // useTexture() suspends, so src.image is already decoded here — bake
  // synchronously instead of in an effect, so the material never renders a
  // half-configured texture.
  return useMemo(() => {
    const img = src.image as HTMLImageElement | null;
    if (!img || img.width === 0) return src;
    // 2048x64 is power-of-two and keeps the source's ~32:1 aspect, so the
    // botanical pattern reads exactly as designed — no vertical stretching.
    const W = 2048;
    const H = 64;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return src;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, W, H);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 4;
    tex.colorSpace = src.colorSpace;
    tex.needsUpdate = true;
    return tex;
  }, [src]);
}
function Band({ imageUrl, backImageUrl, maxSpeed = 50, minSpeed = 10 }: BandProps) {
  const band = useRef<THREE.Mesh & { geometry: MeshLineGeometry }>(null!);
  const fixed = useRef<RapierRigidBody>(null!);
  const j1 = useRef<RapierRigidBody & { lerped?: THREE.Vector3 }>(null!);
  const j2 = useRef<RapierRigidBody & { lerped?: THREE.Vector3 }>(null!);
  const j3 = useRef<RapierRigidBody>(null!);
  const card = useRef<RapierRigidBody>(null!);
  // prettier-ignore
  const vec = new THREE.Vector3(), ang = new THREE.Vector3(), rot = new THREE.Vector3(), dir = new THREE.Vector3();
  const segmentProps = { type: "dynamic" as const, canSleep: true, angularDamping: 2, linearDamping: 2 };
  const { nodes, materials } = useGLTF(TAG_GLB) as unknown as {
    nodes: { card: THREE.Mesh; clip: THREE.Mesh; clamp: THREE.Mesh };
    materials: { metal: THREE.MeshStandardMaterial };
  };
  const texture = useTexture(imageUrl);
  const backTexture = useTexture(backImageUrl || imageUrl);
  const bandTexture = useBandTexture();
  // mutable Three.js object, deliberately not React state — its .points are
  // mutated in place every frame inside useFrame below, same as upstream
  const curve = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
    ]);
    c.curveType = "chordal";
    return c;
  }, []);
  const { width, height } = useThree((state) => state.size);
  const [dragged, drag] = useState<THREE.Vector3 | false>(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, CARD_HALF_H * 1.29, 0],
  ]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? "grabbing" : "grab";
      return () => void (document.body.style.cursor = "auto");
    }
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }
    if (fixed.current) {
      // smooth out jitter when the card is pulled far from rest
      [j1, j2].forEach((ref) => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
        ref.current.lerped.lerp(ref.current.translation(), delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)));
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped!);
      curve.points[2].copy(j1.current.lerped!);
      curve.points[3].copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(32));
      // tilt the card back to face the camera
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation() as unknown as THREE.Vector3);
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z }, true);
    }
  });

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[CARD_HALF_W, CARD_HALF_H, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e) => {
              (e.target as Element).releasePointerCapture(e.pointerId);
              drag(false);
            }}
            onPointerDown={(e) => {
              (e.target as Element).setPointerCapture(e.pointerId);
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())));
            }}
          >
            {/* physical slab (edges + slight bevel) from the reference asset — plain material, no texture */}
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial color="#046835" clearcoat={0.6} clearcoatRoughness={0.25} roughness={0.4} metalness={0.1} />
            </mesh>
            {/* our own card faces — plain planes with standard UVs, sized to the
                same footprint as the slab above. Front sits just in front of
                it; back is rotated 180° and sits just behind it, so spinning
                the badge around reveals the real back-of-card design instead
                of a blank slab. */}
            {/* matte, no clearcoat/gloss — a reflective coating here smears
                glare across the QR code and makes it unscannable up close */}
            <mesh position={[0, TAG_CARD_CENTER_Y, 0.006]}>
              <planeGeometry args={[TAG_CARD_W, TAG_CARD_H]} />
              <meshStandardMaterial map={texture} map-anisotropy={16} roughness={0.85} metalness={0} />
            </mesh>
            <mesh position={[0, TAG_CARD_CENTER_Y, -0.004]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[TAG_CARD_W, TAG_CARD_H]} />
              <meshStandardMaterial map={backTexture} map-anisotropy={16} roughness={0.85} metalness={0} />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          args={[{ resolution: new THREE.Vector2(width, height) }]}
          color="white"
          transparent
          map={bandTexture}
          useMap={1}
          repeat={[-0.35, 1]}
          depthTest={false}
          resolution={[width, height]}
          lineWidth={2.2}
        />
      </mesh>
    </>
  );
}

function Scene({ imageUrl, backImageUrl }: { imageUrl: string; backImageUrl?: string }) {
  return (
    <>
      <ambientLight intensity={Math.PI} />
      <Physics interpolate gravity={[0, -40, 0]} timeStep={1 / 60}>
        <Band imageUrl={imageUrl} backImageUrl={backImageUrl} />
      </Physics>
      <Environment blur={0.75}>
        <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
      </Environment>
    </>
  );
}

export interface Card3DProps {
  imageUrl: string;
  backImageUrl?: string;
  className?: string;
}

class WebglBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** The interactive, physics-driven hanging badge — a lanyard clip and rope
 * band holding the card, which drops in, swings to rest, and can be dragged
 * with the cursor or a finger. Falls back to the flat card image if WebGL
 * isn't available on the device. */
export function Card3D({ imageUrl, backImageUrl, className = "" }: Card3DProps) {
  const [ready, setReady] = useState(false);

  const fallback = (
    // eslint-disable-next-line @next/next/no-img-element -- object/blob URL, not optimisable
    <img src={imageUrl} alt="Builder card" className="h-full w-full rounded-lg object-contain" />
  );

  return (
    <div className={`relative touch-none ${className}`}>
      <WebglBoundary fallback={fallback}>
        <Canvas
          camera={{ position: [0, 0, 8.5], fov: 24 }}
          onCreated={() => setReady(true)}
          style={{ opacity: ready ? 1 : 0, transition: "opacity 300ms ease" }}
        >
          <Suspense fallback={null}>
            <Scene imageUrl={imageUrl} backImageUrl={backImageUrl} />
          </Suspense>
        </Canvas>
      </WebglBoundary>
    </div>
  );
}
