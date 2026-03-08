import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { BASE_URL } from "@/lib/api";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

type Testimonial = {
  id: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  image: string;
  verified: boolean;
};

const defaultTestimonials: Testimonial[] = [
  {
    id: "1",
    name: "Priya Sharma",
    location: "Mumbai",
    rating: 5,
    text: "The quality of the rudraksha beads is exceptional. I can feel the positive energy every time I wear them.",
    image: "https://images.unsplash.com/photo-1605648813351-5b746813ac47?q=80&w=600&auto=format&fit=crop",
    verified: true,
  }
];

const Testimonials = ({
  title = "Over 1 Million+ Happy Customers ❤️",
  testimonials = defaultTestimonials
}: {
  title?: string,
  testimonials?: Testimonial[]
}) => {
  const displayTestimonials = testimonials && testimonials.length > 0 ? testimonials : defaultTestimonials;

  return (
    <section className="py-10 bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2 text-foreground">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Trusted by seekers across India for authentic spiritual products
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 4000,
            }),
          ]}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent className="-ml-4 gap-y-4">
            {displayTestimonials.map((testimonial, index) => {
              const bgImage = testimonial.image && !testimonial.image.startsWith('http') && !testimonial.image.startsWith('/')
                ? `${BASE_URL}/uploads/${testimonial.image}`
                : testimonial.image;

              return (
                <CarouselItem key={testimonial.id || index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card
                    className="overflow-hidden border group rounded-2xl h-[400px] flex flex-col bg-white"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Top Image Section */}
                    <div className="h-[55%] w-full relative overflow-hidden group">
                      {bgImage ? (
                        <div
                          className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                          style={{ backgroundImage: `url(${bgImage})` }}
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                          <Star className="w-12 h-12 text-slate-300" />
                        </div>
                      )}

                      {/* Subtle gradient so stars are readable on any image */}
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                      {/* Stars Overlay in Image Section */}
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center gap-1 z-10">
                        {[...Array(testimonial.rating || 5)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-[#c73e41] text-[#c73e41] drop-shadow-md"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Bottom Content Section */}
                    <CardContent className="h-[45%] px-5 pb-5 pt-3 flex flex-col items-center text-center">
                      <p className="font-semibold text-slate-800 text-base mb-1 mt-auto">{testimonial.name}</p>

                      {testimonial.location && (
                        <p className="text-xs text-slate-500 mb-2">{testimonial.location}</p>
                      )}

                      <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-auto">
                        "{testimonial.text}"
                      </p>

                      {testimonial.verified && (
                        <p className="text-xs font-medium text-emerald-500 mt-1 pb-1">✓ Verified Buyer</p>
                      )}
                    </CardContent>
                  </Card>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
};

export default Testimonials;
