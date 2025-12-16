import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  Search,
  TrendingUp,
  Hash,
  Users,
  Repeat2,
  Bookmark,
  Share,
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
  reposts_count: number;
  is_liked: boolean;
  is_reposted: boolean;
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

interface SuggestedUser {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
}

interface Repost {
  id: string;
  user_id: string;
  original_post_id: string;
  quote_text: string | null;
  is_quote: boolean;
  created_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
    is_admin: boolean;
  };
  original_post?: Post;
}

const Community = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [activeTab, setActiveTab] = useState("for-you");
  const [searchQuery, setSearchQuery] = useState("");
  const [quotePostId, setQuotePostId] = useState<string | null>(null);
  const [quoteText, setQuoteText] = useState("");
  const [isReposting, setIsReposting] = useState(false);
  const [reposts, setReposts] = useState<Repost[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);

  // Extract hashtags from all posts for trending
  const trendingHashtags = useMemo(() => {
    const hashtagCounts: Record<string, number> = {};
    posts.forEach(post => {
      const hashtags = post.content.match(/#\w+/g) || [];
      hashtags.forEach(tag => {
        const normalized = tag.toLowerCase();
        hashtagCounts[normalized] = (hashtagCounts[normalized] || 0) + 1;
      });
    });
    return Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  }, [posts]);

  // Create combined feed with posts and quote reposts
  type FeedItem = { type: 'post'; data: Post } | { type: 'quote'; data: Repost };
  
  const combinedFeed = useMemo(() => {
    const feedItems: FeedItem[] = [
      ...posts.map(p => ({ type: 'post' as const, data: p })),
      ...reposts.filter(r => r.original_post).map(r => ({ type: 'quote' as const, data: r })),
    ];
    
    // Sort by created_at descending
    return feedItems.sort((a, b) => 
      new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
    );
  }, [posts, reposts]);

  // Filter posts based on active tab and search
  const filteredFeed = useMemo(() => {
    let filtered = combinedFeed;
    
    // Filter by tab
    if (activeTab === "following") {
      filtered = filtered.filter(item => 
        following.includes(item.data.user_id) || item.data.user_id === user?.id
      );
    } else if (activeTab === "trending") {
      // Sort by engagement (likes + comments) - only applies to posts
      filtered = [...filtered].sort((a, b) => {
        if (a.type === 'post' && b.type === 'post') {
          return (b.data.likes_count + b.data.comments_count) - (a.data.likes_count + a.data.comments_count);
        }
        return 0;
      });
    }
    
    // Filter by search query or hashtag
    const hashtagParam = searchParams.get("hashtag");
    if (hashtagParam) {
      filtered = filtered.filter(item => {
        if (item.type === 'post') {
          return item.data.content.toLowerCase().includes(`#${hashtagParam.toLowerCase()}`);
        }
        return item.data.quote_text?.toLowerCase().includes(`#${hashtagParam.toLowerCase()}`) || 
               item.data.original_post?.content.toLowerCase().includes(`#${hashtagParam.toLowerCase()}`);
      });
    } else if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        if (item.type === 'post') {
          return item.data.content.toLowerCase().includes(query) ||
                 item.data.profiles?.display_name?.toLowerCase().includes(query);
        }
        return item.data.quote_text?.toLowerCase().includes(query) ||
               item.data.profiles?.display_name?.toLowerCase().includes(query) ||
               item.data.original_post?.content.toLowerCase().includes(query);
      });
    }
    
    return filtered;
  }, [combinedFeed, activeTab, following, user?.id, searchQuery, searchParams]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    checkLifetimeAccess();
  }, [user, navigate]);

  // Realtime subscriptions for posts, reposts, and likes
  useEffect(() => {
    if (!user || !isLifetime) return;

    const channel = supabase
      .channel('community-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'social_posts' },
        (payload) => {
          console.log('Post change:', payload);
          if (payload.eventType === 'INSERT') {
            // Refetch to get enriched data with profiles
            fetchPosts();
          } else if (payload.eventType === 'DELETE') {
            setPosts(prev => prev.filter(p => p.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            fetchPosts();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_likes' },
        (payload) => {
          console.log('Like change:', payload);
          // Update likes count in real-time
          if (payload.eventType === 'INSERT') {
            const postId = payload.new.post_id;
            setPosts(prev => prev.map(p => {
              if (p.id === postId) {
                return {
                  ...p,
                  likes_count: p.likes_count + 1,
                  is_liked: payload.new.user_id === user.id ? true : p.is_liked,
                };
              }
              return p;
            }));
          } else if (payload.eventType === 'DELETE') {
            const postId = payload.old.post_id;
            setPosts(prev => prev.map(p => {
              if (p.id === postId) {
                return {
                  ...p,
                  likes_count: Math.max(0, p.likes_count - 1),
                  is_liked: payload.old.user_id === user.id ? false : p.is_liked,
                };
              }
              return p;
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_reposts' },
        (payload) => {
          console.log('Repost change:', payload);
          if (payload.eventType === 'INSERT') {
            // Update repost count
            const postId = payload.new.original_post_id;
            setPosts(prev => prev.map(p => {
              if (p.id === postId) {
                return {
                  ...p,
                  reposts_count: p.reposts_count + 1,
                  is_reposted: payload.new.user_id === user.id && !payload.new.is_quote ? true : p.is_reposted,
                };
              }
              return p;
            }));
            // Refetch to get new quote posts
            if (payload.new.is_quote) {
              fetchPosts();
            }
          } else if (payload.eventType === 'DELETE') {
            const postId = payload.old.original_post_id;
            setPosts(prev => prev.map(p => {
              if (p.id === postId) {
                return {
                  ...p,
                  reposts_count: Math.max(0, p.reposts_count - 1),
                  is_reposted: payload.old.user_id === user.id && !payload.old.is_quote ? false : p.is_reposted,
                };
              }
              return p;
            }));
            // Remove quote from reposts
            if (payload.old.is_quote) {
              setReposts(prev => prev.filter(r => r.id !== payload.old.id));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isLifetime]);

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
        fetchSuggestedUsers();
      }
    }
    setLoading(false);
  };

  const fetchSuggestedUsers = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, is_verified")
      .neq("user_id", user.id)
      .limit(5);
    
    if (data) {
      setSuggestedUsers(data);
    }
  };

  const fetchPosts = async () => {
    if (!user) return;

    const { data: postsData, error } = await supabase
      .from("social_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching posts:", error);
      return;
    }

    if (!postsData) return;

    const userIds = [...new Set(postsData.map(p => p.user_id))];
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

    const { data: likesData } = await supabase
      .from("post_likes")
      .select("post_id");

    const { data: userLikes } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id);

    const { data: commentsData } = await supabase
      .from("post_comments")
      .select("post_id");

    const { data: repostsData } = await supabase
      .from("post_reposts")
      .select("original_post_id");

    const { data: userReposts } = await supabase
      .from("post_reposts")
      .select("original_post_id")
      .eq("user_id", user.id)
      .eq("is_quote", false);

    const enrichedPosts = postsData.map(post => {
      const profile = profiles?.find(p => p.user_id === post.user_id);
      const likesCount = likesData?.filter(l => l.post_id === post.id).length || 0;
      const commentsCount = commentsData?.filter(c => c.post_id === post.id).length || 0;
      const repostsCount = repostsData?.filter(r => r.original_post_id === post.id).length || 0;
      const isLiked = userLikes?.some(l => l.post_id === post.id) || false;
      const isReposted = userReposts?.some(r => r.original_post_id === post.id) || false;

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
        reposts_count: repostsCount,
        is_liked: isLiked,
        is_reposted: isReposted,
      };
    });

    setPosts(enrichedPosts);

    // Fetch quote posts to display in feed
    const { data: quotePosts } = await supabase
      .from("post_reposts")
      .select("*")
      .eq("is_quote", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (quotePosts && quotePosts.length > 0) {
      const quoteUserIds = [...new Set(quotePosts.map(q => q.user_id))];
      const { data: quoteProfiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, is_verified")
        .in("user_id", quoteUserIds);

      const { data: quoteAdminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .in("user_id", quoteUserIds);

      const quoteAdminUserIds = new Set(quoteAdminRoles?.map(r => r.user_id) || []);

      const enrichedQuotes: Repost[] = quotePosts.map(quote => {
        const profile = quoteProfiles?.find(p => p.user_id === quote.user_id);
        const originalPost = enrichedPosts.find(p => p.id === quote.original_post_id);
        return {
          ...quote,
          profiles: profile ? {
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            is_verified: profile.is_verified || false,
            is_admin: quoteAdminUserIds.has(quote.user_id),
          } : undefined,
          original_post: originalPost,
        };
      });

      setReposts(enrichedQuotes);
    }
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

    const post = posts.find(p => p.id === postId);

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

      // Create notification for post owner (not for self-likes)
      if (post && post.user_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: post.user_id,
          actor_id: user.id,
          type: 'like',
          post_id: postId,
        });
      }
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

    const post = posts.find(p => p.id === postId);

    const { error } = await supabase.from("post_comments").insert({
      post_id: postId,
      user_id: user.id,
      content: newComments[postId].trim(),
    });

    if (!error) {
      // Create notification for post owner (not for self-comments)
      if (post && post.user_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: post.user_id,
          actor_id: user.id,
          type: 'comment',
          post_id: postId,
        });
      }

      setNewComments({ ...newComments, [postId]: "" });
      
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

      // Create notification for followed user
      await supabase.from("notifications").insert({
        user_id: targetUserId,
        actor_id: user.id,
        type: 'follow',
      });
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

  const handleRepost = async (postId: string, isReposted: boolean) => {
    if (!user) return;

    if (isReposted) {
      // Undo repost
      await supabase
        .from("post_reposts")
        .delete()
        .eq("original_post_id", postId)
        .eq("user_id", user.id)
        .eq("is_quote", false);

      setPosts(posts.map(p => {
        if (p.id === postId) {
          return { ...p, is_reposted: false, reposts_count: p.reposts_count - 1 };
        }
        return p;
      }));
      toast({ title: "Repost removed" });
    } else {
      const post = posts.find(p => p.id === postId);
      // Create repost
      const { error } = await supabase.from("post_reposts").insert({
        user_id: user.id,
        original_post_id: postId,
        is_quote: false,
      });

      if (!error) {
        // Create notification for post owner (not for self-reposts)
        if (post && post.user_id !== user.id) {
          await supabase.from("notifications").insert({
            user_id: post.user_id,
            actor_id: user.id,
            type: 'repost',
            post_id: postId,
          });
        }

        setPosts(posts.map(p => {
          if (p.id === postId) {
            return { ...p, is_reposted: true, reposts_count: p.reposts_count + 1 };
          }
          return p;
        }));
        toast({ title: "Reposted! 🔄" });
      }
    }
  };

  const handleQuotePost = async () => {
    if (!user || !quotePostId) return;

    const post = posts.find(p => p.id === quotePostId);

    setIsReposting(true);
    const { error } = await supabase.from("post_reposts").insert({
      user_id: user.id,
      original_post_id: quotePostId,
      quote_text: quoteText.trim() || null,
      is_quote: true,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to quote post", variant: "destructive" });
    } else {
      // Create notification for post owner (not for self-quotes)
      if (post && post.user_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: post.user_id,
          actor_id: user.id,
          type: 'quote',
          post_id: quotePostId,
        });
      }

      setPosts(posts.map(p => {
        if (p.id === quotePostId) {
          return { ...p, reposts_count: p.reposts_count + 1 };
        }
        return p;
      }));
      fetchPosts();
      toast({ title: "Quote posted! 💬" });
      setQuotePostId(null);
      setQuoteText("");
    }
    setIsReposting(false);
  };

  const handleHashtagClick = (hashtag: string) => {
    const tag = hashtag.replace('#', '');
    setSearchParams({ hashtag: tag });
    setSearchQuery("");
  };

  const clearHashtagFilter = () => {
    setSearchParams({});
  };

  const getPostIcon = (postType: string) => {
    switch (postType) {
      case "achievement": return <Trophy className="w-4 h-4 text-yellow-500" />;
      case "milestone": return <Star className="w-4 h-4 text-primary" />;
      case "levelup": return <Zap className="w-4 h-4 text-accent" />;
      case "streak": return <Flame className="w-4 h-4 text-orange-500" />;
      default: return null;
    }
  };

  // Render post content with clickable hashtags
  const renderPostContent = (content: string) => {
    const parts = content.split(/(#\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <button
            key={index}
            onClick={() => handleHashtagClick(part)}
            className="text-primary hover:underline font-medium"
          >
            {part}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
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
              The Community feed is an exclusive feature for Lifetime members. Connect with other Schedulrs, share your achievements, and celebrate together! 🎉
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

  const hashtagFilter = searchParams.get("hashtag");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-20 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
          {/* Left Sidebar - Navigation */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 space-y-4">
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={userProfile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {userProfile?.display_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{userProfile?.display_name || "Schedulr"}</p>
                    <p className="text-sm text-muted-foreground">@{userProfile?.display_name?.toLowerCase().replace(/\s/g, '') || "user"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center border-t pt-4">
                  <div>
                    <p className="font-bold">{posts.filter(p => p.user_id === user?.id).length}</p>
                    <p className="text-xs text-muted-foreground">Posts</p>
                  </div>
                  <div>
                    <p className="font-bold">{following.length}</p>
                    <p className="text-xs text-muted-foreground">Following</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-2">
                <nav className="space-y-1">
                  <Link to="/community" className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 text-primary font-medium">
                    <Users className="w-5 h-5" />
                    Community
                  </Link>
                  <Link to="/profile" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={userProfile?.avatar_url || ""} />
                      <AvatarFallback className="text-xs">{userProfile?.display_name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    Profile
                  </Link>
                </nav>
              </Card>
            </div>
          </aside>

          {/* Main Feed */}
          <div className="lg:col-span-6">
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Community
              </h1>
              <p className="text-muted-foreground text-sm">
                Connect with fellow Schedulrs 🎓
              </p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                <TabsTrigger value="for-you" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">For You</span>
                </TabsTrigger>
                <TabsTrigger value="following" className="gap-2">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Following</span>
                </TabsTrigger>
                <TabsTrigger value="trending" className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Trending</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Hashtag Filter Banner */}
            {hashtagFilter && (
              <div className="mb-4 p-3 bg-primary/10 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="w-5 h-5 text-primary" />
                  <span className="font-medium">#{hashtagFilter}</span>
                  <span className="text-sm text-muted-foreground">
                    ({filteredFeed.length} posts)
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={clearHashtagFilter}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Create Post */}
            <Card className="mb-4 border-2 border-primary/20">
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
                      placeholder="What's happening? Use #hashtags to join conversations..."
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      className="min-h-[80px] resize-none border-none shadow-none focus-visible:ring-0 text-lg placeholder:text-muted-foreground/60"
                    />
                    
                    {imagePreview && (
                      <div className="relative mt-3 inline-block">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="max-h-48 rounded-xl object-cover"
                        />
                        <button
                          onClick={clearSelectedImage}
                          className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mt-3 pt-3 border-t">
                      <div className="flex gap-1">
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
                          size="icon"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-primary hover:bg-primary/10"
                        >
                          <Image className="w-5 h-5" />
                        </Button>
                      </div>
                      <Button
                        onClick={handleCreatePost}
                        disabled={(!newPost.trim() && !selectedImage) || posting}
                        className="rounded-full px-6"
                      >
                        {posting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Post"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Posts Feed */}
            <div className="space-y-4">
              {filteredFeed.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {hashtagFilter 
                        ? `No posts with #${hashtagFilter} yet. Be the first!` 
                        : activeTab === "following" 
                          ? "Follow some Schedulrs to see their posts here!"
                          : "No posts yet. Be the first to share! 🚀"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredFeed.map((item) => {
                  if (item.type === 'quote') {
                    const quote = item.data;
                    const originalPost = quote.original_post;
                    if (!originalPost) return null;
                    
                    return (
                      <Card key={`quote-${quote.id}`} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                            <Repeat2 className="w-4 h-4" />
                            <span>{quote.profiles?.display_name || "Someone"} quoted</span>
                          </div>
                          <div className="flex items-start justify-between">
                            <Link to={`/profile/${quote.user_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={quote.profiles?.avatar_url || ""} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {quote.profiles?.display_name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold">
                                    {quote.profiles?.display_name || "Anonymous"}
                                  </span>
                                  {quote.profiles?.is_admin && <AdminBadge size="md" />}
                                  {quote.profiles?.is_verified && <VerifiedBadge size="md" />}
                                  <span className="text-muted-foreground">·</span>
                                  <span className="text-sm text-muted-foreground">
                                    {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  @{quote.profiles?.display_name?.toLowerCase().replace(/\s/g, '') || "user"}
                                </p>
                              </div>
                            </Link>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {quote.quote_text && (
                            <p className="text-foreground mb-3 whitespace-pre-wrap leading-relaxed">
                              {renderPostContent(quote.quote_text)}
                            </p>
                          )}
                          
                          {/* Embedded Original Post */}
                          <div className="border rounded-xl p-3 bg-muted/20 hover:bg-muted/30 transition-colors">
                            <Link to={`/profile/${originalPost.user_id}`} className="flex items-center gap-2 mb-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={originalPost.profiles?.avatar_url || ""} />
                                <AvatarFallback className="text-xs">
                                  {originalPost.profiles?.display_name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">
                                {originalPost.profiles?.display_name || "Anonymous"}
                              </span>
                              {originalPost.profiles?.is_verified && <VerifiedBadge size="sm" />}
                              <span className="text-xs text-muted-foreground">
                                · {formatDistanceToNow(new Date(originalPost.created_at), { addSuffix: true })}
                              </span>
                            </Link>
                            {originalPost.content && (
                              <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                                {renderPostContent(originalPost.content)}
                              </p>
                            )}
                            {originalPost.image_url && (
                              <img 
                                src={originalPost.image_url} 
                                alt="Post image" 
                                className="w-full rounded-lg mt-2 max-h-48 object-cover"
                              />
                            )}
                          </div>
                          
                          {/* Minimal Actions for Quote */}
                          <div className="flex items-center gap-4 pt-3 mt-3 border-t text-muted-foreground">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLike(originalPost.id, originalPost.is_liked)}
                              className={`gap-2 ${originalPost.is_liked ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500"}`}
                            >
                              <Heart className={`w-4 h-4 ${originalPost.is_liked ? "fill-current" : ""}`} />
                              <span>{originalPost.likes_count}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => {
                                navigator.clipboard.writeText(window.location.origin + `/community?post=${originalPost.id}`);
                                toast({ title: "Link copied!" });
                              }}
                            >
                              <Share className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  // Regular post
                  const post = item.data;
                  return (
                    <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold">
                                  {post.profiles?.display_name || "Anonymous"}
                                </span>
                                {post.profiles?.is_admin && <AdminBadge size="md" />}
                                {post.profiles?.is_verified && <VerifiedBadge size="md" />}
                                {getPostIcon(post.post_type)}
                                <span className="text-muted-foreground">·</span>
                                <span className="text-sm text-muted-foreground">
                                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                @{post.profiles?.display_name?.toLowerCase().replace(/\s/g, '') || "user"}
                              </p>
                            </div>
                          </Link>
                          <div className="flex items-center gap-2">
                            {post.user_id !== user?.id ? (
                              <Button
                                variant={following.includes(post.user_id) ? "outline" : "default"}
                                size="sm"
                                onClick={() => handleFollow(post.user_id)}
                                className="rounded-full text-xs h-8"
                              >
                                {following.includes(post.user_id) ? "Following" : "Follow"}
                              </Button>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-popover">
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
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {editingPostId === post.id ? (
                          <div className="space-y-3 mb-4">
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              placeholder="What's on your mind?"
                              className="min-h-[100px] resize-none"
                            />
                            <div className="flex gap-2 justify-end">
                              <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={isSavingEdit}>
                                Cancel
                              </Button>
                              <Button size="sm" onClick={() => handleSaveEdit(post.id)} disabled={!editContent.trim() || isSavingEdit}>
                                {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          post.content && (
                            <p className="text-foreground mb-3 whitespace-pre-wrap leading-relaxed">
                              {renderPostContent(post.content)}
                            </p>
                          )
                        )}
                        
                        {post.image_url && (
                          <img 
                            src={post.image_url} 
                            alt="Post image" 
                            className="w-full rounded-xl mb-3 max-h-96 object-cover"
                          />
                        )}
                        
                        {/* Actions Bar */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleComments(post.id)}
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.comments_count}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLike(post.id, post.is_liked)}
                            className={`gap-2 ${post.is_liked ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500"}`}
                          >
                            <Heart className={`w-4 h-4 ${post.is_liked ? "fill-current" : ""}`} />
                            <span>{post.likes_count}</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`gap-2 ${post.is_reposted ? "text-green-500 hover:text-green-600" : "text-muted-foreground hover:text-green-500"}`}
                              >
                                <Repeat2 className="w-4 h-4" />
                                <span>{post.reposts_count}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="bg-popover">
                              <DropdownMenuItem onClick={() => handleRepost(post.id, post.is_reposted)}>
                                <Repeat2 className="w-4 h-4 mr-2" />
                                {post.is_reposted ? "Undo Repost" : "Repost"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setQuotePostId(post.id)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Quote
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.origin + `/community?post=${post.id}`);
                              toast({ title: "Link copied!" });
                            }}
                          >
                            <Share className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Comments Section */}
                        {expandedComments.includes(post.id) && (
                          <div className="mt-4 pt-4 border-t space-y-3">
                            {comments[post.id]?.map((comment) => (
                              <div key={comment.id} className="flex gap-2">
                                <Link to={`/profile/${comment.user_id}`}>
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={comment.profiles?.avatar_url || ""} />
                                    <AvatarFallback className="text-xs bg-muted">
                                      {comment.profiles?.display_name?.charAt(0) || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                </Link>
                                <div className="flex-1 bg-muted/50 rounded-2xl px-4 py-2">
                                  <Link to={`/profile/${comment.user_id}`} className="inline-flex items-center gap-1.5">
                                    <span className="text-sm font-medium">
                                      {comment.profiles?.display_name || "Anonymous"}
                                    </span>
                                    {comment.profiles?.is_admin && <AdminBadge size="sm" />}
                                    {comment.profiles?.is_verified && <VerifiedBadge size="sm" />}
                                  </Link>
                                  <p className="text-sm">{comment.content}</p>
                                </div>
                              </div>
                            ))}
                            
                            <div className="flex gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={userProfile?.avatar_url || ""} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {userProfile?.display_name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 flex gap-2">
                                <Input
                                  placeholder="Post your reply..."
                                  value={newComments[post.id] || ""}
                                  onChange={(e) => setNewComments({ ...newComments, [post.id]: e.target.value })}
                                  onKeyDown={(e) => e.key === "Enter" && handleComment(post.id)}
                                  className="rounded-full"
                                />
                                <Button
                                  size="icon"
                                  onClick={() => handleComment(post.id)}
                                  disabled={!newComments[post.id]?.trim()}
                                  className="rounded-full"
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Sidebar - Trending & Suggestions */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (hashtagFilter) clearHashtagFilter();
                  }}
                  className="pl-10 rounded-full bg-muted/50"
                />
              </div>

              {/* Trending Hashtags */}
              {trendingHashtags.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <h3 className="font-bold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Trending
                    </h3>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {trendingHashtags.map(({ tag, count }, index) => (
                        <button
                          key={tag}
                          onClick={() => handleHashtagClick(tag)}
                          className="w-full text-left hover:bg-muted/50 p-2 rounded-lg transition-colors"
                        >
                          <p className="text-xs text-muted-foreground">{index + 1} · Trending</p>
                          <p className="font-semibold text-primary">{tag}</p>
                          <p className="text-xs text-muted-foreground">{count} posts</p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Who to Follow */}
              {suggestedUsers.filter(u => !following.includes(u.user_id)).length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <h3 className="font-bold flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-primary" />
                      Who to follow
                    </h3>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {suggestedUsers
                        .filter(u => !following.includes(u.user_id))
                        .slice(0, 3)
                        .map((suggestedUser) => (
                          <div key={suggestedUser.user_id} className="flex items-center justify-between">
                            <Link to={`/profile/${suggestedUser.user_id}`} className="flex items-center gap-2 hover:opacity-80">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={suggestedUser.avatar_url || ""} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {suggestedUser.display_name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm flex items-center gap-1">
                                  {suggestedUser.display_name || "User"}
                                  {suggestedUser.is_verified && <VerifiedBadge size="sm" />}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  @{suggestedUser.display_name?.toLowerCase().replace(/\s/g, '') || "user"}
                                </p>
                              </div>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full h-8"
                              onClick={() => handleFollow(suggestedUser.user_id)}
                            >
                              Follow
                            </Button>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Footer Links */}
              <div className="px-4 text-xs text-muted-foreground space-x-2">
                <Link to="/terms" className="hover:underline">Terms</Link>
                <Link to="/privacy" className="hover:underline">Privacy</Link>
                <span>© 2024 Schedulr</span>
              </div>
            </div>
          </aside>
        </div>
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
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quote Post Dialog */}
      <AlertDialog open={!!quotePostId} onOpenChange={(open) => { if (!open) { setQuotePostId(null); setQuoteText(""); } }}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Repeat2 className="w-5 h-5 text-primary" />
              Quote Post
            </AlertDialogTitle>
            <AlertDialogDescription>
              Add your thoughts to this post
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Add a comment (optional)..."
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            {quotePostId && (
              <div className="border rounded-lg p-3 bg-muted/30">
                {(() => {
                  const originalPost = posts.find(p => p.id === quotePostId);
                  if (!originalPost) return null;
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={originalPost.profiles?.avatar_url || ""} />
                          <AvatarFallback className="text-xs">
                            {originalPost.profiles?.display_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {originalPost.profiles?.display_name || "Anonymous"}
                        </span>
                        {originalPost.profiles?.is_verified && <VerifiedBadge size="sm" />}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {originalPost.content}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReposting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleQuotePost}
              disabled={isReposting}
            >
              {isReposting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Repeat2 className="w-4 h-4 mr-2" />}
              Quote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Community;
