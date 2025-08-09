import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Heart, Smartphone, Sparkles, Users, Clock } from "lucide-react";

export default function ChatBot() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-primary mb-4">AI-Powered Connection</h2>
        <p className="text-xl text-muted-foreground">
          Bringing hearts together through intelligent messaging
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-center mb-12">
        {/* Illustration Section */}
        <div className="relative">
          <div className="bg-accent/10 rounded-3xl p-8 flex items-center justify-center min-h-[400px]">
            <div className="relative">
              {/* Phone Frame */}
              <div className="bg-card border-8 border-foreground/20 rounded-[3rem] p-4 shadow-2xl w-64 mx-auto">
                <div className="bg-background rounded-2xl p-4 space-y-3">
                  {/* Message bubbles */}
                  <div className="flex justify-start">
                    <div className="bg-primary/10 rounded-2xl px-4 py-2 max-w-[80%]">
                      <p className="text-sm">It's your birthday! Happy birthday son 🎂🎉</p>
                      <p className="text-xs text-muted-foreground mt-1">Dad • 2 min ago</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-2 max-w-[80%]">
                      <p className="text-sm">Thank you Dad! Love you so much ❤️</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-start">
                    <div className="bg-primary/10 rounded-2xl px-4 py-2 max-w-[80%]">
                      <p className="text-sm">Wishing you all the happiness in the world! 🌟</p>
                      <p className="text-xs text-muted-foreground mt-1">Mom • Just now</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating hearts */}
              <Heart className="absolute -top-4 -right-4 h-8 w-8 text-red-500 animate-pulse" fill="currentColor" />
              <Heart className="absolute -bottom-4 -left-4 h-6 w-6 text-pink-500 animate-pulse" fill="currentColor" />
              <MessageCircle className="absolute top-1/2 -right-8 h-6 w-6 text-primary" />
            </div>
          </div>
          
          {/* Person silhouette */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
            <div className="text-muted-foreground text-sm mt-4">
              <Smartphone className="h-5 w-5 inline mr-2" />
              Stay connected with those who matter most
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Smart Messaging Assistant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Our AI-powered chatbot helps you maintain meaningful connections with your loved ones
                by suggesting the perfect time to reach out, crafting heartfelt messages, and ensuring
                no important moment goes unshared.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Perfect Timing</p>
                    <p className="text-sm text-muted-foreground">Know the best times to connect</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Message Suggestions</p>
                    <p className="text-sm text-muted-foreground">AI-crafted messages that feel genuine</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Relationship Insights</p>
                    <p className="text-sm text-muted-foreground">Strengthen bonds with data-driven tips</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-accent/10 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Coming Soon</CardTitle>
                <Badge variant="secondary">In Development</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We're building an intelligent companion that understands the nuances of human
                connection. Soon, you'll never miss an opportunity to show someone you care.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Features */}
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Emotional Intelligence</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Understanding context and emotions to suggest the right words at the right time
            </p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Multi-Platform Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Connect across all your devices and messaging platforms seamlessly
            </p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Privacy First</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your conversations remain private. AI suggestions, human connections
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}