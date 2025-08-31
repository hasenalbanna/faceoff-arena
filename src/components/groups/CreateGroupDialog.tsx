import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Globe, Lock } from "lucide-react";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated?: () => void;
}

export const CreateGroupDialog = ({
  open,
  onOpenChange,
  onGroupCreated,
}: CreateGroupDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      // Get current user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) {
        throw new Error("User profile not found");
      }

      // Create the group
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .insert([
          {
            name: name.trim(),
            description: description.trim() || null,
            is_public: isPublic,
            created_by: profile.id,
          },
        ])
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from("group_members")
        .insert([
          {
            group_id: group.id,
            user_id: profile.id,
            is_admin: true,
          },
        ]);

      if (memberError) throw memberError;

      toast({
        title: "Group created successfully!",
        description: `${name} is ready for photo battles`,
      });

      // Reset form
      setName("");
      setDescription("");
      setIsPublic(true);
      onOpenChange(false);
      onGroupCreated?.();
    } catch (error: any) {
      toast({
        title: "Failed to create group",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Create New Group
          </DialogTitle>
          <DialogDescription>
            Set up a new photo competition arena for you and your friends
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Photo Battle"
              required
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell people what this group is about..."
              className="mt-1 resize-none"
              rows={3}
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {isPublic ? (
                  <Globe className="w-4 h-4 text-success" />
                ) : (
                  <Lock className="w-4 h-4 text-warning" />
                )}
                <Label htmlFor="isPublic" className="font-medium">
                  {isPublic ? "Public Group" : "Private Group"}
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {isPublic
                  ? "Anyone can discover and join this group"
                  : "Only people with invite code can request to join"}
              </p>
            </div>
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1"
              variant="hero"
            >
              {loading ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};