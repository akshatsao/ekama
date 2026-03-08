import { CheckCircle2, Shield, Truck, Award } from "lucide-react";

const badges = [
  {
    id: 1,
    icon: CheckCircle2,
    title: "Happily Made",
    subtitle: "Authentic Craftsmanship",
  },
  {
    id: 2,
    icon: Shield,
    title: "Third-party tested",
    subtitle: "Lab Certified Products",
  },
  {
    id: 3,
    icon: Truck,
    title: "Return & exchange",
    subtitle: "Easy 7-day returns",
  },
  {
    id: 4,
    icon: Award,
    title: "Free delivery",
    subtitle: "Orders above ₹299",
  },
];

const TrustBadges = () => {
  return (
    <section className="py-12 bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.id}
                className="flex flex-col items-center text-center animate-in fade-in duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="bg-primary/10 text-primary w-14 h-14 rounded-full flex items-center justify-center mb-3">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{badge.title}</h3>
                <p className="text-sm text-muted-foreground">{badge.subtitle}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
