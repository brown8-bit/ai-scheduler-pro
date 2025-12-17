import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Feather, 
  UserPlus, 
  Heart, 
  MessageCircle,
  TrendingUp,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  targetSelector: string;
  position: "top" | "bottom" | "left" | "right";
}

const tourSteps: TourStep[] = [
  {
    title: "Share Your Thoughts",
    description: "Start by creating a post! Share updates, goals, or ask for feedback on your scheduled content.",
    icon: <Feather className="h-5 w-5" />,
    targetSelector: "[data-tour='post-input']",
    position: "bottom",
  },
  {
    title: "Follow Fellow Schedulrs",
    description: "Follow other users to see their posts in your feed and build your network!",
    icon: <UserPlus className="h-5 w-5" />,
    targetSelector: "[data-tour='follow-button']",
    position: "left",
  },
  {
    title: "Like & Comment",
    description: "Show support by liking posts and leave comments to start conversations.",
    icon: <Heart className="h-5 w-5" />,
    targetSelector: "[data-tour='like-button']",
    position: "top",
  },
  {
    title: "Join the Conversation",
    description: "Reply to posts and engage with the community. Your feedback helps others grow!",
    icon: <MessageCircle className="h-5 w-5" />,
    targetSelector: "[data-tour='comment-button']",
    position: "top",
  },
  {
    title: "Discover What's Trending",
    description: "Check out trending topics and hashtags to discover popular discussions!",
    icon: <TrendingUp className="h-5 w-5" />,
    targetSelector: "[data-tour='trending-section']",
    position: "left",
  },
];

interface CommunityTourProps {
  onComplete: () => void;
  isOpen: boolean;
}

export const CommunityTour = ({ onComplete, isOpen }: CommunityTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updateTargetPosition = () => {
      const step = tourSteps[currentStep];
      const target = document.querySelector(step.targetSelector);
      
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
        
        // Scroll target into view
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        setTargetRect(null);
      }
    };

    // Initial update
    updateTargetPosition();

    // Update on scroll/resize
    window.addEventListener("scroll", updateTargetPosition);
    window.addEventListener("resize", updateTargetPosition);

    return () => {
      window.removeEventListener("scroll", updateTargetPosition);
      window.removeEventListener("resize", updateTargetPosition);
    };
  }, [currentStep, isOpen]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("community_tour_completed", "true");
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  // Calculate tooltip position
  const getTooltipStyle = () => {
    if (!targetRect) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const padding = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    switch (step.position) {
      case "bottom":
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
        };
      case "top":
        return {
          top: `${Math.max(padding, targetRect.top - tooltipHeight - padding)}px`,
          left: `${Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
        };
      case "left":
        return {
          top: `${targetRect.top + targetRect.height / 2 - tooltipHeight / 2}px`,
          left: `${Math.max(padding, targetRect.left - tooltipWidth - padding)}px`,
        };
      case "right":
        return {
          top: `${targetRect.top + targetRect.height / 2 - tooltipHeight / 2}px`,
          left: `${targetRect.right + padding}px`,
        };
      default:
        return {};
    }
  };

  return (
    <>
      {/* Overlay backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
        onClick={handleSkip}
      />

      {/* Highlight the target element */}
      {targetRect && (
        <div
          className="fixed z-[101] pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
            borderRadius: "12px",
          }}
        >
          <div className="absolute inset-0 rounded-xl border-2 border-primary animate-pulse" />
        </div>
      )}

      {/* Tour tooltip */}
      <Card
        className={cn(
          "fixed z-[102] w-80 p-4 shadow-2xl border-primary/20 bg-card",
          "animate-scale-in"
        )}
        style={getTooltipStyle()}
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {step.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">{step.title}</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-2 -mt-1"
                onClick={handleSkip}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {step.description}
            </p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {tourSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentStep
                  ? "bg-primary w-4"
                  : index < currentStep
                  ? "bg-primary/50"
                  : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Skip tour
          </Button>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button size="sm" onClick={handleNext}>
              {isLastStep ? (
                <>
                  <Sparkles className="h-4 w-4 mr-1" />
                  Get Started
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Step counter */}
        <p className="text-xs text-muted-foreground text-center mt-3">
          Step {currentStep + 1} of {tourSteps.length}
        </p>
      </Card>
    </>
  );
};

export default CommunityTour;
