import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  Heart,
  MessageCircle,
  Send,
  Trophy,
  Flame,
  Star,
  Zap,
  Crown,
  Lock,
  UserPlus,
  UserMinus,
  Loader2,
  Sparkles,
  Image,
  X,
} from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import AdminBadge from "@/components/AdminBadge";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  post_type: string;
  achievement_data: any;
  created_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
    is_admin: boolean;
  };
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

const Community = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLifetime, setIsLifetime] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<string[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [following, setFollowing] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    checkLifetimeAccess();
  }, [user, navigate]);

  const checkLifetimeAccess = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_lifetime, display_name, avatar_url, is_verified")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile) {
      setUserProfile(profile);
      setIsLifetime(profile.is_lifetime || false);
      
      if (profile.is_lifetime) {
        fetchPosts();
        fetchFollowing();
      }
    }
    setLoading(false);
  };

  const fetchPosts = async () => {
    if (!user) return;

    const { data: postsData, error } = await supabase
      .from("social_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching posts:", error);
      return;
    }

    if (!postsData) return;

    // Fetch profiles for each post
    const userIds = [...new Set(postsData.map(p => p.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, is_verified")
      .in("user_id", userIds);

    // Fetch admin roles
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .in("user_id", userIds);

    const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);

    // Fetch likes counts
    const { data: likesData } = await supabase
      .from("post_likes")
      .select("post_id");

    // Fetch user's likes
    const { data: userLikes } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id);

    // Fetch comments counts
    const { data: commentsData } = await supabase
      .from("post_comments")
      .select("post_id");

    const enrichedPosts = postsData.map(post => {
      const profile = profiles?.find(p => p.user_id === post.user_id);
      const likesCount = likesData?.filter(l => l.post_id === post.id).length || 0;
      const commentsCount = commentsData?.filter(c => c.post_id === post.id).length || 0;
      const isLiked = userLikes?.some(l => l.post_id === post.id) || false;

      return {
        ...post,
        profiles: profile ? {
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          is_verified: profile.is_verified || false,
          is_admin: adminUserIds.has(post.user_id),
        } : undefined,
        likes_count: likesCount,
        comments_count: commentsCount,
        is_liked: isLiked,
      };
    });

    setPosts(enrichedPosts);
  };

  const fetchFollowing = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", user.id);

    if (data) {
      setFollowing(data.map(f => f.following_id));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreatePost = async () => {
    if (!user || (!newPost.trim() && !selectedImage)) return;

    setPosting(true);
    let imageUrl: string | null = null;

    // Upload image if selected
    if (selectedImage) {
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('community-photos')
        .upload(fileName, selectedImage);

      if (uploadError) {
        toast({
          title: "Upload failed",
          description: "Failed to upload image",
          variant: "destructive",
        });
        setPosting(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('community-photos')
        .getPublicUrl(fileName);
      
      imageUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("social_posts").insert({
      user_id: user.id,
      content: newPost.trim(),
      post_type: "custom",
      image_url: imageUrl,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    } else {
      setNewPost("");
      clearSelectedImage();
      fetchPosts();
      toast({
        title: "Posted! 🎉",
        description: "Your post is now live",
      });
    }
    setPosting(false);
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

  const handleFollow = async (targetUserId: string) => {
    if (!user) return;

    if (following.includes(targetUserId)) {
      await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);
      setFollowing(following.filter(id => id !== targetUserId));
    } else {
      await supabase.from("user_follows").insert({
        follower_id: user.id,
        following_id: targetUserId,
      });
      setFollowing([...following, targetUserId]);
    }
  };

  const getPostIcon = (postType: string) => {
    switch (postType) {
      case "achievement": return <Trophy className="w-4 h-4 text-yellow-500" />;
      case "milestone": return <Star className="w-4 h-4 text-primary" />;
      case "levelup": return <Zap className="w-4 h-4 text-accent" />;
      case "streak": return <Flame className="w-4 h-4 text-orange-500" />;
      default: return <Sparkles className="w-4 h-4 text-primary" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isLifetime) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-8">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Lifetime Members Only</h1>
            <p className="text-muted-foreground mb-6">
              The Community feed is an exclusive feature for Lifetime members. Connect with other students, share your achievements, and celebrate together! 🎉
            </p>
            <Link to="/pricing?plan=lifetime">
              <Button variant="hero" size="lg" className="gap-2">
                <Crown className="w-5 h-5" />
                Get Lifetime Access
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-20 pb-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Community
          </h1>
          <p className="text-muted-foreground mt-1">
            Share wins and connect with fellow students 🎓
          </p>
        </div>

        {/* Create Post */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={userProfile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {userProfile?.display_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Share an achievement or update..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative mt-3 inline-block">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-h-48 rounded-lg object-cover"
                    />
                    <button
                      onClick={clearSelectedImage}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:opacity-80"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2 text-muted-foreground"
                  >
                    <Image className="w-4 h-4" />
                    Photo
                  </Button>
                  <Button
                    onClick={handleCreatePost}
                    disabled={(!newPost.trim() && !selectedImage) || posting}
                    className="gap-2"
                  >
                    {posting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No posts yet. Be the first to share! 🚀
                </p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <Link to={`/profile/${post.user_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={post.profiles?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {post.profiles?.display_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">
                            {post.profiles?.display_name || "Anonymous"}
                          </span>
                          {post.profiles?.is_admin && (
                            <AdminBadge size="md" />
                          )}
                          {post.profiles?.is_verified && (
                            <VerifiedBadge size="md" />
                          )}
                          {getPostIcon(post.post_type)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </Link>
                    {post.user_id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFollow(post.user_id)}
                        className="text-xs"
                      >
                        {following.includes(post.user_id) ? (
                          <>
                            <UserMinus className="w-4 h-4 mr-1" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-1" />
                            Follow
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {post.content && (
                    <p className="text-foreground mb-4 whitespace-pre-wrap">{post.content}</p>
                  )}
                  
                  {/* Post Image */}
                  {post.image_url && (
                    <img 
                      src={post.image_url} 
                      alt="Post image" 
                      className="w-full rounded-lg mb-4 max-h-96 object-cover"
                    />
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-2 border-t">
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
                          <AvatarImage src={userProfile?.avatar_url || ""} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {userProfile?.display_name?.charAt(0) || "U"}
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
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Community;
