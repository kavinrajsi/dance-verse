import WatchMoves from "@/components/WatchMoves";
import AboutSection from "@/components/AboutSection";
import PrizeSection from "@/components/PrizeSection";
import HowToJoin from "@/components/HowToJoin";
import StepInto from "@/components/StepInto";
import Banner from "@/components/Banner";

export default function Home() {
  return (
    <>
      <Banner />
      <StepInto />
      <HowToJoin />
      <AboutSection />
      <PrizeSection />
      <WatchMoves
        items={[
          { src: "/video-1.png", alt: "Courtyard group" },
          { src: "/video-2.png", alt: "Studio crew" },
          { src: "/video-3.png", alt: "Solo performance" },
          { src: "/video-4.png", alt: "Outdoor routine" },
        ]}
      />
    </>
  );
}
