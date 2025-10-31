import Link from "next/link"
import { Heart, Users, TrendingUp, Award, Sparkles, ArrowRight, Target, Eye, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 py-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div
            className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <div className="container max-w-7xl mx-auto px-4 md:px-6 relative">
          <div className="max-w-4xl mx-auto text-center animate-slide-up">
            <Badge
              variant="secondary"
              className="mb-6 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20"
            >
              <Heart className="h-3 w-3 mr-1 fill-current text-primary" />
              About WaHeA
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              The Warm Heart of Malawi
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed text-pretty">
              WaHeA is more than just an e-commerce platform. We're a bridge connecting talented Malawian artisans and
              vendors with customers who appreciate authentic, handcrafted products that tell a story.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: "Our Mission",
                description:
                  "To empower local artisans and vendors by providing a modern platform to showcase and sell their unique products to a global audience.",
                color: "from-primary to-accent",
                bgColor: "bg-primary/10",
              },
              {
                icon: Eye,
                title: "Our Vision",
                description:
                  "To become the leading marketplace for authentic Malawian products, preserving cultural heritage while driving economic growth.",
                color: "from-secondary to-primary",
                bgColor: "bg-secondary/10",
              },
              {
                icon: Zap,
                title: "Our Values",
                description:
                  "Authenticity, quality, community, and sustainability guide everything we do. We believe in fair trade and supporting local communities.",
                color: "from-accent to-secondary",
                bgColor: "bg-accent/10",
              },
            ].map((item, index) => (
              <Card
                key={index}
                className="border-2 hover:border-primary/50 hover-lift bg-card/50 backdrop-blur-sm animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-8">
                  <div className={`inline-flex p-4 rounded-2xl ${item.bgColor} mb-6`}>
                    <item.icon
                      className={`h-8 w-8 bg-gradient-to-br ${item.color} bg-clip-text`}
                      style={{
                        WebkitTextFillColor: "transparent",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                      }}
                    />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16 animate-slide-up">
            <Badge
              variant="secondary"
              className="mb-4 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20"
            >
              <Award className="h-3 w-3 mr-1" />
              Our Impact
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Making a Difference</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Together, we're building a thriving marketplace that benefits everyone
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "500+", label: "Products Listed", icon: Sparkles },
              { value: "50+", label: "Active Vendors", icon: Users },
              { value: "1000+", label: "Happy Customers", icon: Heart },
              { value: "98%", label: "Satisfaction Rate", icon: TrendingUp },
            ].map((stat, index) => (
              <Card
                key={index}
                className="text-center border-2 hover:border-primary/50 hover-lift bg-card/50 backdrop-blur-sm animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-8">
                  <stat.icon className="h-10 w-10 mx-auto mb-4 text-primary" />
                  <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container max-w-7xl mx-auto px-4 md:px-6">
          <Card className="border-2 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 overflow-hidden animate-slide-up">
            <CardContent className="p-12 md:p-16 text-center">
              <Sparkles className="h-16 w-16 mx-auto mb-6 text-primary" />
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Join Our Community</h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Whether you're a customer looking for unique products or a vendor ready to share your craft, we'd love
                to have you join us.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:shadow-xl">
                  <Link href="/shop">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Start Shopping
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-2 hover:bg-primary/5 bg-transparent">
                  <Link href="/register?role=vendor">
                    Become a Vendor
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
