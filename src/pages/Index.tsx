import Categories from "@/components/Categories";
import Collections from "@/components/Collections";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import PromoBanner from "@/components/PromoBanner";
import VideoPromoBanner from "@/components/VideoPromoBanner";
import ProductShowcase from "@/components/ProductShowcase";
import Testimonials from "@/components/Testimonials";
import TrustBadges from "@/components/TrustBadges";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type StoreSettingsDoc = {
  heroTitle: string;
  heroVisible: boolean;
  trendingTitle: string;
  trendingVisible: boolean;
  newArrivalsTitle: string;
  newArrivalsVisible: boolean;
  collectionsTitle: string;
  collectionsVisible: boolean;
  reviewsTitle: string;
  reviewsVisible: boolean;
  featuresTitle: string;
  featuresVisible: boolean;
  trendingProductIds: string[];
  newArrivalsProductIds: string[];
  promoBannerTitle: string;
  promoBannerVisible: boolean;
  promoBannerImages: string[];
  videoPromoTitle: string;
  videoPromoVisible: boolean;
  videoPromoUrls: string[];
  testimonials?: {
    id: string;
    name: string;
    location: string;
    rating: number;
    text: string;
    image: string;
    verified: boolean;
  }[];
  heroCollectionIds?: string[];
};

const Index = () => {
  const [settings, setSettings] = useState<StoreSettingsDoc | null>(null);

  useEffect(() => {
    apiFetch("/api/settings/home_page_layout")
      .then((res: unknown) => {
        const data = res as StoreSettingsDoc;
        if (data && data.heroTitle !== undefined) {
          setSettings(data);
        }
      })
      .catch((err) => console.error("Failed to fetch settings", err));
  }, []);

  return (
    <div className="min-h-screen bg-transparent">
      <Header />
      <div className="max-w-[1100px] mx-auto w-full flex-1">
        <main className="flex flex-col gap-1 pt-1 pb-4">
          {(!settings || settings.heroVisible) && (
            <Categories heroCollectionIds={settings?.heroCollectionIds} />
          )}
          {(!settings || settings.promoBannerVisible) && (
            <PromoBanner imageUrls={settings?.promoBannerImages} />
          )}
          {(!settings || settings.collectionsVisible) && (
            <Collections title={settings?.collectionsTitle} />
          )}
          <ProductShowcase
            trendingTitle={settings?.trendingTitle}
            newArrivalsTitle={settings?.newArrivalsTitle}
            trendingVisible={settings ? settings.trendingVisible : true}
            newArrivalsVisible={settings ? settings.newArrivalsVisible : true}
            trendingProductIds={settings?.trendingProductIds}
            newArrivalsProductIds={settings?.newArrivalsProductIds}
          />
          {(!settings || settings.videoPromoVisible !== false) && (
            <VideoPromoBanner
              title={settings?.videoPromoTitle || "Experience the Divine"}
              videoUrls={settings?.videoPromoUrls || ["https://www.w3schools.com/html/mov_bbb.mp4"]}
            />
          )}
          <TrustBadges />
          {settings?.reviewsVisible && (
            <Testimonials title={settings?.reviewsTitle} testimonials={settings?.testimonials} />
          )}
          {(!settings || settings.featuresVisible) && (
            <Features title={settings?.featuresTitle} />
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Index;
