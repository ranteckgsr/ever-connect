import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Target, Users, Sparkles } from "lucide-react";

export default function WhoWeAre() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-primary mb-4">Who We Are</h2>
        <p className="text-xl text-muted-foreground">
          Building bridges between hearts, one connection at a time
        </p>
      </div>

      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Heart className="h-6 w-6 text-primary mr-2" />
            Our Story
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            EverConnect was born from a simple belief: in an increasingly digital world, 
            genuine human connections are more valuable than ever. We noticed how technology, 
            while bringing us closer in some ways, has also created barriers to meaningful 
            relationships.
          </p>
          <p>
            Founded in 2024, our mission is to use technology as a bridge, not a barrier. 
            We're creating a space where authenticity is valued, where depth matters more 
            than breadth, and where every connection has the potential to enrich lives.
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 text-primary mr-2" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              To create a global community where meaningful connections flourish, 
              breaking down barriers of distance, culture, and circumstance to 
              bring people together in authentic, lasting relationships.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="h-5 w-5 text-primary mr-2" />
              Our Vision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              A world where everyone has access to a supportive community, 
              where loneliness is replaced with belonging, and where technology 
              enhances rather than replaces human connection.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-accent/10">
        <CardHeader>
          <CardTitle className="text-2xl">Our Values</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Authenticity</Badge>
                <span className="text-sm text-muted-foreground">Be real, be you</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Respect</Badge>
                <span className="text-sm text-muted-foreground">Honor every person's journey</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Privacy</Badge>
                <span className="text-sm text-muted-foreground">Your data, your control</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Inclusivity</Badge>
                <span className="text-sm text-muted-foreground">Everyone belongs here</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Growth</Badge>
                <span className="text-sm text-muted-foreground">Evolve together</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Joy</Badge>
                <span className="text-sm text-muted-foreground">Celebrate connections</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 text-primary mr-2" />
            The Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            We're a diverse team of dreamers, builders, and believers in the power of 
            human connection. From engineers to psychologists, designers to community 
            builders, we're united by our passion for creating meaningful impact.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge>10+ Team Members</Badge>
            <Badge>5 Countries</Badge>
            <Badge>24/7 Dedication</Badge>
            <Badge>∞ Passion</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>Join Our Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            EverConnect isn't just a platform – it's a movement. Every member, every 
            connection, every story shared makes us stronger. Together, we're proving 
            that in a world of billions, no one needs to feel alone.
          </p>
          <p className="mt-4 font-semibold text-primary">
            Forever Together isn't just our tagline. It's our promise.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}