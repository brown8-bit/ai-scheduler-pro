import { Canvas } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";
import { FC } from "react";
import { cn } from "@/lib/utils";

interface Logo3DProps {
  className?: string;
}

const ClockFace = () => {
  return (
    <group>
      {/* White border/background - slightly larger rounded box behind */}
      <RoundedBox args={[2.4, 2.4, 0.3]} radius={0.3} position={[0, 0, -0.1]}>
        <meshStandardMaterial color="#ffffff" />
      </RoundedBox>

      {/* Orange rounded square */}
      <RoundedBox args={[2.2, 2.2, 0.3]} radius={0.25} position={[0, 0, 0]}>
        <meshStandardMaterial color="#f97316" />
      </RoundedBox>

      {/* Number 12 */}
      <Text
        position={[0, 0.75, 0.16]}
        fontSize={0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Bold.woff"
      >
        12
      </Text>

      {/* Number 3 */}
      <Text
        position={[0.75, 0, 0.16]}
        fontSize={0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        3
      </Text>

      {/* Number 6 */}
      <Text
        position={[0, -0.75, 0.16]}
        fontSize={0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        6
      </Text>

      {/* Number 9 */}
      <Text
        position={[-0.75, 0, 0.16]}
        fontSize={0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        9
      </Text>

      {/* Single clock hand pointing at 12 (not touching) */}
      <mesh position={[0, 0.25, 0.16]}>
        <boxGeometry args={[0.08, 0.4, 0.05]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Center dot */}
      <mesh position={[0, 0, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.05, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Smile curve - made with small spheres */}
      {Array.from({ length: 9 }).map((_, i) => {
        const angle = (Math.PI / 8) + (i * Math.PI / 12);
        const x = Math.cos(angle) * 0.4 - 0.15;
        const y = -Math.sin(angle) * 0.3 - 0.25;
        return (
          <mesh key={i} position={[x + 0.15, y, 0.16]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        );
      })}
    </group>
  );
};

export const Logo3D: FC<Logo3DProps> = ({ className }) => {
  return (
    <div className={cn("w-full h-full", className)}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 35 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 2, 2]} intensity={1} />
        <directionalLight position={[-2, -2, 2]} intensity={0.3} />
        <ClockFace />
      </Canvas>
    </div>
  );
};
