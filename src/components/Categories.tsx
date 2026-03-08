import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { Brain, Flame, HandHeart, Heart, Leaf, Shield, Sparkles, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

export const categories: Array<{ id: string | number; name: string; icon: any; color: string; bgColor: string; image?: string }> = [
  {
    id: "rudraksha-bracelets",
    name: "Rudraksha Bracelets",
    icon: Sparkles,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    id: "rudraksha-malas",
    name: "Rudraksha Malas",
    icon: Heart,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    id: "nepali-rudraksha",
    name: "Nepali/Indian Rudraksha",
    icon: Shield,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: "spiritual-jewellery",
    name: "Spiritual Jewellery",
    icon: Star,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    id: "karungali-wearables",
    name: "Karungali Wearables",
    icon: HandHeart,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    id: "energy-stones",
    name: "Energy Stones",
    icon: Leaf,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: "Rashi-wearables",
    name: "Rashi Wearables",
    icon: Brain,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    id: "gift-hampers",
    name: "Gift Hampers",
    icon: Flame,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

const normalizeImage = (image?: string, updatedAt?: string) => {
  if (!image) return '';
  if (image.startsWith('data:')) return image;
  if (!updatedAt) return image;
  const separator = image.includes('?') ? '&' : '?';
  return `${image}${separator}v=${encodeURIComponent(updatedAt)}`;
};

const Categories = ({ heroCollectionIds }: { heroCollectionIds?: string[] }) => {
  const [remoteCategories, setRemoteCategories] = useState<Array<{ id: string | number; name: string; image?: string; updatedAt?: string; bgColor?: string; color?: string; icon?: any }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    apiFetch('/api/collections?limit=100')
      .then((res) => {
        const data = Array.isArray(res?.data) ? res.data : [];
        if (!active) return;

        let mapped = data.map((item: any, idx: number) => {
          const fb = categories[idx % categories.length];
          return {
            id: item.slug || item.id,
            name: item.name,
            image: normalizeImage(item.image, item.updatedAt),
            updatedAt: item.updatedAt,
            bgColor: fb.bgColor,
            color: fb.color,
            icon: fb.icon
          };
        });

        if (heroCollectionIds && heroCollectionIds.length > 0) {
          mapped = mapped.filter((item: any) => heroCollectionIds.includes(item.id));
        }

        setRemoteCategories(mapped.length > 0 ? mapped : categories);
        setIsLoading(false);
      })
      .catch(() => {
        if (active) {
          setRemoteCategories(categories);
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [heroCollectionIds]);

  const displayCategories = remoteCategories;

  return (
    <section className="pt-2 pb-1 bg-white">
      <div className="container mx-auto px-1">
        <Carousel
          opts={{
            align: "start",
            loop: true,
            dragFree: true,
          }}
          plugins={[
            Autoplay({
              delay: 3000,
              stopOnInteraction: false,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4 py-2">
            {displayCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <CarouselItem key={category.id} className="pl-2 md:pl-4 basis-1/4 md:basis-1/6 lg:basis-[12.5%] min-w-[70px]">
                  <Link
                    to={`/collections/${category.id}`}
                    className="flex flex-col items-center gap-1.5 w-full cursor-pointer group"
                  >
                    <div className="relative flex justify-center w-full">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-2 border-orange-50 group-hover:border-orange-200 transition-colors shadow-sm"
                        />
                      ) : (
                        <div className={`${category.bgColor} ${category.color} w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 border-orange-50 group-hover:border-orange-200 transition-colors shadow-sm`}>
                          <Icon className="h-7 w-7 md:h-8 md:w-8" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-slate-700 text-center leading-tight tracking-tight px-0.5 overflow-hidden text-ellipsis line-clamp-2 w-full max-w-[80px]">
                      {category.name}
                    </span>
                  </Link>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
};

export default Categories;
