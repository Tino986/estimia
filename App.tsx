import React, { useState, useCallback } from 'react';
import Navbar from './components/Navbar';
import InputSection from './components/InputSection';
import ResultsDashboard from './components/ResultsDashboard';
import { AppState, EstimationResult, ProjectMetadata } from './types';
import { analyzePRD } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('input');
  const [result, setResult] = useState<EstimationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAnalyze = useCallback(async (text: string, metadata: ProjectMetadata) => {
    setAppState('analyzing');
    setErrorMsg(null);
    
    try {
      const data = await analyzePRD(text, metadata);
      setResult(data);
      setAppState('result');
    } catch (err: any) {
      console.error(err);
      setAppState('error');
      setErrorMsg(err.message || "Ocurrió un error inesperado al analizar el PRD.");
    }
  }, []);

  const handleReset = useCallback(() => {
    setAppState('input');
    setResult(null);
    setErrorMsg(null);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-grow">
        {appState === 'input' && (
          <InputSection onAnalyze={handleAnalyze} isAnalyzing={false} />
        )}
        
        {appState === 'analyzing' && (
          <InputSection onAnalyze={() => {}} isAnalyzing={true} />
        )}

        {appState === 'result' && result && (
          <ResultsDashboard data={result} onReset={handleReset} />
        )}

        {appState === 'error' && (
          <div className="max-w-2xl mx-auto mt-20 px-4">
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg leading-6 font-medium text-red-800">Error al analizar</h3>
                  <p className="mt-2 text-sm text-red-700">
                    {errorMsg}
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={handleReset}
                      className="text-sm font-medium text-red-700 hover:text-red-600 underline"
                    >
                      Intentar de nuevo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto no-print">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} PRD Estimator AI. Las estimaciones son generadas por IA y deben ser validadas por humanos.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;