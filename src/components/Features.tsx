import { Shield, Truck, Award, HeartHandshake } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Shield,
    title: "Lab Certified",
    description: "Every product is tested and certified for authenticity and quality",
    color: "text-primary",
  },
  {
    icon: Truck,
    title: "Free Delivery",
    description: "Free shipping on all orders above ₹299 across India",
    color: "text-secondary",
  },
  {
    icon: Award,
    title: "Premium Quality",
    description: "Handcrafted spiritual items made with the finest materials",
    color: "text-accent",
  },
  {
    icon: HeartHandshake,
    title: "Trusted by Thousands",
    description: "Join our community of spiritual seekers and practitioners",
    color: "text-primary",
  },
];

const Features = ({ title = "The Ekama Promise" }: { title?: string }) => {
  return (
    <section className="py-12 bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Divine authenticity meets modern certification for your spiritual journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group animate-in fade-in slide-in-from-bottom duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6 text-center">
                  <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted group-hover:scale-110 transition-transform duration-300">
                    <Icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
