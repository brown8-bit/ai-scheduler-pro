import { useState, useEffect } from "react";
import { Calendar, MessageSquare, Target, CheckCircle2, Clock, Zap } from "lucide-react";

const AnimatedHero = () => {
  const [activeStep, setActiveStep] = useState(0);
  
  const steps = [
    { icon: MessageSquare, label: "Chat with AI", color: "text-blue-500", bg: "bg-blue-500/20" },
    { icon: Calendar, label: "Auto-schedule", color: "text-primary", bg: "bg-primary/20" },
    { icon: Target, label: "Block focus time", color: "text-orange-500", bg: "bg-orange-500/20" },
    { icon: CheckCircle2, label: "Complete tasks", color: "text-emerald-500", bg: "bg-emerald-500/20" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Glowing background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-cyan-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
      
      {/* Main container */}
      <div className="relative bg-card/80 backdrop-blur-xl rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs text-muted-foreground ml-2">Schedulr AI Dashboard</span>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step indicators */}
          <div className="flex justify-center gap-3 mb-6">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-500 ${
                  i === activeStep
                    ? `${step.bg} scale-110 shadow-lg`
                    : "bg-muted/50 opacity-50 scale-100"
                }`}
              >
                <step.icon className={`w-4 h-4 ${i === activeStep ? step.color : "text-muted-foreground"}`} />
                <span className={`text-xs font-medium ${i === activeStep ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Animated content area */}
          <div className="relative h-48 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border overflow-hidden">
            {/* Step 0: Chat */}
            <div className={`absolute inset-0 p-4 transition-all duration-500 ${activeStep === 0 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"}`}>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2 max-w-[70%]">
                    <p className="text-sm">Schedule my week for productivity</p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 max-w-[70%]">
                    <p className="text-sm">I've analyzed your patterns and created an optimized schedule! 🎯</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 1: Calendar */}
            <div className={`absolute inset-0 p-4 transition-all duration-500 ${activeStep === 1 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"}`}>
              <div className="grid grid-cols-5 gap-1">
                {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => (
                  <div key={day} className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">{day}</div>
                    <div className="space-y-1">
                      <div className={`h-6 rounded text-[10px] flex items-center justify-center text-white ${i % 2 === 0 ? "bg-primary" : "bg-purple-500"}`}>
                        Focus
                      </div>
                      <div className="h-4 rounded bg-emerald-500/30 text-[10px] flex items-center justify-center text-emerald-600">
                        Meet
                      </div>
                      <div className="h-5 rounded bg-orange-500/30 text-[10px] flex items-center justify-center text-orange-600">
                        Create
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Focus blocks */}
            <div className={`absolute inset-0 p-4 transition-all duration-500 ${activeStep === 2 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"}`}>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-orange-500/20 rounded-lg border border-orange-500/30">
                  <Target className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Deep Work Block</p>
                    <p className="text-xs text-muted-foreground">9:00 AM - 11:30 AM</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-xs text-orange-500">
                    <Zap className="w-3 h-3" /> Active
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-violet-500/20 rounded-lg border border-violet-500/30">
                  <Target className="w-5 h-5 text-violet-500" />
                  <div>
                    <p className="text-sm font-medium">Content Creation</p>
                    <p className="text-xs text-muted-foreground">2:00 PM - 4:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Tasks complete */}
            <div className={`absolute inset-0 p-4 transition-all duration-500 ${activeStep === 3 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"}`}>
              <div className="space-y-2">
                {[
                  { text: "Complete project proposal", done: true },
                  { text: "Review team updates", done: true },
                  { text: "Prepare presentation", done: true },
                  { text: "Schedule 1:1 meetings", done: false },
                ].map((task, i) => (
                  <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${task.done ? "bg-emerald-500/10" : "bg-muted"}`}>
                    <CheckCircle2 className={`w-4 h-4 ${task.done ? "text-emerald-500" : "text-muted-foreground"}`} />
                    <span className={`text-sm ${task.done ? "line-through text-muted-foreground" : ""}`}>{task.text}</span>
                    {task.done && <span className="ml-auto text-xs text-emerald-500">+10 XP</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Progress bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
              <div 
                className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
                style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">2.5h</div>
              <div className="text-xs text-muted-foreground">Focus time saved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-500">12</div>
              <div className="text-xs text-muted-foreground">Tasks completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">7 🔥</div>
              <div className="text-xs text-muted-foreground">Day streak</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedHero;
