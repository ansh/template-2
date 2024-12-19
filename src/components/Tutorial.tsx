"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface TutorialProps {
  onComplete: () => void;
}

export default function Tutorial({ onComplete }: TutorialProps) {
  const [step, setStep] = useState(0);
  const [canProgress, setCanProgress] = useState(false);

  // Listen for tutorial step completion
  useEffect(() => {
    const handleStepComplete = () => {
      setCanProgress(true);
    };

    window.addEventListener("tutorialStepComplete", handleStepComplete);
    return () =>
      window.removeEventListener("tutorialStepComplete", handleStepComplete);
  }, []);

  // Reset canProgress when step changes
  useEffect(() => {
    setCanProgress(false);
  }, [step]);

  // Add highlight effect to current interactive element
  useEffect(() => {
    const currentStep = steps[step];
    if (currentStep?.highlightSelector) {
      const element = document.querySelector(currentStep.highlightSelector);
      if (element) {
        element.classList.add("tutorial-highlight");
        // Remove pointer-events-none from the highlighted element
        const parent = element.closest(".tutorial-disabled");
        if (parent) {
          parent.classList.remove("tutorial-disabled");
        }
      }
      return () => {
        if (element) {
          element.classList.remove("tutorial-highlight");
          const parent = element.closest(".tutorial-disabled");
          if (parent) {
            parent.classList.add("tutorial-disabled");
          }
        }
      };
    }
  }, [step]);

  const steps = [
    {
      content: (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60]">
          <div className="bg-yellow-400 rounded-2xl p-6 mb-4 max-w-md">
            <p className="text-black text-lg font-medium">
              "Hey there, champ! Welcome to WrestleQuest—your ultimate wrestling
              training companion! I'm Coach Quest, and I'll be your guide. Let's
              get you all set up and ready to crush your goals!"
            </p>
          </div>
        </div>
      ),
      highlightSelector: null,
    },
    {
      content: (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-[60]">
          <div className="bg-yellow-400 rounded-2xl p-6 max-w-md">
            <p className="text-black text-lg font-medium">
              "First, let's add your profile picture! Tap the circle to upload a
              photo that represents you."
            </p>
          </div>
        </div>
      ),
      highlightSelector: ".profile-pic-upload",
    },
    {
      content: (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-[60]">
          <div className="bg-yellow-400 rounded-2xl p-6 max-w-md">
            <p className="text-black text-lg font-medium">
              "Great! Now, let's add your name. What should I call you?"
            </p>
          </div>
        </div>
      ),
      highlightSelector: ".name-input",
    },
    {
      content: (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-[60]">
          <div className="bg-yellow-400 rounded-2xl p-6 max-w-md">
            <p className="text-black text-lg font-medium">
              "Excellent! Now, what's your current wrestling quest? This could
              be making the team, winning states, or any goal you're working
              towards!"
            </p>
          </div>
        </div>
      ),
      highlightSelector: ".quest-input",
    },
    {
      content: (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60]">
          <div className="bg-yellow-400 rounded-2xl p-6 max-w-md">
            <p className="text-black text-lg font-medium">
              "Perfect setup! Now you're ready to start logging your training.
              After each session, add skill points to track your progress. As
              you improve, you'll see your skills level up and your overall rank
              increase. Let's begin your journey to greatness!"
            </p>
          </div>
        </div>
      ),
      highlightSelector: ".skill-points-section",
    },
  ];

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          {steps[step].content}
        </motion.div>
      </AnimatePresence>

      <button
        onClick={() => {
          if (canProgress && step < steps.length - 1) {
            setStep(step + 1);
          } else if (step === steps.length - 1) {
            onComplete();
          }
        }}
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-gradient-to-r from-blue-500 to-cyan-500 
          text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2
          ${!canProgress && step < steps.length - 1 ? "opacity-50" : "active:from-blue-600 active:to-cyan-600"}`}
        disabled={!canProgress && step < steps.length - 1}
      >
        {step < steps.length - 1 ? "Next" : "Let's Begin!"}
        <ChevronRight className="w-5 h-5" />
      </button>
    </>
  );
}
