import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  UserPlus,
  UserMinus,
  Loader2,
  Sparkles,
  TrendingUp,
  Crown,
  Star,
  Users,
  Mail,
  Flame,
  Award,
} from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import AdminBadge from "@/components/AdminBadge";

interface DiscoverUser {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_lifetime: boolean;
  is_admin: boolean;
  posts_count: number;
  followers_count: number;
}

const Discover = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [following, setFollowing] = useState<string[]>([]);
  const [featuredUsers, setFeaturedUsers] = useState<DiscoverUser[]>([]);
  const [trendingUsers, setTrendingUsers] = useState<DiscoverUser[]>([]);
  const [newUsers, setNewUsers] = useState<DiscoverUser[]>([]);
  const [searchResults, setSearchResults] = useState<DiscoverUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch all profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, is_verified, is_lifetime, created_at")
        .neq("user_id", user.id);

      if (!profiles) {
        setLoading(false);
        return;
      }

      // Fetch admin roles
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      
      const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);

      // Fetch post counts per user
      const { data: posts } = await supabase
        .from("social_posts")
        .select("user_id");

      const postCounts: Record<string, number> = {};
      posts?.forEach(post => {
        postCounts[post.user_id] = (postCounts[post.user_id] || 0) + 1;
      });

      // Fetch follower counts per user
      const { data: follows } = await supabase
        .from("user_follows")
        .select("following_id");

      const followerCounts: Record<string, number> = {};
      follows?.forEach(follow => {
        followerCounts[follow.following_id] = (followerCounts[follow.following_id] || 0) + 1;
      });

      // Fetch current user's following list
      const { data: userFollows } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", user.id);

      setFollowing(userFollows?.map(f => f.following_id) || []);

      // Enrich profiles with counts and admin status
      const enrichedProfiles: DiscoverUser[] = profiles.map(profile => ({
        user_id: profile.user_id,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        is_verified: profile.is_verified || false,
        is_lifetime: profile.is_lifetime || false,
        is_admin: adminUserIds.has(profile.user_id),
        posts_count: postCounts[profile.user_id] || 0,
        followers_count: followerCounts[profile.user_id] || 0,
      }));

      // Featured: Users with most followers (exclude already following)
      const featured = [...enrichedProfiles]
        .filter(u => !following.includes(u.user_id))
        .sort((a, b) => b.followers_count - a.followers_count)
        .slice(0, 6);
      setFeaturedUsers(featured);

      // Trending: Users with most posts recently
      const trending = [...enrichedProfiles]
        .filter(u => !following.includes(u.user_id))
        .sort((a, b) => b.posts_count - a.posts_count)
        .slice(0, 6);
      setTrendingUsers(trending);

      // New users: Recently joined (by created_at from profiles)
      const newUsersList = [...enrichedProfiles]
        .filter(u => !following.includes(u.user_id))
        .slice(0, 6);
      setNewUsers(newUsersList);

    } catch (error) {
      console.error("Error fetching discover data:", error);
    }

    setLoading(false);
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
      toast({ title: "Unfollowed" });
    } else {
      await supabase.from("user_follows").insert({
        follower_id: user.id,
        following_id: targetUserId,
      });
      setFollowing([...following, targetUserId]);

      // Create notification
      await supabase.from("notifications").insert({
        user_id: targetUserId,
        actor_id: user.id,
        type: "follow",
      });

      toast({ title: "Following! 🎉" });
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, is_verified, is_lifetime")
      .neq("user_id", user?.id)
      .ilike("display_name", `%${query}%`)
      .limit(10);

    if (profiles) {
      // Fetch admin roles for search results
      const userIds = profiles.map(p => p.user_id);
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .in("user_id", userIds);
      
      const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);

      // Fetch counts
      const { data: posts } = await supabase
        .from("social_posts")
        .select("user_id")
        .in("user_id", userIds);

      const postCounts: Record<string, number> = {};
      posts?.forEach(post => {
        postCounts[post.user_id] = (postCounts[post.user_id] || 0) + 1;
      });

      const { data: follows } = await supabase
        .from("user_follows")
        .select("following_id")
        .in("following_id", userIds);

      const followerCounts: Record<string, number> = {};
      follows?.forEach(follow => {
        followerCounts[follow.following_id] = (followerCounts[follow.following_id] || 0) + 1;
      });

      const enriched: DiscoverUser[] = profiles.map(profile => ({
        user_id: profile.user_id,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        is_verified: profile.is_verified || false,
        is_lifetime: profile.is_lifetime || false,
        is_admin: adminUserIds.has(profile.user_id),
        posts_count: postCounts[profile.user_id] || 0,
        followers_count: followerCounts[profile.user_id] || 0,
      }));

      setSearchResults(enriched);
    }

    setIsSearching(false);
  };

  const UserCard = ({ user: discoverUser, showBadge = false, badgeIcon: BadgeIcon, badgeLabel }: { 
    user: DiscoverUser; 
    showBadge?: boolean;
    badgeIcon?: React.ComponentType<{ className?: string }>;
    badgeLabel?: string;
  }) => {
    const isFollowing = following.includes(discoverUser.user_id);
    
    return (
      <Card className="hover:shadow-md transition-all hover:border-primary/30">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-3">
            <Link 
              to={`/profile/${discoverUser.user_id}`} 
              className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80"
            >
              <Avatar className="w-12 h-12 shrink-0">
                <AvatarImage src={discoverUser.avatar_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {discoverUser.display_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-semibold truncate">
                    {discoverUser.display_name || "Schedulr"}
                  </p>
                  {discoverUser.is_admin && <AdminBadge size="sm" />}
                  {discoverUser.is_verified && <VerifiedBadge size="sm" />}
                  {discoverUser.is_lifetime && (
                    <Crown className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  @{discoverUser.display_name?.toLowerCase().replace(/\s/g, '') || "user"}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{discoverUser.posts_count} posts</span>
                  <span>{discoverUser.followers_count} followers</span>
                </div>
              </div>
            </Link>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full h-8 w-8"
                onClick={() => navigate(`/messages?userId=${discoverUser.user_id}`)}
              >
                <Mail className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={isFollowing ? "outline" : "default"}
                className="rounded-full h-8"
                onClick={() => handleFollow(discoverUser.user_id)}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4 mr-1" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-1" />
                    Follow
                  </>
                )}
              </Button>
            </div>
          </div>
          {showBadge && BadgeIcon && badgeLabel && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <BadgeIcon className="w-3.5 h-3.5 text-primary" />
              <span>{badgeLabel}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-20 pb-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            Discover Schedulrs
          </h1>
          <p className="text-muted-foreground mt-1">
            Find and follow amazing creators in the community
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search for Schedulrs..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 h-12 text-lg rounded-full bg-muted/50"
          />
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Results
            </h2>
            {isSearching ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid gap-3">
                {searchResults.map((user) => (
                  <UserCard key={user.user_id} user={user} />
                ))}
              </div>
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="py-8 text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No users found for "{searchQuery}"</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Featured Creators */}
        {!searchQuery && (
          <>
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  Featured Creators
                </h2>
                <span className="text-sm text-muted-foreground">Most followed</span>
              </div>
              {featuredUsers.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {featuredUsers.map((user, index) => (
                    <UserCard 
                      key={user.user_id} 
                      user={user}
                      showBadge={index < 3}
                      badgeIcon={index === 0 ? Crown : index === 1 ? Award : Star}
                      badgeLabel={index === 0 ? "Top Creator" : index === 1 ? "Rising Star" : "Popular"}
                    />
                  ))}
                </div>
              ) : (
                <Card className="bg-muted/30">
                  <CardContent className="py-8 text-center">
                    <Star className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No featured creators yet</p>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Trending */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Trending
                </h2>
                <span className="text-sm text-muted-foreground">Most active</span>
              </div>
              {trendingUsers.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {trendingUsers.map((user, index) => (
                    <UserCard 
                      key={user.user_id} 
                      user={user}
                      showBadge={index < 3}
                      badgeIcon={Flame}
                      badgeLabel={`${user.posts_count} posts`}
                    />
                  ))}
                </div>
              ) : (
                <Card className="bg-muted/30">
                  <CardContent className="py-8 text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No trending users yet</p>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* New to Schedulr */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  New to Schedulr
                </h2>
                <span className="text-sm text-muted-foreground">Recently joined</span>
              </div>
              {newUsers.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {newUsers.map((user) => (
                    <UserCard 
                      key={user.user_id} 
                      user={user}
                      showBadge
                      badgeIcon={Sparkles}
                      badgeLabel="New member"
                    />
                  ))}
                </div>
              ) : (
                <Card className="bg-muted/30">
                  <CardContent className="py-8 text-center">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No new users to discover</p>
                  </CardContent>
                </Card>
              )}
            </section>
          </>
        )}

        {/* Back to Community */}
        <div className="text-center">
          <Button variant="outline" onClick={() => navigate("/community")}>
            <Users className="w-4 h-4 mr-2" />
            Back to Community
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Discover;
