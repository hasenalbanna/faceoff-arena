import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/navigation/Navbar";
import { GroupCard } from "@/components/groups/GroupCard";
import { CreateGroupDialog } from "@/components/groups/CreateGroupDialog";
import { BattleArena } from "@/components/voting/BattleArena";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Trophy, Users, TrendingUp } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface DashboardProps {
  user: SupabaseUser;
}

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  invite_code?: string;
  created_at: string;
  member_count?: number;
  photo_count?: number;
  is_member?: boolean;
  is_admin?: boolean;
}

export const Dashboard = ({ user }: DashboardProps) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error: any) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchGroups = async () => {
    if (!userProfile) return;

    try {
      // Get all public groups and groups user is a member of
      const { data: allGroups, error } = await supabase
        .from("groups")
        .select(`
          *,
          group_members!inner (
            user_id,
            is_admin,
            status
          )
        `)
        .or(`is_public.eq.true,group_members.user_id.eq.${userProfile.id}`)
        .eq("group_members.status", "active");

      if (error) throw error;

      // Process groups to add member/admin status
      const processedGroups = allGroups?.map((group: any) => {
        const userMembership = group.group_members.find(
          (member: any) => member.user_id === userProfile.id
        );
        
        return {
          ...group,
          is_member: !!userMembership,
          is_admin: userMembership?.is_admin || false,
          member_count: group.group_members.length,
        };
      }) || [];

      setGroups(processedGroups);
    } catch (error: any) {
      toast({
        title: "Failed to load groups",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!userProfile) return;

    try {
      const { error } = await supabase
        .from("group_members")
        .insert([
          {
            group_id: groupId,
            user_id: userProfile.id,
          },
        ]);

      if (error) throw error;

      toast({
        title: "Joined group successfully!",
        description: "Welcome to the photo battle arena",
      });

      fetchGroups();
    } catch (error: any) {
      toast({
        title: "Failed to join group",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myGroups = filteredGroups.filter((group) => group.is_member);
  const publicGroups = filteredGroups.filter((group) => group.is_public && !group.is_member);

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    if (userProfile) {
      fetchGroups();
    }
  }, [userProfile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your arena...</p>
        </div>
      </div>
    );
  }

  if (selectedGroupId && userProfile) {
    return (
      <div className="min-h-screen">
        <Navbar 
          user={user} 
          userProfile={userProfile}
          onCreateGroup={() => setShowCreateDialog(true)}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setSelectedGroupId(null)}
              className="mb-4"
            >
              ← Back to Groups
            </Button>
          </div>
          <BattleArena 
            groupId={selectedGroupId} 
            userProfileId={userProfile.id}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar 
        user={user} 
        userProfile={userProfile || undefined}
        onCreateGroup={() => setShowCreateDialog(true)}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Welcome to the Arena
          </h1>
          <p className="text-muted-foreground">
            Join groups, upload photos, and battle for the top spot!
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-8">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Groups Tabs */}
        <Tabs defaultValue="my-groups" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="my-groups" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              My Groups ({myGroups.length})
            </TabsTrigger>
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Discover ({publicGroups.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-groups" className="space-y-6">
            {myGroups.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first group or join an existing one to start battling!
                </p>
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  variant="hero"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Group
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    memberCount={group.member_count}
                    photoCount={group.photo_count}
                    isJoined={group.is_member}
                    isAdmin={group.is_admin}
                    onView={() => setSelectedGroupId(group.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="discover" className="space-y-6">
            {publicGroups.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No public groups found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try a different search term" : "Be the first to create a public group!"}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    memberCount={group.member_count}
                    photoCount={group.photo_count}
                    isJoined={false}
                    onJoin={() => handleJoinGroup(group.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreateGroupDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onGroupCreated={fetchGroups}
      />
    </div>
  );
};