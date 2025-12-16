import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  Heart,
  MessageCircle,
  Loader2,
  UserPlus,
  UserMinus,
  Crown,
  Flame,
  Trophy,
  Star,
  Zap,
  Sparkles,
  Settings,
  Grid3X3,
  Users,
  Send,
  Pencil,
  Trash2,
  MoreHorizontal,
  X,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import VerifiedBadge from "@/components/VerifiedBadge";
import AdminBadge from "@/components/AdminBadge";
import { formatDistanceToNow } from "date-fns";

interface ProfileData {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_lifetime: boolean;
  is_admin: boolean;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  post_type: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
    is_admin: boolean;
  };
}

interface FollowUser {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_admin: boolean;
}

const Profile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [expandedComments, setExpandedComments] = useState<string[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const targetUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (targetUserId) {
      fetchProfileData();
    }
  }, [user, targetUserId, navigate]);

  const fetchProfileData = async () => {
    if (!targetUserId) return;

    setLoading(true);

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, is_verified, is_lifetime")
      .eq("user_id", targetUserId)
      .maybeSingle();

    // Check if user is admin
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("user_id", targetUserId)
      .eq("role", "admin")
      .maybeSingle();

    if (profileData) {
      setProfile({ ...profileData, is_admin: !!adminRole });
    }

    // Fetch user's posts
    const { data: postsData } = await supabase
      .from("social_posts")
      .select("*")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false });

    if (postsData) {
      // Get likes and comments counts
      const postIds = postsData.map(p => p.id);
      
      const { data: likesData } = await supabase
        .from("post_likes")
        .select("post_id")
        .in("post_id", postIds);

      // Fetch user's likes to check if they liked each post
      const { data: userLikes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user?.id || "")
        .in("post_id", postIds);

      const { data: commentsData } = await supabase
        .from("post_comments")
        .select("post_id")
        .in("post_id", postIds);

      const enrichedPosts = postsData.map(post => ({
        ...post,
        likes_count: likesData?.filter(l => l.post_id === post.id).length || 0,
        comments_count: commentsData?.filter(c => c.post_id === post.id).length || 0,
        is_liked: userLikes?.some(l => l.post_id === post.id) || false,
      }));

      setPosts(enrichedPosts);
    }

    // Fetch followers
    const { data: followersData } = await supabase
      .from("user_follows")
      .select("follower_id")
      .eq("following_id", targetUserId);

    if (followersData && followersData.length > 0) {
      const followerIds = followersData.map(f => f.follower_id);
      const { data: followerProfiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, is_verified")
        .in("user_id", followerIds);

      const { data: followerAdmins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .in("user_id", followerIds);

      const adminIds = new Set(followerAdmins?.map(a => a.user_id) || []);
      
      setFollowers((followerProfiles || []).map(p => ({
        ...p,
        is_admin: adminIds.has(p.user_id),
      })));
    } else {
      setFollowers([]);
    }

    // Fetch following
    const { data: followingData } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", targetUserId);

    if (followingData && followingData.length > 0) {
      const followingIds = followingData.map(f => f.following_id);
      const { data: followingProfiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, is_verified")
        .in("user_id", followingIds);

      const { data: followingAdmins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .in("user_id", followingIds);

      const adminIds = new Set(followingAdmins?.map(a => a.user_id) || []);
      
      setFollowing((followingProfiles || []).map(p => ({
        ...p,
        is_admin: adminIds.has(p.user_id),
      })));
    } else {
      setFollowing([]);
    }

    // Check if current user is following this profile
    if (user && !isOwnProfile) {
      const { data: followCheck } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .maybeSingle();

      setIsFollowing(!!followCheck);
    }

    setLoading(false);
  };

  const handleFollow = async () => {
    if (!user || !targetUserId) return;

    if (isFollowing) {
      await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);
      setIsFollowing(false);
      setFollowers(followers.filter(f => f.user_id !== user.id));
      toast({ title: "Unfollowed", description: "You unfollowed this user" });
    } else {
      await supabase.from("user_follows").insert({
        follower_id: user.id,
        following_id: targetUserId,
      });
      setIsFollowing(true);
      // Add current user to followers list
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, is_verified")
        .eq("user_id", user.id)
        .maybeSingle();
      
      const { data: myAdminRole } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
        
      if (myProfile) {
        setFollowers([...followers, { ...myProfile, is_admin: !!myAdminRole }]);
      }
      toast({ title: "Following! 🎉", description: "You're now following this user" });
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;

    if (isLiked) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: user.id,
      });
    }

    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          is_liked: !isLiked,
          likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1,
        };
      }
      return p;
    }));
  };

  const toggleComments = async (postId: string) => {
    if (expandedComments.includes(postId)) {
      setExpandedComments(expandedComments.filter(id => id !== postId));
    } else {
      setExpandedComments([...expandedComments, postId]);
      
      if (!comments[postId]) {
        const { data } = await supabase
          .from("post_comments")
          .select("*")
          .eq("post_id", postId)
          .order("created_at", { ascending: true });

        if (data) {
          const userIds = [...new Set(data.map(c => c.user_id))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url, is_verified")
            .in("user_id", userIds);

          const { data: adminRoles } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "admin")
            .in("user_id", userIds);

          const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);

          const enrichedComments = data.map(comment => ({
            ...comment,
            profiles: profiles?.find(p => p.user_id === comment.user_id) ? {
              ...profiles?.find(p => p.user_id === comment.user_id),
              is_admin: adminUserIds.has(comment.user_id),
            } : undefined,
          }));

          setComments({ ...comments, [postId]: enrichedComments as Comment[] });
        }
      }
    }
  };

  const handleComment = async (postId: string) => {
    if (!user || !newComments[postId]?.trim()) return;

    const { error } = await supabase.from("post_comments").insert({
      post_id: postId,
      user_id: user.id,
      content: newComments[postId].trim(),
    });

    if (!error) {
      setNewComments({ ...newComments, [postId]: "" });
      
      // Refresh comments
      const { data } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (data) {
        const userIds = [...new Set(data.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url, is_verified")
          .in("user_id", userIds);

        const { data: adminRoles } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin")
          .in("user_id", userIds);

        const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);

        const enrichedComments = data.map(comment => ({
          ...comment,
          profiles: profiles?.find(p => p.user_id === comment.user_id) ? {
            ...profiles?.find(p => p.user_id === comment.user_id),
            is_admin: adminUserIds.has(comment.user_id),
          } : undefined,
        }));

        setComments({ ...comments, [postId]: enrichedComments as Comment[] });
      }

      setPosts(posts.map(p => {
        if (p.id === postId) {
          return { ...p, comments_count: p.comments_count + 1 };
        }
        return p;
      }));
    }
  };

  const handleStartEdit = (post: Post) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditContent("");
  };

  const handleSaveEdit = async (postId: string) => {
    if (!editContent.trim()) return;
    
    setIsSavingEdit(true);
    const { error } = await supabase
      .from("social_posts")
      .update({ content: editContent.trim() })
      .eq("id", postId)
      .eq("user_id", user?.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update post", variant: "destructive" });
    } else {
      setPosts(posts.map(p => p.id === postId ? { ...p, content: editContent.trim() } : p));
      toast({ title: "Post updated! ✨" });
      setEditingPostId(null);
      setEditContent("");
    }
    setIsSavingEdit(false);
  };

  const handleDeletePost = async () => {
    if (!deletePostId) return;
    
    setIsDeleting(true);
    
    // Delete related likes and comments first
    await supabase.from("post_likes").delete().eq("post_id", deletePostId);
    await supabase.from("post_comments").delete().eq("post_id", deletePostId);
    
    const { error } = await supabase
      .from("social_posts")
      .delete()
      .eq("id", deletePostId)
      .eq("user_id", user?.id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete post", variant: "destructive" });
    } else {
      setPosts(posts.filter(p => p.id !== deletePostId));
      toast({ title: "Post deleted" });
    }
    
    setIsDeleting(false);
    setDeletePostId(null);
  };

  const getPostIcon = (postType: string) => {
    switch (postType) {
      case "achievement": return <Trophy className="w-3 h-3 text-yellow-500" />;
      case "milestone": return <Star className="w-3 h-3 text-primary" />;
      case "levelup": return <Zap className="w-3 h-3 text-accent" />;
      case "streak": return <Flame className="w-3 h-3 text-orange-500" />;
      default: return <Sparkles className="w-3 h-3 text-primary" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-8 text-center">
          <h1 className="text-2xl font-bold">Profile not found</h1>
          <p className="text-muted-foreground mt-2">This user doesn't exist.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-20 pb-8 max-w-2xl">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background shadow-lg">
                <AvatarImage src={profile.avatar_url || ""} />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                  {profile.display_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>

              {/* Profile Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    {profile.display_name || "Anonymous"}
                    {profile.is_admin && (
                      <AdminBadge size="lg" />
                    )}
                    {profile.is_verified && (
                      <VerifiedBadge size="lg" />
                    )}
                  </h1>
                  {profile.is_lifetime && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      <Crown className="w-3 h-3" />
                      Lifetime
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex justify-center sm:justify-start gap-6 my-4">
                  <button 
                    onClick={() => setActiveTab("posts")}
                    className="text-center hover:opacity-80 transition-opacity"
                  >
                    <p className="text-xl font-bold">{posts.length}</p>
                    <p className="text-sm text-muted-foreground">Posts</p>
                  </button>
                  <button 
                    onClick={() => setActiveTab("followers")}
                    className="text-center hover:opacity-80 transition-opacity"
                  >
                    <p className="text-xl font-bold">{followers.length}</p>
                    <p className="text-sm text-muted-foreground">Followers</p>
                  </button>
                  <button 
                    onClick={() => setActiveTab("following")}
                    className="text-center hover:opacity-80 transition-opacity"
                  >
                    <p className="text-xl font-bold">{following.length}</p>
                    <p className="text-sm text-muted-foreground">Following</p>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center sm:justify-start gap-2">
                  {isOwnProfile ? (
                    <Link to="/settings">
                      <Button variant="outline" className="gap-2">
                        <Settings className="w-4 h-4" />
                        Edit Profile
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      onClick={handleFollow}
                      variant={isFollowing ? "outline" : "default"}
                      className="gap-2"
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="posts" className="gap-2">
              <Grid3X3 className="w-4 h-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="followers" className="gap-2">
              <Users className="w-4 h-4" />
              Followers
            </TabsTrigger>
            <TabsTrigger value="following" className="gap-2">
              <Users className="w-4 h-4" />
              Following
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="mt-4">
            {posts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Grid3X3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {isOwnProfile ? "You haven't posted anything yet." : "No posts yet."}
                  </p>
                  {isOwnProfile && (
                    <Link to="/community">
                      <Button variant="outline" className="mt-4">
                        Create your first post
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getPostIcon(post.post_type)}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        
                        {/* Edit/Delete Menu - only show on own profile */}
                        {isOwnProfile && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleStartEdit(post)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setDeletePostId(post.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      
                      {/* Edit Mode */}
                      {editingPostId === post.id ? (
                        <div className="space-y-3 mb-3">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            placeholder="What's on your mind?"
                            className="min-h-[100px] resize-none"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEdit}
                              disabled={isSavingEdit}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(post.id)}
                              disabled={!editContent.trim() || isSavingEdit}
                            >
                              {isSavingEdit ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4 mr-1" />
                              )}
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        post.content && (
                          <p className="whitespace-pre-wrap mb-3">{post.content}</p>
                        )
                      )}
                      
                      {post.image_url && (
                        <img 
                          src={post.image_url} 
                          alt="Post image" 
                          className="w-full rounded-lg mb-3 max-h-96 object-cover"
                        />
                      )}
                      
                      {/* Interactive Actions */}
                      <div className="flex items-center gap-4 pt-3 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(post.id, post.is_liked)}
                          className={post.is_liked ? "text-red-500" : "text-muted-foreground"}
                        >
                          <Heart className={`w-4 h-4 mr-1 ${post.is_liked ? "fill-red-500" : ""}`} />
                          {post.likes_count}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleComments(post.id)}
                          className="text-muted-foreground"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {post.comments_count}
                        </Button>
                      </div>

                      {/* Comments Section */}
                      {expandedComments.includes(post.id) && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          {comments[post.id]?.map((comment) => (
                            <div key={comment.id} className="flex gap-2">
                              <Link to={`/profile/${comment.user_id}`}>
                                <Avatar className="w-8 h-8 hover:opacity-80 transition-opacity">
                                  <AvatarImage src={comment.profiles?.avatar_url || ""} />
                                  <AvatarFallback className="text-xs bg-muted">
                                    {comment.profiles?.display_name?.charAt(0) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                              </Link>
                              <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2">
                                <Link to={`/profile/${comment.user_id}`} className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                                  <span className="text-sm font-medium">
                                    {comment.profiles?.display_name || "Anonymous"}
                                  </span>
                                  {comment.profiles?.is_admin && (
                                    <AdminBadge size="sm" />
                                  )}
                                  {comment.profiles?.is_verified && (
                                    <VerifiedBadge size="sm" />
                                  )}
                                </Link>
                                <p className="text-sm">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                          
                          {/* Add Comment */}
                          <div className="flex gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={profile?.avatar_url || ""} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {profile?.display_name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                placeholder="Write a comment..."
                                value={newComments[post.id] || ""}
                                onChange={(e) => setNewComments({ ...newComments, [post.id]: e.target.value })}
                                onKeyDown={(e) => e.key === "Enter" && handleComment(post.id)}
                                className="flex-1 bg-muted/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleComment(post.id)}
                                disabled={!newComments[post.id]?.trim()}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Followers Tab */}
          <TabsContent value="followers" className="mt-4">
            {followers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No followers yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {followers.map((follower) => (
                  <Card key={follower.user_id}>
                    <CardContent className="py-3">
                      <Link 
                        to={`/profile/${follower.user_id}`}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={follower.avatar_url || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {follower.display_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium">
                              {follower.display_name || "Anonymous"}
                            </span>
                            {follower.is_admin && (
                              <AdminBadge size="md" />
                            )}
                            {follower.is_verified && (
                              <VerifiedBadge size="md" />
                            )}
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Following Tab */}
          <TabsContent value="following" className="mt-4">
            {following.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {isOwnProfile ? "You're not following anyone yet." : "Not following anyone."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {following.map((followedUser) => (
                  <Card key={followedUser.user_id}>
                    <CardContent className="py-3">
                      <Link 
                        to={`/profile/${followedUser.user_id}`}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={followedUser.avatar_url || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {followedUser.display_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium">
                              {followedUser.display_name || "Anonymous"}
                            </span>
                            {followedUser.is_admin && (
                              <AdminBadge size="md" />
                            )}
                            {followedUser.is_verified && (
                              <VerifiedBadge size="md" />
                            )}
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePostId} onOpenChange={(open) => !open && setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;
