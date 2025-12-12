import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import DashboardCard from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Bell, Clock, Plus, MessageSquare, TrendingUp, CheckCircle } from "lucide-react";

const Dashboard = () => {
  const upcomingEvents = [
    { title: "Meeting with Alex", description: "Discuss Q4 strategy", time: "Tomorrow at 3pm", highlight: true },
    { title: "Dentist Appointment", description: "Regular checkup", time: "Friday at 10am", highlight: false },
    { title: "Team Standup", description: "Daily sync", time: "Monday at 9am", highlight: false },
    { title: "Product Demo", description: "Client presentation", time: "Next Tuesday at 2pm", highlight: true },
  ];

  const stats = [
    { icon: Calendar, label: "Events This Week", value: "12", color: "primary" },
    { icon: CheckCircle, label: "Completed", value: "8", color: "green" },
    { icon: Clock, label: "Hours Saved", value: "6.5", color: "blue" },
    { icon: TrendingUp, label: "Productivity", value: "+23%", color: "purple" },
  ];

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Hey there! 👋</h1>
              <p className="text-muted-foreground mt-1">Here's what's coming up — you've got this!</p>
            </div>
            <div className="flex gap-3">
              <Link to="/chat">
                <Button variant="outline" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Ask AI
                </Button>
              </Link>
              <Button variant="hero" className="gap-2">
                <Plus className="w-4 h-4" />
                New Event
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-card rounded-xl border border-border p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming Events */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl border border-border p-6 shadow-card">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Upcoming Events
                </h2>
                <div className="space-y-4">
                  {upcomingEvents.map((event, index) => (
                    <DashboardCard
                      key={index}
                      title={event.title}
                      description={event.description}
                      time={event.time}
                      icon={Clock}
                      variant={event.highlight ? "highlight" : "default"}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-card rounded-xl border border-border p-6 shadow-card">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Quick Actions
                </h2>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Calendar className="w-4 h-4" />
                    Schedule Meeting
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Bell className="w-4 h-4" />
                    Set Reminder
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Users className="w-4 h-4" />
                    Invite Team Member
                  </Button>
                </div>
              </div>

              {/* AI Assistant Card */}
              <div className="gradient-primary rounded-xl p-6 text-primary-foreground">
                <h3 className="font-semibold text-lg mb-2">I'm here to help! 🤖</h3>
                <p className="text-primary-foreground/80 text-sm mb-4">
                  Just tell me what you need scheduled — I'll take care of the rest!
                </p>
                <Link to="/chat">
                  <Button variant="glass" className="w-full bg-background/20 border-primary-foreground/20 hover:bg-background/30">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Open AI Chat
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
