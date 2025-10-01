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
          { src: "/video/video-1.webm", poster: "/video/video-1.png" },
          { src: "/video/video-2.webm", poster: "/video/video-2.png" },
          { src: "/video/video-3.webm", poster: "/video/video-3.png" },
          { src: "/video/video-4.webm", poster: "/video/video-4.png" },
        ]}
      />
    </>
  );
}
