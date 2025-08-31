import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Lock, Globe, Trophy, Camera } from "lucide-react";

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    description?: string;
    is_public: boolean;
    invite_code?: string;
    created_at: string;
  };
  memberCount?: number;
  photoCount?: number;
  isJoined?: boolean;
  isAdmin?: boolean;
  onJoin?: () => void;
  onView?: () => void;
  onManage?: () => void;
}

export const GroupCard = ({
  group,
  memberCount = 0,
  photoCount = 0,
  isJoined = false,
  isAdmin = false,
  onJoin,
  onView,
  onManage,
}: GroupCardProps) => {
  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-elegant transition-all duration-300 hover:scale-[1.02]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {group.name}
              {group.is_public ? (
                <Globe className="w-4 h-4 text-success" />
              ) : (
                <Lock className="w-4 h-4 text-warning" />
              )}
            </CardTitle>
            <CardDescription className="text-sm">
              {group.description || "No description available"}
            </CardDescription>
          </div>
          <Badge variant={group.is_public ? "default" : "secondary"}>
            {group.is_public ? "Public" : "Private"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{memberCount} members</span>
          </div>
          <div className="flex items-center gap-1">
            <Camera className="w-4 h-4" />
            <span>{photoCount} photos</span>
          </div>
        </div>

        {/* Invite Code for Private Groups */}
        {!group.is_public && group.invite_code && isJoined && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium text-muted-foreground mb-1">Invite Code</p>
            <code className="text-sm bg-background px-2 py-1 rounded border">
              {group.invite_code}
            </code>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {isJoined ? (
            <>
              <Button onClick={onView} variant="default" className="flex-1">
                <Trophy className="w-4 h-4 mr-2" />
                Enter Arena
              </Button>
              {isAdmin && (
                <Button onClick={onManage} variant="outline" size="sm">
                  Manage
                </Button>
              )}
            </>
          ) : (
            <Button onClick={onJoin} variant="accent" className="flex-1">
              Join Group
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};