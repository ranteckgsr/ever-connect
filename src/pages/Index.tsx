import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Home as HomeIcon, Bot, CreditCard, Users } from "lucide-react";
import Home from "./Home";
import ChatBot from "./ChatBot";
import Pricing from "./Pricing";
import WhoWeAre from "./WhoWeAre";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-120px)]">
      <Tabs defaultValue="welcome" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto mb-8">
          <TabsTrigger value="welcome" className="flex items-center gap-2">
            <HomeIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Welcome</span>
          </TabsTrigger>
          <TabsTrigger value="chatbot" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">ChatBot</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Pricing</span>
          </TabsTrigger>
          <TabsTrigger value="who-we-are" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Who We Are</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="welcome" className="mt-0">
          <Home />
        </TabsContent>

        <TabsContent value="chatbot" className="mt-0">
          <ChatBot />
        </TabsContent>

        <TabsContent value="pricing" className="mt-0">
          <Pricing />
        </TabsContent>

        <TabsContent value="who-we-are" className="mt-0">
          <WhoWeAre />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;