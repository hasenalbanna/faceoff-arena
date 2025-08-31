import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Zap, Crown, Users } from "lucide-react";

interface Photo {
  id: string;
  title?: string;
  image_url: string;
  votes_count: number;
  wins_count: number;
  user_id: string;
  user?: {
    display_name: string;
  };
  profiles?: {
    display_name: string;
  };
}

interface BattleArenaProps {
  groupId: string;
  userProfileId: string;
}

export const BattleArena = ({ groupId, userProfileId }: BattleArenaProps) => {
  const [photos, setPhotos] = useState<[Photo, Photo] | null>(null);
  const [loading, setLoading] = useState(false);
  const [voting, setVoting] = useState(false);
  const { toast } = useToast();

  const fetchRandomPhotos = async () => {
    setLoading(true);
    try {
      // Get two random photos from the group
      const { data, error } = await supabase
        .from("photos")
        .select(`
          *,
          profiles!photos_user_id_fkey (
            display_name
          )
        `)
        .eq("group_id", groupId)
        .limit(10); // Get more photos to randomize from

      if (error) throw error;

      if (!data || data.length < 2) {
        toast({
          title: "Not enough photos",
          description: "This group needs at least 2 photos to start battles!",
          variant: "destructive",
        });
        return;
      }

      // Randomly select 2 photos
      const shuffled = data.sort(() => 0.5 - Math.random());
      if (shuffled.length >= 2) {
        const selectedPhotos: [Photo, Photo] = [shuffled[0], shuffled[1]];
        
        // Add user info
        selectedPhotos[0].user = selectedPhotos[0].profiles;
        selectedPhotos[1].user = selectedPhotos[1].profiles;
      
        setPhotos(selectedPhotos);
      }
    } catch (error: any) {
      toast({
        title: "Failed to load photos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (winnerId: string, loserId: string) => {
    if (!photos) return;
    
    setVoting(true);
    try {
      // Record the vote
      const { error } = await supabase
        .from("votes")
        .insert([
          {
            group_id: groupId,
            voter_id: userProfileId,
            winner_photo_id: winnerId,
            loser_photo_id: loserId,
          },
        ]);

      if (error) throw error;

      toast({
        title: "Vote recorded!",
        description: "Your battle choice has been saved",
      });

      // Fetch new photos after a short delay for effect
      setTimeout(() => {
        fetchRandomPhotos();
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Failed to record vote",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setVoting(false);
    }
  };

  useEffect(() => {
    fetchRandomPhotos();
  }, [groupId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading battle arena...</p>
        </div>
      </div>
    );
  }

  if (!photos) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Trophy className="w-16 h-16 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">No battles available</h3>
            <p className="text-muted-foreground">Upload some photos to start the competition!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Battle Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Zap className="w-6 h-6 text-accent animate-pulse" />
          <h2 className="text-2xl font-bold bg-gradient-battle bg-clip-text text-transparent">
            Photo Battle
          </h2>
          <Zap className="w-6 h-6 text-accent animate-pulse" />
        </div>
        <p className="text-muted-foreground">Choose your champion!</p>
      </div>

      {/* Battle Arena */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {photos.map((photo, index) => (
          <Card
            key={photo.id}
            className="group bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-elegant transition-all duration-300 overflow-hidden"
          >
            <CardContent className="p-0">
              {/* Photo */}
              <div className="aspect-square relative overflow-hidden bg-muted">
                <img
                  src={photo.image_url}
                  alt={photo.title || "Battle photo"}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                
                {/* Stats Overlay */}
                <div className="absolute top-4 left-4 space-y-2">
                  <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                    <Trophy className="w-3 h-3 mr-1" />
                    {photo.wins_count} wins
                  </Badge>
                  <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                    <Users className="w-3 h-3 mr-1" />
                    {photo.votes_count} votes
                  </Badge>
                </div>
              </div>

              {/* Photo Info */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold truncate">
                    {photo.title || "Untitled"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    by {photo.user?.display_name || "Anonymous"}
                  </p>
                </div>

                {/* Vote Button */}
                <Button
                  onClick={() => handleVote(photo.id, photos[1 - index].id)}
                  disabled={voting}
                  variant="battle"
                  size="lg"
                  className="w-full"
                >
                  {voting ? (
                    "Recording Vote..."
                  ) : (
                    <>
                      <Crown className="w-4 h-4 mr-2" />
                      Choose This Champion
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Next Battle Button */}
      <div className="text-center">
        <Button
          onClick={fetchRandomPhotos}
          disabled={loading}
          variant="outline"
        >
          {loading ? "Loading..." : "Next Battle"}
        </Button>
      </div>
    </div>
  );
};