import { useEffect } from "react";
import useAudio from "./hooks/useAudio";

export default function AllowAudioGate({ children }) {
  const { play } = useAudio();

  useEffect(() => {
    const unlock = () => {
      play("ambience");
      window.removeEventListener("click", unlock);
    };
    window.addEventListener("click", unlock);
    return () => window.removeEventListener("click", unlock);
  }, [play]);

  return children;
}
