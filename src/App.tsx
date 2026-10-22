/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { Step1Input } from './components/Step1Input';
import { Step2Confirmation } from './components/Step2Confirmation';
import { Step3Comparison } from './components/Step3Comparison';
import { Step4ExecutionPlan } from './components/Step4ExecutionPlan';
import {
  DecisionInputs,
  AnalysisResult,
  UnderstandingResult,
  UserConfirmation,
  FollowUpQnA,
} from './types';
import { PresetScenario } from './data/presets';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { buildLocalAnalysis, buildLocalUnderstanding } from './utils/localAnalysis';

const INITIAL_INPUTS: DecisionInputs = {
  dilemma: '',
  goal: '',
  options: ['', ''],
  criteria: [],
  constraints: {
    timeframe: '',
    budget: '',
    energyOrPersonal: '',
  },
};

export default function App() {
  const [resetKey, setResetKey] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [inputs, setInputs] = useState<DecisionInputs>(INITIAL_INPUTS);
  const [includeOptionComparison, setIncludeOptionComparison] = useState(false);

  // Empathetic understanding states
  const [understanding, setUnderstanding] = useState<UnderstandingResult | null>(null);
  const [isLoadingUnderstanding, setIsLoadingUnderstanding] = useState<boolean>(false);
  const [userConfirmation, setUserConfirmation] = useState<UserConfirmation | null>(null);
  const [followUpAnswers, setFollowUpAnswers] = useState<FollowUpQnA[]>([]);

  // Synthesis and result states
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // Cache to avoid duplicate requests
  const lastUnderstoodInputsRef = useRef<string | null>(null);
  const lastAnalyzedInputsRef = useRef<string | null>(null);
  const understandingInFlightRef = useRef(false);
  const analysisInFlightRef = useRef(false);

  // Managed checklist state for Step 4
  const [completedTasks, setCompletedTasks] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem('choicepilot_tasks_v3');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleToggleTask = (day: number) => {
    setCompletedTasks((prev) => {
      const updated = {
        ...prev,
        [day]: !prev[day],
      };
      try {
        localStorage.setItem('choicepilot_tasks_v3', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  // Load preset scenario
  const handleLoadPreset = (preset: PresetScenario) => {
    setInputs(JSON.parse(JSON.stringify(preset.data)));
    setUnderstanding(null);
    setUserConfirmation(null);
    setFollowUpAnswers([]);
    setResult(null);
    setCompletedTasks({});
    try { localStorage.removeItem('choicepilot_tasks_v3'); } catch { /* storage may be unavailable */ }
    setIncludeOptionComparison(false);
    lastUnderstoodInputsRef.current = null;
    lastAnalyzedInputsRef.current = null;
    setAnalysisError(null);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Build a transparent, local reflection without contacting an AI service.
  const handleGoToStep2 = async () => {
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const currentInputsJson = JSON.stringify(inputs);
    if (understanding && lastUnderstoodInputsRef.current === currentInputsJson) {
      return;
    }
    const localUnderstanding = buildLocalUnderstanding(inputs);
    setUnderstanding(localUnderstanding);
    lastUnderstoodInputsRef.current = currentInputsJson;
    setAnalysisError(null);
  };

  // Synthesize the user's own inputs locally; no API key or network request is used.
  const handleStartAnalysis = async (
    confirmation: UserConfirmation,
    followUps: FollowUpQnA[]
  ) => {
    if (analysisInFlightRef.current) return;
    const analysisKey = JSON.stringify({ inputs, confirmation, followUps, includeOptionComparison });
    if (result && lastAnalyzedInputsRef.current === analysisKey) return;

    setUserConfirmation(confirmation);
    setFollowUpAnswers(followUps);

    setIsAnalyzing(true);
    analysisInFlightRef.current = true;
    setAnalysisError(null);
    const clientStartTime = Date.now();
    const localResult = buildLocalAnalysis(inputs, confirmation, followUps, includeOptionComparison, 0);
    localResult.analysisDuration = Number(((Date.now() - clientStartTime) / 1000).toFixed(1));
    setResult(localResult);
    lastAnalyzedInputsRef.current = analysisKey;
    setCompletedTasks({});
    try { localStorage.removeItem('choicepilot_tasks_v3'); } catch { /* storage may be unavailable */ }
    setCurrentStep(3);
    setIsAnalyzing(false);
    analysisInFlightRef.current = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Request Reset
  const handleRequestReset = () => {
    const hasData =
      inputs.dilemma.trim().length > 0 ||
      inputs.options.some((o) => o.trim().length > 0) ||
      inputs.criteria.length > 0 ||
      Boolean(understanding) ||
      Boolean(result);

    if (hasData) {
      setShowResetModal(true);
    } else {
      executeCompleteReset();
    }
  };

  // Execute complete state and storage reset
  const executeCompleteReset = () => {
    setShowResetModal(false);

    // 1. Reset all React state to pristine defaults
    setInputs(INITIAL_INPUTS);
    setIncludeOptionComparison(false);
    setUnderstanding(null);
    setIsLoadingUnderstanding(false);
    setUserConfirmation(null);
    setFollowUpAnswers([]);
    setResult(null);
    setAnalysisError(null);
    setIsAnalyzing(false);
    understandingInFlightRef.current = false;
    analysisInFlightRef.current = false;
    setCompletedTasks({});
    setCurrentStep(1);
    lastAnalyzedInputsRef.current = null;
    lastUnderstoodInputsRef.current = null;

    // 2. Clear app-specific decision keys from localStorage only
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('choicepilot_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.error(e);
    }

    // 3. Force re-render of child components with fresh state
    setResetKey((prev) => prev + 1);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div key={resetKey} className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <Header
        currentStep={currentStep}
        onStepClick={(step) => {
          if (step === 2 && !understanding) {
            handleGoToStep2();
          } else {
            setCurrentStep(step);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        onReset={handleRequestReset}
        canNavigateToStep3={Boolean(result)}
        canNavigateToStep4={Boolean(result)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5 sm:pt-7">
        {currentStep === 1 && (
          <Step1Input
            inputs={inputs}
            onChange={setInputs}
            includeOptionComparison={includeOptionComparison}
            onIncludeOptionComparisonChange={setIncludeOptionComparison}
            onNext={handleGoToStep2}
            onLoadPreset={handleLoadPreset}
          />
        )}

        {currentStep === 2 && (
          <Step2Confirmation
            inputs={inputs}
            onBack={() => {
              setCurrentStep(1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onStartAnalysis={handleStartAnalysis}
            isAnalyzing={isAnalyzing}
            error={analysisError}
            understanding={understanding}
            isLoadingUnderstanding={isLoadingUnderstanding}
            onRetryUnderstanding={handleGoToStep2}
          />
        )}

        {currentStep === 3 && result && (
          <Step3Comparison
            result={result}
            showOptionComparison={includeOptionComparison}
            onNext={() => {
              setCurrentStep(4);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBackToInputs={() => {
              setCurrentStep(1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentStep === 4 && result && (
          <Step4ExecutionPlan
            result={result}
            onBackToComparison={() => {
              setCurrentStep(3);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onReset={handleRequestReset}
            completedTasks={completedTasks}
            onToggleTask={handleToggleTask}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 text-center text-xs text-slate-500">
        <p>ChoicePilot • 질문자의 감정과 고민을 이해하고 스스로 판단하도록 돕는 자기결정 코칭</p>
      </footer>

      {/* Complete Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  모든 내용을 초기화할까요?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  작성하신 고민 내용, 후속 답변, 감정 분석, 수정한 해석, 결과 및 7일 계획이 모두 삭제되고 처음 화면으로 돌아갑니다.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={executeCompleteReset}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>초기화</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
