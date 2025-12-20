import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Users, Eye, Globe, TrendingUp, Smartphone, Monitor, Tablet } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

interface VisitorData {
  id: string;
  session_id: string;
  page_path: string;
  referrer: string | null;
  user_agent: string | null;
  created_at: string;
}

interface DailyStats {
  date: string;
  visits: number;
  uniqueVisitors: number;
}

interface PageStats {
  page: string;
  visits: number;
}

interface DeviceStats {
  name: string;
  value: number;
  icon: typeof Monitor;
}

interface BrowserStats {
  name: string;
  value: number;
}

const DEVICE_COLORS = ['hsl(var(--primary))', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)'];
const BROWSER_COLORS = ['hsl(var(--primary))', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)', 'hsl(200, 80%, 50%)'];

const parseUserAgent = (ua: string | null): { device: string; browser: string } => {
  if (!ua) return { device: 'Unknown', browser: 'Unknown' };
  
  // Device detection
  let device = 'Desktop';
  if (/Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    device = 'Mobile';
  } else if (/iPad|Tablet|PlayBook/i.test(ua)) {
    device = 'Tablet';
  }
  
  // Browser detection
  let browser = 'Other';
  if (/Chrome/i.test(ua) && !/Edge|Edg/i.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    browser = 'Safari';
  } else if (/Firefox/i.test(ua)) {
    browser = 'Firefox';
  } else if (/Edge|Edg/i.test(ua)) {
    browser = 'Edge';
  } else if (/Opera|OPR/i.test(ua)) {
    browser = 'Opera';
  }
  
  return { device, browser };
};

export const VisitorAnalyticsWidget = () => {
  const [visitorData, setVisitorData] = useState<VisitorData[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [pageStats, setPageStats] = useState<PageStats[]>([]);
  const [deviceStats, setDeviceStats] = useState<DeviceStats[]>([]);
  const [browserStats, setBrowserStats] = useState<BrowserStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisitorData();
  }, []);

  const fetchVisitorData = async () => {
    try {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      
      const { data, error } = await supabase
        .from('visitor_analytics')
        .select('*')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVisitorData(data || []);
      processStats(data || []);
    } catch (error) {
      console.error('Error fetching visitor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processStats = (data: VisitorData[]) => {
    // Daily stats for the last 7 days
    const dailyMap = new Map<string, { visits: number; sessions: Set<string> }>();
    
    for (let i = 6; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dailyMap.set(date, { visits: 0, sessions: new Set() });
    }

    // Device and browser maps
    const deviceMap = new Map<string, number>();
    const browserMap = new Map<string, number>();

    data.forEach((visit) => {
      const date = format(new Date(visit.created_at), 'yyyy-MM-dd');
      if (dailyMap.has(date)) {
        const stats = dailyMap.get(date)!;
        stats.visits++;
        stats.sessions.add(visit.session_id);
      }

      // Parse user agent for device and browser
      const { device, browser } = parseUserAgent(visit.user_agent);
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
      browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
    });

    const daily: DailyStats[] = [];
    dailyMap.forEach((stats, date) => {
      daily.push({
        date: format(new Date(date), 'MMM dd'),
        visits: stats.visits,
        uniqueVisitors: stats.sessions.size,
      });
    });
    setDailyStats(daily);

    // Page stats
    const pageMap = new Map<string, number>();
    data.forEach((visit) => {
      const count = pageMap.get(visit.page_path) || 0;
      pageMap.set(visit.page_path, count + 1);
    });

    const pages: PageStats[] = [];
    pageMap.forEach((visits, page) => {
      pages.push({ page, visits });
    });
    pages.sort((a, b) => b.visits - a.visits);
    setPageStats(pages.slice(0, 5));

    // Device stats
    const deviceIconMap: Record<string, typeof Monitor> = {
      Desktop: Monitor,
      Mobile: Smartphone,
      Tablet: Tablet,
    };
    const devices: DeviceStats[] = [];
    deviceMap.forEach((value, name) => {
      devices.push({ name, value, icon: deviceIconMap[name] || Monitor });
    });
    devices.sort((a, b) => b.value - a.value);
    setDeviceStats(devices);

    // Browser stats
    const browsers: BrowserStats[] = [];
    browserMap.forEach((value, name) => {
      browsers.push({ name, value });
    });
    browsers.sort((a, b) => b.value - a.value);
    setBrowserStats(browsers.slice(0, 5));
  };

  const totalVisits = visitorData.length;
  const uniqueVisitors = new Set(visitorData.map((v) => v.session_id)).size;
  const todayVisits = visitorData.filter(
    (v) => new Date(v.created_at) >= startOfDay(new Date())
  ).length;
  const avgVisitsPerDay = Math.round(totalVisits / 7) || 0;

  if (loading) {
    return (
      <Card className="col-span-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Visitor Analytics</h2>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Visits (7d)</p>
                <p className="text-2xl font-bold text-foreground">{totalVisits}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unique Visitors</p>
                <p className="text-2xl font-bold text-foreground">{uniqueVisitors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Globe className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Visits</p>
                <p className="text-2xl font-bold text-foreground">{todayVisits}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg/Day</p>
                <p className="text-2xl font-bold text-foreground">{avgVisitsPerDay}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time and Page Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Visits Over Time (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="visits" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.3}
                    name="Total Visits"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="uniqueVisitors" 
                    stroke="hsl(142, 76%, 36%)" 
                    fill="hsl(142, 76%, 36%)" 
                    fillOpacity={0.3}
                    name="Unique Visitors"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pageStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis 
                    dataKey="page" 
                    type="category" 
                    className="text-xs" 
                    width={100}
                    tickFormatter={(value) => value.length > 15 ? value.slice(0, 15) + '...' : value}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="visits" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]}
                    name="Visits"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device and Browser Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Device Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {deviceStats.map((_, index) => (
                        <Cell key={`device-cell-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-3">
                {deviceStats.map((device, index) => {
                  const Icon = device.icon;
                  const percentage = totalVisits > 0 ? Math.round((device.value / totalVisits) * 100) : 0;
                  return (
                    <div key={device.name} className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: DEVICE_COLORS[index % DEVICE_COLORS.length] }}
                      />
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm flex-1">{device.name}</span>
                      <span className="text-sm font-medium">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Browser Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={browserStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {browserStats.map((_, index) => (
                        <Cell key={`browser-cell-${index}`} fill={BROWSER_COLORS[index % BROWSER_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-3">
                {browserStats.map((browser, index) => {
                  const percentage = totalVisits > 0 ? Math.round((browser.value / totalVisits) * 100) : 0;
                  return (
                    <div key={browser.name} className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: BROWSER_COLORS[index % BROWSER_COLORS.length] }}
                      />
                      <span className="text-sm flex-1">{browser.name}</span>
                      <span className="text-sm font-medium">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
