import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function StepNavigator({ currentStep, setCurrentStep, totalSteps }) {
  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="glass-panel border border-white/20 backdrop-blur-xl bg-white/10 p-4 rounded-xl mt-6">
      <div className="flex justify-between items-center">
        <Button
          onClick={handleBack}
          disabled={currentStep === 1}
          variant="outline"
          className="bg-white/10 border-white/20 text-white hover:opacity-80 disabled:opacity-50 transition-opacity duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <p className="text-sm font-medium text-white/80">
          Step {currentStep} / {totalSteps}
        </p>
        <Button
          onClick={handleNext}
          disabled={currentStep === totalSteps}
          className="bg-indigo-500/80 hover:opacity-90 text-white disabled:opacity-50 transition-opacity duration-200"
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}