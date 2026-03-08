import React, { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { getImageUrl } from "@/lib/api";

interface VideoPromoBannerProps {
    title?: string;
    videoUrls?: string[];
}

const VideoPromoBanner: React.FC<VideoPromoBannerProps> = ({ title, videoUrls }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Reset index if the array changes
    useEffect(() => {
        setCurrentIndex(0);
        setIsMuted(true); // Default to muted on new array
    }, [videoUrls]);

    const currentUrl = videoUrls && videoUrls.length > 0 ? videoUrls[currentIndex] : null;
    const formattedUrl = currentUrl ? getImageUrl(currentUrl) : "";

    // Handle browser autoplay policies (browsers block unmuted autoplay)
    useEffect(() => {
        if (videoRef.current && currentUrl) {
            videoRef.current.muted = isMuted;
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    if (error.name === "NotAllowedError") {
                        // Browser blocked unmuted autoplay, fallback to muted
                        setIsMuted(true);
                        if (videoRef.current) {
                            videoRef.current.muted = true;
                            videoRef.current.play().catch(e => console.log("Muted autoplay also blocked", e));
                        }
                    }
                });
            }
        }
    }, [currentIndex, isMuted, currentUrl]);

    if (!videoUrls || videoUrls.length === 0) return null;
    if (!currentUrl) return null;

    const handleVideoEnded = () => {
        if (videoUrls.length > 1) {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % videoUrls.length);
        }
    };

    return (
        <section className="w-full mt-4 mb-2 flex justify-center">
            <div className="w-full max-w-[1472px] relative overflow-hidden shadow-sm bg-slate-50 group">
                <video
                    key={formattedUrl}
                    ref={videoRef}
                    src={formattedUrl}
                    className="w-full aspect-[1472/700] object-cover block"
                    autoPlay
                    loop={videoUrls.length === 1}
                    muted={isMuted}
                    playsInline
                    onEnded={handleVideoEnded}
                />

                {/* Mute Toggle Button */}
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="absolute top-2 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-all shadow-md z-10 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white border border-white/20"
                    aria-label={isMuted ? "Unmute video" : "Mute video"}
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? (
                        <VolumeX className="w-4 h-4 drop-shadow-sm" />
                    ) : (
                        <Volume2 className="w-4 h-4 drop-shadow-sm" />
                    )}
                </button>
            </div>
            {title && (
                <div className="sr-only">
                    {title}
                </div>
            )}
        </section>
    );
};

export default VideoPromoBanner;
