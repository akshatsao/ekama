import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "@/lib/api";

const fallbackBanners = [
  { id: '1', title: '', image: "/images/ayodha-banner2.webp" },
  { id: '2', title: '', image: "/images/banner.jpg" },
  { id: '3', title: '', image: "/src/assets/ram_mandir3.jpg" },
];

const normalizeImage = (image?: string, updatedAt?: string) => {
  if (!image) return '';
  if (image.startsWith('data:')) return image;
  if (!updatedAt) return image;
  const separator = image.includes('?') ? '&' : '?';
  return `${image}${separator}v=${encodeURIComponent(updatedAt)}`;
};

const Hero = ({ heroCollectionIds }: { heroCollectionIds?: string[] }) => {
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState<any[]>(fallbackBanners);

  useEffect(() => {
    let active = true;
    apiFetch('/api/collections?limit=50')
      .then((res) => {
        const data = Array.isArray(res?.data) ? res.data : [];
        if (!active) return;
        if (data.length > 0) {
          let mapped = data.filter((item: any) => item.image).map((item: any) => ({
            id: item.slug || item.id,
            title: item.name,
            description: item.description,
            image: normalizeImage(item.image, item.updatedAt)
          }));

          if (heroCollectionIds && heroCollectionIds.length > 0) {
            mapped = mapped.filter((item) => heroCollectionIds.includes(item.id));
            // if somehow our selected collections don't have images, it might be empty
          } else {
            // default to 5
            mapped = mapped.slice(0, 5);
          }

          if (mapped.length > 0) {
            setSlides(mapped);
          }
        }
      })
      .catch((err) => console.error("Failed to fetch collections for hero", err));
    return () => {
      active = false;
    };
  }, [heroCollectionIds]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative w-full aspect-[16/9] sm:aspect-[21/9] overflow-hidden bg-slate-100 shadow-sm">
      <div
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide) => (
          <Link
            to={slide.id.length > 2 ? `/collections/${slide.id}` : '#'}
            key={slide.id}
            className="block w-full h-full flex-shrink-0 relative group"
          >
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            />
          </Link>
        ))}
      </div>

      {/* Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 focus:outline-none z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${current === i ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
                }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Hero;
