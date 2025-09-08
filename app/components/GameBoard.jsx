"use client";
import Image from "next/image";
import { useGameBoard } from "../hooks/useGameBoard";
 
export default function GameBoard() {
  const { currentStep, frogStep, frogPad, visibleSteps, padRotations, handleJump } =
    useGameBoard();
 
  return (
    <div className="w-full h-full flex flex-col justify-end relative">
      {[...visibleSteps].reverse().map((mult, i) => {
        const stepIndex = currentStep + (visibleSteps.length - 1 - i);
        const isActive = stepIndex === frogStep + 1; // only the next line clickable
        const opacity =
          i === visibleSteps.length - 1
            ? 1
            : 1 - (visibleSteps.length - 1 - i) * 0.15;
 
        return (
          <div
            key={stepIndex}
            className="flex items-center justify-center mb-2 relative"
            style={{ opacity }}
          >
            <div className="mr-2 flex items-center justify-center relative">
              <Image src="/flower.png" alt="Flower" width={70} height={70} className="object-contain" />
              <span className="absolute text-xs font-bold text-white">x{mult}</span>
            </div>
 
            <div className="flex mr-2">
              {[...Array(5)].map((_, idx) => {
                const hasFrog = frogStep === stepIndex && frogPad === idx;
                const rotation = padRotations[stepIndex]?.[idx] ?? 0;
 
                return (
                  // pass the absolute stepIndex to handler
                  <button
                    key={idx}
                    disabled={!isActive}
                    onClick={() => handleJump(stepIndex, idx)}
                    className={`relative transition-transform ${!isActive ? "opacity-50 cursor-not-allowed" : "opacity-100 cursor-pointer"}`}
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    <Image src="/lilly.png" alt="Lily Pad" width={60} height={60} className="rounded-full" />
                    {hasFrog && (
                      <Image src="/frog.png" alt="Frog" width={35} height={35} className="absolute inset-0 m-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
 
      <div className="flex items-center justify-center -mb-10 relative">
        <Image src="/rock.png" alt="Rock" width={80} height={80} className="object-contain" style={{ transform: "rotate(270deg)" }} />
        {frogStep === -1 && (
          <Image src="/frog.png" alt="Frog" width={45} height={45} className="absolute mb-7" />
        )}
      </div>
    </div>
  );
}