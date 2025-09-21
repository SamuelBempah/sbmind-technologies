import gsap from "gsap";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/all";
import { TiLocationArrow } from "react-icons/ti";
import { useEffect, useRef, useState } from "react";

import Button from "./Button";
import VideoPreview from "./VideoPreview";

gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [hasClicked, setHasClicked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadedVideos, setLoadedVideos] = useState(0);

  const totalVideos = 2;
  const nextVdRef = useRef(null);

  const handleVideoLoad = () => {
    setLoadedVideos((prev) => prev + 1);
  };

  // Fallback to hide loading screen if videos don't load within 5 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn("Video loading timeout, hiding loading screen.");
        setLoading(false);
      }
    }, 5000);

    if (loadedVideos >= totalVideos) {
      setLoading(false);
    }

    return () => clearTimeout(timeout);
  }, [loadedVideos]);

  const handleMiniVdClick = () => {
    setHasClicked(true);
    setCurrentIndex((prevIndex) => (prevIndex % totalVideos) + 1);
  };

  useGSAP(
    () => {
      if (hasClicked && nextVdRef.current) {
        gsap.set("#next-video", { visibility: "visible" });
        gsap.to("#next-video", {
          transformOrigin: "center center",
          scale: 1,
          width: "100%",
          height: "100%",
          duration: 1,
          ease: "power1.inOut",
          onStart: () => {
            nextVdRef.current.play().catch((err) => {
              console.error("Video playback failed:", err);
            });
          },
        });
        gsap.from("#current-video", {
          transformOrigin: "center center",
          scale: 0,
          duration: 1.5,
          ease: "power1.inOut",
        });
      }
    },
    {
      dependencies: [currentIndex, hasClicked],
      revertOnUpdate: true,
    }
  );

  useGSAP(() => {
    gsap.set("#video-frame", {
      clipPath: "polygon(14% 0, 72% 0, 88% 90%, 0 95%)",
      borderRadius: "0% 0% 40% 10%",
    });
    gsap.from("#video-frame", {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      borderRadius: "0% 0% 0% 0%",
      ease: "power1.inOut",
      scrollTrigger: {
        trigger: "#video-frame",
        start: "center center",
        end: "bottom center",
        scrub: true,
      },
    });
  }, []);

  const getVideoSrc = (index) => `videos/hero-${index}.mp4`;

  return (
    <div className="relative h-dvh w-screen overflow-x-hidden">
      {loading && (
        <div className="flex-center absolute z-[100] h-dvh w-screen overflow-hidden bg-violet-50">
          <div className="three-body">
            <div className="three-body__dot"></div>
            <div className="three-body__dot"></div>
            <div className="three-body__dot"></div>
          </div>
        </div>
      )}

      <div
        id="video-frame"
        className="relative z-10 h-dvh w-screen overflow-hidden rounded-lg bg-blue-75"
      >
        <div>
          <div className="mask-clip-path absolute-center absolute z-50 size-64 cursor-pointer overflow-hidden rounded-lg">
            <VideoPreview>
              <div
                onClick={handleMiniVdClick}
                className="origin-center scale-50 opacity-0 transition-all duration-500 ease-in hover:scale-100 hover:opacity-100"
              >
                <video
                  ref={nextVdRef}
                  src={getVideoSrc(currentIndex === 1 ? 2 : 1)}
                  loop
                  muted
                  playsInline
                  id="current-video"
                  className="size-64 origin-center scale-150 object-cover object-center"
                  onLoadedData={handleVideoLoad}
                  onError={(e) => {
                    console.error("Video failed to load:", e);
                    handleVideoLoad();
                  }}
                />
              </div>
            </VideoPreview>
          </div>

          <video
            src={getVideoSrc(currentIndex)}
            autoPlay
            loop
            muted
            playsInline
            id="next-video"
            className="absolute-center invisible absolute z-20 size-64 object-cover object-center"
            onLoadedData={handleVideoLoad}
            onError={(e) => {
              console.error("Video failed to load:", e);
              handleVideoLoad();
            }}
          />
          <video
            src={getVideoSrc(currentIndex)}
            autoPlay
            loop
            muted
            playsInline
            className="absolute left-0 top-0 size-full object-cover object-center"
            onLoadedData={handleVideoLoad}
            onError={(e) => {
              console.error("Video failed to load:", e);
              handleVideoLoad();
            }}
          />
        </div>

        <h1
          className="special-font hero-heading absolute bottom-5 right-5 z-40 text-white"
          style={{ textShadow: "0 0 10px red, 0 0 20px rgba(255,0,0,0.8)" }}
        >
          W<b>EB</b>SITE
        </h1>

        <div className="absolute left-0 top-0 z-40 size-full pointer-events-none">
          <div className="mt-24 px-5 sm:px-10">
            <h1
              className="special-font hero-heading text-blue-100"
              style={{ textShadow: "0 0 10px #93c5fd, 0 0 20px #93c5fd" }}
            >
              redefi<b>ne</b> your
            </h1>

            <p className="mb-5 max-w-64 font-robert-regular text-blue-100">
              Step into the Future of Tech <br /> Empower Your Digital Innovation
            </p>

            <Link to="/request" className="inline-block pointer-events-auto">
              <Button
                id="btn"
                title="Apply Now"
                leftIcon={<TiLocationArrow />}
                containerClass="bg-yellow-300 flex-center gap-1 touch-action-manipulation"
              />
            </Link>
          </div>
        </div>
      </div>

      <h1
        className="special-font hero-heading absolute bottom-5 right-5 z-50 text-white"
        style={{ textShadow: "0 0 10px red, 0 0 20px rgba(255,0,0,0.8)" }}
      >
        W<b>EB</b>SITE
      </h1>
    </div>
  );
};

export default Hero;