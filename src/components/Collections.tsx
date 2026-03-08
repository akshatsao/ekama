import { apiFetch, getImageUrl } from '@/lib/api';
import { ChevronRight, Coins, Gem, Gift, Heart, Mountain, Sparkles, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const fallbackCollections = [
  {
    id: 'rudraksha-bracelets',
    title: 'Rudraksha Bracelets',
    description: 'Sacred beads for spiritual protection',
    icon: Heart,
    gradient: 'from-orange-400 to-red-500',
    hoverGradient: 'from-orange-500 to-red-600',
    image: '/images/Rudraksha_Bracelets/Rudraksha_Bracelets1.jpg'
  },
  {
    id: 'rudraksha-malas',
    title: 'Rudraksha Malas',
    description: 'Traditional prayer beads for meditation',
    icon: Sparkles,
    gradient: 'from-amber-400 to-orange-500',
    hoverGradient: 'from-amber-500 to-orange-600',
    image: '/images/Rudraksha Malas/Rudraksha Malas1.jpeg'
  },
  {
    id: 'nepali-rudraksha',
    title: 'Nepali/Indian Rudraksha',
    description: 'Authentic Himalayan rudraksha beads',
    icon: Mountain,
    gradient: 'from-red-400 to-pink-500',
    hoverGradient: 'from-red-500 to-pink-600',
    image: '/images/NepaliIndian Rudraksha/Rudraksha1.jpg'
  },
  {
    id: 'spiritual-jewellery',
    title: 'Spiritual Jewellery',
    description: 'Divine ornaments for daily wear',
    icon: Gem,
    gradient: 'from-purple-400 to-pink-500',
    hoverGradient: 'from-purple-500 to-pink-600',
    image: '/images/Spiritual Jewellery/Spiritual Jewellery2.jpg'
  },
  {
    id: 'karungali-wearables',
    title: 'Karungali Wearables',
    description: 'Powerful ebony wood accessories',
    icon: Zap,
    gradient: 'from-gray-600 to-gray-800',
    hoverGradient: 'from-gray-700 to-gray-900',
    image: '/images/Karungali Wearables/Karungali Wearables2.jpg'
  },
  {
    id: 'energy-stones',
    title: 'Energy Stones',
    description: 'Natural crystals for positive energy',
    icon: Sparkles,
    gradient: 'from-blue-400 to-purple-500',
    hoverGradient: 'from-blue-500 to-purple-600',
    image: '/images/Energy Stones/Energy Stones1.jpeg'
  },
  {
    id: 'Rashi-wearables',
    title: 'Rashi Wearables',
    description: 'Fool\'s gold for prosperity & wealth',
    icon: Coins,
    gradient: 'from-yellow-400 to-amber-500',
    hoverGradient: 'from-yellow-500 to-amber-600',
    image: '/images/Rashi Wearables/Rashi Wearables1.jpg'
  },
  {
    id: 'gift-hampers',
    title: 'Gift Hampers',
    description: 'Curated spiritual gift sets for loved ones',
    icon: Gift,
    gradient: 'from-pink-400 to-rose-500',
    hoverGradient: 'from-pink-500 to-rose-600',
    image: '/images/Gift Hampers/Gift Hampers1.jpeg'
  }
];

const normalizeImage = (image?: string, updatedAt?: string) => {
  const url = getImageUrl(image);
  if (!url) return '';
  if (url.startsWith('data:') || !updatedAt) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(updatedAt)}`;
};

const Collections = ({ title = "Shop Our Collections" }: { title?: string }) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [collections, setCollections] = useState(fallbackCollections);

  useEffect(() => {
    let active = true;
    apiFetch('/api/collections?limit=100')
      .then((res) => {
        const data = Array.isArray(res?.data) ? res.data : [];
        if (!active) return;
        if (data.length > 0) {
          const mapped = data.map((item: { id: string; slug?: string; name: string; description?: string; image?: string; updatedAt?: string }, index: number) => {
            const fallback = fallbackCollections[index % fallbackCollections.length];
            const normalizedImage = normalizeImage(item.image, item.updatedAt);
            return {
              id: item.slug || item.id,
              title: item.name,
              description: item.description || fallback.description,
              icon: fallback.icon,
              gradient: fallback.gradient,
              hoverGradient: fallback.hoverGradient,
              image: normalizedImage || fallback.image
            };
          });
          setCollections(mapped);
        } else {
          setCollections(fallbackCollections);
        }
      })
      .catch(() => {
        if (active) setCollections(fallbackCollections);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="py-4 relative z-10 bg-white shadow-sm">
      <div className="w-full px-2 md:px-4">
        {/* Section Header */}
        <div className="text-center mb-2">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent whitespace-nowrap">
            {title}
          </h2>
        </div>

        {/* Horizontal Sidebar Boxes */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
          {collections.map((collection) => {
            const to = `/collections/${collection.id}`;
            const IconComponent = collection.icon;
            return (
              <Link
                to={to}
                key={collection.id}
                className="group relative bg-white rounded-lg md:rounded-2xl shadow-sm md:shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border border-gray-100 hover:border-orange-300 overflow-hidden flex flex-col h-36 md:h-64"
                onMouseEnter={() => setHoveredItem(collection.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Product Image */}
                {collection.image && (
                  <div className="relative h-[85%] md:h-[80%] overflow-hidden bg-slate-50/50 p-2">
                    <img
                      src={collection.image}
                      alt={collection.title}
                      className="w-full h-full object-cover transform transition-all duration-500 scale-100 rounded-md"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-1 h-[15%] md:h-[20%] flex flex-col items-center justify-center text-center">
                  {/* Icon Container (only for items without images) */}
                  {!collection.image && (
                    <div className="relative mb-1 md:mb-2">
                      <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full bg-gradient-to-br ${hoveredItem === collection.id ? collection.hoverGradient : collection.gradient} flex items-center justify-center transform transition-all duration-300 ${hoveredItem === collection.id ? 'scale-110 rotate-12' : 'scale-100'}`}>
                        <IconComponent className="w-4 h-4 md:w-6 md:h-6 text-white" />
                      </div>
                    </div>
                  )}

                  <h3 className="text-[10px] md:text-base font-bold text-orange-900 group-hover:text-orange-700 transition-colors duration-300 line-clamp-1 md:line-clamp-2">
                    {collection.title}
                  </h3>
                </div>

                {/* Hover Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`} />
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/collections/all"
            className="inline-block bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            View All Collections
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Collections;
