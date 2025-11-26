import React, { useState } from 'react';
import { UploadCloud, FileText, Play, AlertCircle, User, Calendar, Type, DollarSign, Users } from 'lucide-react';
import { ProjectMetadata, FIXED_ROLES, FixedRole } from '../types';

interface InputSectionProps {
  onAnalyze: (text: string, metadata: ProjectMetadata) => void;
  isAnalyzing: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isAnalyzing }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  
  // Form State
  const [projectName, setProjectName] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Rates State
  const [rates, setRates] = useState<Record<FixedRole, number>>({
    'Product Owner': 60,
    'Back-end Developer': 55,
    'Front-end Developer': 50,
    'UI/UX Designer': 45,
    'QA Engineer': 40
  });

  const handleRateChange = (role: FixedRole, value: string) => {
    const numValue = parseFloat(value);
    setRates(prev => ({
      ...prev,
      [role]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const handleSubmit = () => {
    if (text.length < 50) {
      setError('Por favor, ingresa más detalles sobre tu proyecto (mínimo 50 caracteres) para obtener una estimación precisa.');
      return;
    }
    if (!projectName.trim() || !requesterName.trim()) {
      setError('Por favor completa el nombre del proyecto y del solicitante.');
      return;
    }

    // Validate rates
    const hasInvalidRate = Object.values(rates).some(r => (r as number) <= 0);
    if (hasInvalidRate) {
      setError('Por favor define un valor hora mayor a 0 para todos los roles.');
      return;
    }

    setError('');
    onAnalyze(text, {
      projectName,
      requesterName,
      date,
      userRates: rates
    });
  };

  const handleExample = () => {
    setProjectName('DogWalk App');
    setRequesterName('Juan Pérez');
    const example = `Resumen:
Una aplicación móvil que conecta dueños de perros con paseadores certificados en tiempo real.

Características Principales:
1. Autenticación de Usuarios: Login social (Google, Apple) y correo. Perfiles diferenciados (Dueño, Paseador).
2. Geolocalización: Mapa en tiempo real para ver paseadores cercanos y rastrear el paseo.
3. Gestión de Pagos: Integración con Stripe para pagos automáticos. Billetera virtual para paseadores.
4. Sistema de Calificaciones: Reseñas y estrellas para ambas partes.
5. Chat Integrado: Comunicación en tiempo real entre dueño y paseador.
6. Panel de Administración: Web admin para gestionar usuarios, disputas y ver métricas.

Plataformas: iOS (Swift) y Android (Kotlin).
Backend: Node.js con base de datos PostgreSQL.
Diseño: Moderno y amigable.`;
    setText(example);
    setError('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-4">
          Estimaciones impulsadas por IA
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          powered by Google Gemini
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="p-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Metadata Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Type size={14} /> Nombre del Proyecto
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="block w-full rounded-lg border-slate-300 border p-2.5 bg-slate-50 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Ej: E-commerce Moda"
                disabled={isAnalyzing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <User size={14} /> Solicitante
              </label>
              <input
                type="text"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                className="block w-full rounded-lg border-slate-300 border p-2.5 bg-slate-50 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Ej: Tu Nombre"
                disabled={isAnalyzing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Calendar size={14} /> Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="block w-full rounded-lg border-slate-300 border p-2.5 bg-slate-50 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={isAnalyzing}
              />
            </div>
          </div>

          <div className="border-t border-slate-100"></div>

          {/* Team Configuration */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users size={16} className="text-indigo-600" />
              Configuración del Equipo y Tarifas (USD/Hora)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {FIXED_ROLES.map((role) => (
                <div key={role} className="relative">
                  <label className="block text-xs font-medium text-slate-500 mb-1 truncate" title={role}>
                    {role}
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-slate-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={rates[role]}
                      onChange={(e) => handleRateChange(role, e.target.value)}
                      className="block w-full rounded-md border-slate-300 pl-7 pr-3 py-2 bg-slate-50 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="0.00"
                      disabled={isAnalyzing}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              * El <b>Product Owner</b> será responsable de crear y administrar historias de usuario.
            </p>
          </div>

          <div className="border-t border-slate-100"></div>

          {/* Text Area */}
          <div>
            <div className="mb-4 flex justify-between items-center">
              <label htmlFor="prd-input" className="block text-sm font-medium text-slate-700">
                Detalles del PRD / Requerimientos
              </label>
              <button 
                onClick={handleExample}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                <FileText size={14} /> Cargar ejemplo
              </button>
            </div>
            
            <div className="relative">
              <textarea
                id="prd-input"
                rows={12}
                className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-4 border bg-slate-50 placeholder-slate-400 transition-all"
                placeholder="Describe tu proyecto aquí. Ejemplo: 'Quiero una app tipo marketplace...'"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isAnalyzing}
              />
              <div className="absolute bottom-3 right-3 text-xs text-slate-400 pointer-events-none">
                {text.length} caracteres
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-md flex items-start gap-2 text-red-700 text-sm">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-end items-center">
            <span className="text-xs text-slate-500 hidden sm:block">
               Se utilizarán las tarifas configuradas para calcular el costo total.
            </span>
            <button
              onClick={handleSubmit}
              disabled={isAnalyzing}
              className={`w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white transition-all duration-200 
                ${isAnalyzing 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5'}`}
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analizando PRD...
                </>
              ) : (
                <>
                  <Play size={20} className="mr-2 fill-current" />
                  Obtener Estimación
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3 text-center">
        <div className="p-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 text-indigo-600 mb-4">
            <FileText size={24} />
          </div>
          <h3 className="text-lg font-medium text-slate-900">Análisis Estructurado</h3>
          <p className="mt-2 text-base text-slate-500">Roles estandarizados y tareas asignadas con precisión matemática.</p>
        </div>
        <div className="p-4">
           <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 text-indigo-600 mb-4">
            <DollarSign size={24} />
          </div>
          <h3 className="text-lg font-medium text-slate-900">Control de Tarifas</h3>
          <p className="mt-2 text-base text-slate-500">Define el valor hora de tu equipo antes de empezar.</p>
        </div>
        <div className="p-4">
           <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 text-indigo-600 mb-4">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-lg font-medium text-slate-900">Riesgos & Mitigación</h3>
          <p className="mt-2 text-base text-slate-500">Identificación proactiva de obstáculos técnicos.</p>
        </div>
      </div>
    </div>
  );
};

export default InputSection;
