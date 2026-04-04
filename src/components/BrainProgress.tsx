import React, { useState, useEffect } from 'react';
import { FaBrain, FaCheckCircle, FaSpinner, FaDatabase, FaNotesMedical, FaListUl, FaLayerGroup, FaNetworkWired } from 'react-icons/fa';
import './BrainProgress.css';

interface BrainProgressProps {
  onComplete?: () => void;
}

export const BrainProgress: React.FC<BrainProgressProps> = ({ onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);

  // Swarm parallel architecture steps
  const steps = [
    { id: 0, text: "Preparando Historia Clínica Cruda", icon: <FaDatabase />, duration: 2000 },
    { 
      id: 1, 
      isParallel: true,
      text: "Desplegando Enjambre (Swarm Multi-Agente)", 
      icon: <FaNetworkWired />, 
      duration: 10000,
      subAgents: [
        { name: "Agente Médico Narrador", role: "Redactando prosa y diagnósticos...", icon: <FaNotesMedical /> },
        { name: "Agente Minero de Datos", role: "Aspirando estudios y procedimientos...", icon: <FaListUl /> }
      ]
    },
    { id: 2, text: "Ensamblando JSON Maestro Consolidado", icon: <FaLayerGroup />, duration: 2000 }
  ];

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const advanceStep = (currentStep: number) => {
      if (currentStep < steps.length) {
        timeoutId = setTimeout(() => {
          setActiveStep(currentStep + 1);
          advanceStep(currentStep + 1);
        }, steps[currentStep].duration);
      } else {
        if (onComplete) onComplete();
      }
    };

    advanceStep(0);

    return () => clearTimeout(timeoutId);
  }, [onComplete]);

  return (
    <div className="multi-pass-progress-overlay">
      <div className="multi-pass-progress-container">
        <div className="brain-header">
          <div className="brain-icon-pulse parallel-pulse">
            <FaBrain />
            <FaBrain className="brain-echo brain-echo-1" />
            <FaBrain className="brain-echo brain-echo-2" />
          </div>
          <h3>Arquitectura Swarm Multi-Agente</h3>
          <p>Los agentes están analizando la HCE en paralelo...</p>
        </div>

        <div className="steps-container">
          {steps.map((step, index) => {
            const isCompleted = activeStep > index;
            const isActive = activeStep === index;
            const isPending = activeStep < index;

            return (
              <div 
                key={step.id} 
                className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isPending ? 'pending' : ''} ${step.isParallel ? 'parallel-step' : ''}`}
              >
                <div className="step-status">
                  {isCompleted ? (
                    <FaCheckCircle className="icon-success" />
                  ) : isActive ? (
                    <FaSpinner className="icon-spin icon-primary" />
                  ) : (
                    <div className="icon-dot" />
                  )}
                </div>
                <div className="step-content">
                  <div className="step-header">
                    <div className="step-icon">{step.icon}</div>
                    <span className="step-text">{step.text}</span>
                  </div>
                  
                  {/* Render parallel agents when active or completed */}
                  {step.isParallel && (isActive || isCompleted) && (
                    <div className="swarm-agents-container">
                      {step.subAgents?.map((agent, aIdx) => (
                        <div key={aIdx} className={`swarm-agent ${isCompleted ? 'agent-done' : 'agent-working'}`}>
                          <div className="agent-icon">{agent.icon}</div>
                          <div className="agent-details">
                            <span className="agent-name">{agent.name}</span>
                            <span className="agent-role">
                              {isCompleted ? "Completado" : agent.role}
                            </span>
                          </div>
                          {!isCompleted && <div className="agent-activity-bar"></div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
