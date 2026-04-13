import React from 'react';

interface StepperProps {
    steps: string[];
    currentStep: number;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
    return (
        <div className="step-indicator">
            {steps.map((step, index) => {
                let className = 'step-item';
                if (index === currentStep) className += ' active';
                else if (index < currentStep) className += ' completed';

                return (
                    <div key={index} className={className}>
                        {step}
                    </div>
                );
            })}
        </div>
    );
};
