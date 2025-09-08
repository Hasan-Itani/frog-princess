"use client";
import { useState, useEffect } from "react";
 
const multipliers = [
  1.2, 1.5, 1.9, 2.4, 3, 5, 8, 14, 23, 30, 100, 250, 600, 1500,
];
 
export function useGameBoard() {
  const [frogStep, setFrogStep] = useState(-1);
  const [frogPad, setFrogPad] = useState(null);
  const [currentStep, setCurrentStep] = useState(0); // controls visible window
  const [padRotations, setPadRotations] = useState([]);
 
  useEffect(() => {
    const rotations = multipliers.map(() =>
      Array.from({ length: 5 }, () => Math.floor(Math.random() * 360))
    );
    setPadRotations(rotations);
  }, []);
 
  const visibleSteps = multipliers.slice(currentStep, currentStep + 5);
 
  const handleJump = (targetStep, padIndex) => {
    if (targetStep !== frogStep + 1) return;
 
    setFrogStep(targetStep);
    setFrogPad(padIndex);
 
    if (targetStep > currentStep) {
      setCurrentStep(targetStep);
    }
  };
 
  return {
    multipliers,
    currentStep,
    frogStep,
    frogPad,
    visibleSteps,
    padRotations,
    handleJump,
  };
}