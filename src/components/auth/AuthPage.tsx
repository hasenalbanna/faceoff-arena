import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Users, Camera, Zap } from "lucide-react";

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Welcome back!",
          description: "Successfully signed in to FaceOff Arena",
        });
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              display_name: displayName,
            },
          },
        });
        if (error) throw error;
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account",
        });
      }
    } catch (error: any) {
      toast({
        title: "Authentication failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="text-center md:text-left space-y-6">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent animate-bounce-in">
              FaceOff Arena
            </h1>
            <p className="text-xl text-muted-foreground">
              The ultimate photo voting competition platform
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto md:mx-0">
            <div className="bg-card/50 rounded-xl p-4 border border-border/50 backdrop-blur-sm">
              <Trophy className="w-8 h-8 text-champion mb-2" />
              <p className="text-sm font-medium">Compete & Win</p>
            </div>
            <div className="bg-card/50 rounded-xl p-4 border border-border/50 backdrop-blur-sm">
              <Users className="w-8 h-8 text-primary mb-2" />
              <p className="text-sm font-medium">Join Groups</p>
            </div>
            <div className="bg-card/50 rounded-xl p-4 border border-border/50 backdrop-blur-sm">
              <Camera className="w-8 h-8 text-accent mb-2" />
              <p className="text-sm font-medium">Upload Photos</p>
            </div>
            <div className="bg-card/50 rounded-xl p-4 border border-border/50 backdrop-blur-sm">
              <Zap className="w-8 h-8 text-winner mb-2" />
              <p className="text-sm font-medium">Vote & Battle</p>
            </div>
          </div>
        </div>

        {/* Auth Form */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-elegant">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isLogin ? "Welcome Back" : "Join the Arena"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Sign in to continue your photo battles"
                : "Create an account to start competing"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required={!isLogin}
                    placeholder="Your arena name"
                    className="mt-1"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="mt-1"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                variant="hero"
                size="lg"
                disabled={loading}
              >
                {loading
                  ? "Loading..."
                  : isLogin
                  ? "Enter Arena"
                  : "Join Arena"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline"
              >
                {isLogin
                  ? "New here? Create an account"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};