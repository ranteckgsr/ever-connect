import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap } from "lucide-react";

export default function Pricing() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-primary mb-4">Pricing Plans</h2>
        <p className="text-xl text-muted-foreground">Choose the perfect plan for your journey</p>
        <Badge className="mt-4 bg-primary/10 text-primary border-primary/20">
          Coming Soon
        </Badge>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <Card className="relative border-2 hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-2xl">Basic</CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">Free</span>
              <span className="text-muted-foreground ml-2">forever</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center">
                <Check className="h-5 w-5 text-primary mr-2" />
                <span>Create your profile</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-primary mr-2" />
                <span>Connect with 50 people</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-primary mr-2" />
                <span>Basic AI chatbot access</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-primary mr-2" />
                <span>Join public communities</span>
              </li>
            </ul>
            <Button className="w-full mt-6" variant="outline" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card className="relative border-2 border-primary shadow-lg scale-105">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground">
              <Star className="h-3 w-3 mr-1" />
              Most Popular
            </Badge>
          </div>
          <CardHeader>
            <CardTitle className="text-2xl">Pro</CardTitle>
            <CardDescription>For serious connectors</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$9.99</span>
              <span className="text-muted-foreground ml-2">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center">
                <Check className="h-5 w-5 text-primary mr-2" />
                <span>Everything in Basic</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-primary mr-2" />
                <span>Unlimited connections</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-primary mr-2" />
                <span>Advanced AI features</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-primary mr-2" />
                <span>Create private groups</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-primary mr-2" />
                <span>Priority support</span>
              </li>
            </ul>
            <Button className="w-full mt-6 bg-primary hover:bg-primary/90" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card className="relative border-2 hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-2xl">Enterprise</CardTitle>
            <CardDescription>For organizations</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">Custom</span>
              <span className="text-muted-foreground ml-2">pricing</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center">
                <Check className="h-5 w-5 text-primary mr-2" />
                <span>Everything in Pro</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-primary mr-2" />
                <span>Custom branding</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-primary mr-2" />
                <span>Analytics dashboard</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-primary mr-2" />
                <span>API access</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-primary mr-2" />
                <span>Dedicated support</span>
              </li>
            </ul>
            <Button className="w-full mt-6" variant="outline" disabled>
              Contact Sales
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-12 bg-accent/10">
        <CardHeader className="text-center">
          <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl">Pricing Launching Soon!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We're working hard to bring you flexible pricing options that fit your needs. 
            Sign up now to be notified when our premium features become available and receive 
            an exclusive early-bird discount!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}