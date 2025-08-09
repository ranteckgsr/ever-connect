import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, Shield, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">Welcome to EverConnect</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
          Building meaningful connections that last forever. Join our community and discover the power of genuine relationships.
        </p>
        
        {!user && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link to="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <Card className="text-center">
          <CardHeader>
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
              <Heart className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle>Connect with Purpose</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Find people who share your values and build relationships that matter.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle>Growing Community</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Join thousands of members creating lasting connections every day.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle>Safe & Secure</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Your privacy and security are our top priorities. Connect with confidence.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 bg-accent/10">
        <CardHeader>
          <CardTitle className="text-2xl">Start Your Journey Today</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            EverConnect is more than just a platform – it's a movement towards meaningful human connections. 
            In a world that's increasingly digital, we believe in the power of genuine relationships that 
            transcend the superficial.
          </p>
          <p className="text-muted-foreground">
            Whether you're looking for friendship, professional networking, or simply a community that 
            understands you, EverConnect provides the tools and environment to make it happen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}