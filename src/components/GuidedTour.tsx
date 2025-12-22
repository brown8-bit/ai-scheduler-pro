import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, Sparkles, MessageSquare, Calendar, Target, BarChart3, Users } from "lucide-react";
import { useDemo } from "@/contexts/DemoContext";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  highlight?: string;
  action?: string;
}

const tourSteps: TourStep[] = [
  {
    id: "dashboard",
    title: "Your Dashboard",
    description: "This is your home base! View your upcoming events, tasks, and quick stats at a glance. Everything you need is organized right here.",
    icon: BarChart3,
    route: "/dashboard",
    action: "Check out your daily overview"
  },
  {
    id: "chat",
    title: "AI Scheduling Assistant",
    description: "Meet Scheddy! Just type what you want to schedule like 'Add a meeting tomorrow at 2pm' and the AI handles the rest.",
    icon: MessageSquare,
    route: "/chat",
    action: "Try asking Scheddy to schedule something"
  },
  {
    id: "calendar",
    title: "Visual Calendar",
    description: "See all your events in a beautiful calendar view. Click any day to add events or drag to reschedule.",
    icon: Calendar,
    route: "/calendar",
    action: "Click on a day to add an event"
  },
  {
    id: "focus",
    title: "Focus Blocks",
    description: "Block dedicated time for deep work. Set focus sessions and protect your productive hours from distractions.",
    icon: Target,
    route: "/focus-blocks",
    action: "Create your first focus block"
  },
  {
    id: "community",
    title: "Creator Community",
    description: "Connect with other creators! Share achievements, get inspired, and stay motivated together.",
    icon: Users,
    route: "/community",
    action: "Explore the community feed"
  }
];

export const GuidedTour = () => {
  const { isDemoMode, isTourActive, currentTourStep, setTourActive, setCurrentTourStep } = useDemo();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMinimized, setIsMinimized] = useState(false);

  const currentStep = tourSteps[currentTourStep];
  const isLastStep = currentTourStep === tourSteps.length - 1;
  const isFirstStep = currentTourStep === 0;

  // Navigate to step route when step changes
  useEffect(() => {
    if (isTourActive && currentStep && location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    }
  }, [currentTourStep, isTourActive]);

  if (!isDemoMode || !isTourActive) return null;

  const handleNext = () => {
    if (isLastStep) {
      setTourActive(false);
    } else {
      setCurrentTourStep(currentTourStep + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentTourStep(currentTourStep - 1);
    }
  };

  const handleSkip = () => {
    setTourActive(false);
  };

  const StepIcon = currentStep?.icon || Sparkles;

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-20 right-4 z-[70] p-3 rounded-full gradient-primary shadow-lg hover:scale-110 transition-transform animate-pulse"
      >
        <Sparkles className="w-5 h-5 text-primary-foreground" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[70] animate-slide-up">
      <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="gradient-primary px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <StepIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-primary-foreground/80">Step {currentTourStep + 1} of {tourSteps.length}</p>
              <h3 className="font-semibold text-primary-foreground text-sm">{currentStep?.title}</h3>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-full hover:bg-primary-foreground/20 transition-colors"
              aria-label="Minimize tour"
            >
              <ChevronRight className="w-4 h-4 text-primary-foreground" />
            </button>
            <button
              onClick={handleSkip}
              className="p-1.5 rounded-full hover:bg-primary-foreground/20 transition-colors"
              aria-label="Close tour"
            >
              <X className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-muted-foreground">{currentStep?.description}</p>
          
          {currentStep?.action && (
            <div className="mt-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs font-medium text-primary flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Try it: {currentStep.action}
              </p>
            </div>
          )}

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {tourSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTourStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentTourStep
                    ? "w-6 bg-primary"
                    : index < currentTourStep
                    ? "bg-primary/50"
                    : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="px-4 pb-4 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={isFirstStep}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Skip Tour
          </Button>

          <Button
            size="sm"
            onClick={handleNext}
            className="gap-1"
          >
            {isLastStep ? "Finish" : "Next"}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuidedTour;
