import React from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { getImageUrl } from "@/lib/api";

interface PromoBannerProps {
    imageUrls?: string[];
}

const PromoBanner: React.FC<PromoBannerProps> = ({ imageUrls }) => {
    const validUrls = React.useMemo(() => {
        if (!imageUrls) return [];
        return imageUrls.map(url => getImageUrl(url));
    }, [imageUrls]);

    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
        Autoplay({ delay: 4000, stopOnInteraction: false }),
    ]);

    const [selectedIndex, setSelectedIndex] = React.useState(0);

    React.useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on("select", () => {
            setSelectedIndex(emblaApi.selectedScrollSnap());
        });
    }, [emblaApi]);

    if (!imageUrls || imageUrls.length === 0 || validUrls.length === 0) return null;

    if (validUrls.length === 1) {
        return (
            <section className="w-full mt-4 mb-2">
                <div className="w-full bg-slate-50 overflow-hidden shadow-sm relative group">
                    <img
                        src={validUrls[0]}
                        alt="Promotional Banner"
                        className="w-full min-h-[250px] max-h-[600px] object-cover"
                        loading="lazy"
                    />
                </div>
            </section>
        );
    }

    return (
        <section className="w-full mt-4 mb-2">
            <div className="w-full relative overflow-hidden shadow-sm group bg-slate-50">
                <div className="overflow-hidden" ref={emblaRef}>
                    <div className="flex">
                        {validUrls.map((url, index) => (
                            <div
                                key={index}
                                className="flex-[0_0_100%] min-w-0"
                            >
                                <img
                                    src={url}
                                    alt={`Promotional Banner ${index + 1}`}
                                    className="w-full h-auto object-cover max-h-[600px]"
                                    loading={index === 0 ? "eager" : "lazy"}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation Dots */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                    {validUrls.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => emblaApi?.scrollTo(index)}
                            className={`h-2 rounded-full transition-all duration-300 ${selectedIndex === index
                                ? "w-8 bg-white"
                                : "w-2 bg-white/50 hover:bg-white/75"
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PromoBanner;
