import React, { useState, useMemo, useEffect } from 'react';
import { EstimationResult, PhaseEstimate, PhaseTask } from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { Clock, DollarSign, Users, AlertTriangle, Layers, Download, FileCode, UserCircle, Calendar, Briefcase, Activity, ChevronDown, ChevronUp, CheckCircle2, Edit2 } from 'lucide-react';

interface ResultsDashboardProps {
  data: EstimationResult;
  onReset: () => void;
}

const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

const formatCurrency = (value: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(value);
};

// Helper to create a safe ID for roles to use as keys
const sanitizeRole = (role: string) => role.replace(/\s+/g, '_').toLowerCase();

const PhaseCard: React.FC<{ 
  phase: PhaseEstimate; 
  currency: string;
  roleRates: Record<string, string | number>;
}> = ({ phase, currency, roleRates }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Recalculate phase specific costs based on dynamic rates
  const dynamicTasks = phase.tasks.map(task => {
    const rawRate = roleRates[sanitizeRole(task.assignedRole)];
    // Use dynamic rate if available (even if 0), otherwise fallback to task rate. 
    // If rawRate is an empty string (user cleared input), treat as 0.
    const rate = rawRate !== undefined && rawRate !== '' ? Number(rawRate) : (rawRate === '' ? 0 : task.hourlyRate);
    
    return {
      ...task,
      hourlyRate: rate,
      cost: task.hours * rate
    };
  });

  const dynamicPhaseCost = dynamicTasks.reduce((acc, t) => acc + t.cost, 0);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md bg-white">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors"
      >
        <div className="flex-grow">
          <div className="flex items-center gap-3 mb-2">
             {isOpen ? <ChevronUp className="text-indigo-500" size={20} /> : <ChevronDown className="text-slate-400" size={20} />}
             <h4 className="font-bold text-slate-900 text-lg">{phase.name}</h4>
             <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                phase.complexity === 'Alta' ? 'bg-red-50 text-red-700 border-red-100' : 
                phase.complexity === 'Media' ? 'bg-orange-50 text-orange-700 border-orange-100' : 
                'bg-emerald-50 text-emerald-700 border-emerald-100'
             }`}>
               Complejidad: {phase.complexity}
             </span>
          </div>
          <p className="text-sm text-slate-500 line-clamp-1">{phase.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm flex-shrink-0">
           <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
              <UserCircle size={14} />
              {phase.assignedRole}
            </div>
            <div className="flex flex-col items-end">
              <span className="font-bold text-slate-900">{formatCurrency(dynamicPhaseCost, currency)}</span>
              <span className="text-xs text-slate-500">{phase.estimatedHours} hs</span>
            </div>
        </div>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 pt-2 bg-slate-50 border-t border-slate-100">
          <p className="text-sm text-slate-700 mb-4 leading-relaxed p-3 bg-white rounded border border-slate-200">
            {phase.description}
          </p>
          
          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <CheckCircle2 size={14} />
            Detalle de Tareas
          </h5>
          <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-600 font-medium text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">Tarea / Actividad</th>
                  <th className="px-4 py-2 text-left">Rol Ejecutor</th>
                  <th className="px-4 py-2 text-right">Valor Hora</th>
                  <th className="px-4 py-2 text-right w-24">Horas</th>
                  <th className="px-4 py-2 text-right w-32">Costo Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dynamicTasks.length > 0 ? (
                  dynamicTasks.map((task, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-700">{task.name}</td>
                      <td className="px-4 py-2 text-slate-600 text-xs font-medium">
                        <span className="px-2 py-0.5 bg-slate-100 rounded">{task.assignedRole}</span>
                      </td>
                      <td className="px-4 py-2 text-right text-slate-500 text-xs">{formatCurrency(task.hourlyRate, currency)}</td>
                      <td className="px-4 py-2 text-right text-slate-500">{task.hours}</td>
                      <td className="px-4 py-2 text-right text-slate-900 font-medium">{formatCurrency(task.cost, currency)}</td>
                    </tr>
                  ))
                ) : (
                   <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-slate-400 italic">No hay desglose de tareas disponible.</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ data, onReset }) => {
  // State to manage editable rates. Stores string | number to allow flexible editing (e.g. empty string or decimals)
  const [roleRates, setRoleRates] = useState<Record<string, string | number>>({});

  // Initialize rates from the API data ONCE
  useEffect(() => {
    const initialRates: Record<string, number> = {};
    // Prioritize rates from costBreakdown if available, otherwise extract from tasks
    data.costBreakdown.forEach(item => {
        initialRates[sanitizeRole(item.role)] = item.hourlyRate;
    });
    
    // Fallback: Scan tasks to ensure we catch all roles
    data.phases.forEach(phase => {
        phase.tasks.forEach(task => {
            const key = sanitizeRole(task.assignedRole);
            if (!initialRates[key]) {
                initialRates[key] = task.hourlyRate;
            }
        });
    });
    setRoleRates(initialRates);
  }, [data]);

  // Core Calculation Logic: Derived from Tasks to ensure consistency
  const { calculatedBreakdown, totalCalculatedCost, totalCalculatedHours, costByPhase, timelineData, phasesWithDynamicCost } = useMemo(() => {
    const breakdownMap: Record<string, { hours: number, cost: number, role: string }> = {};
    let totalCost = 0;
    let totalHours = 0;
    
    const processedPhases = data.phases.map(phase => {
      let phaseCost = 0;
      phase.tasks.forEach(task => {
          const roleKey = sanitizeRole(task.assignedRole);
          const rawRate = roleRates[roleKey];
          // Use edited rate if it exists, else task rate. Handle empty string as 0.
          const rate = rawRate !== undefined && rawRate !== '' ? Number(rawRate) : (rawRate === '' ? 0 : task.hourlyRate);
          
          const taskCost = task.hours * rate;
          
          // Aggregate for Phase
          phaseCost += taskCost;

          // Aggregate for Breakdown
          if (!breakdownMap[roleKey]) {
              breakdownMap[roleKey] = { hours: 0, cost: 0, role: task.assignedRole };
          }
          breakdownMap[roleKey].hours += task.hours;
          breakdownMap[roleKey].cost += taskCost;
          
          // Aggregate Global
          totalHours += task.hours;
          totalCost += taskCost;
      });
      return { ...phase, estimatedCost: phaseCost }; // Return phase with recalculated cost
    });

    const breakdownList = Object.values(breakdownMap).map(item => ({
        role: item.role,
        totalHours: item.hours,
        subtotalCost: item.cost,
        hourlyRate: Number(roleRates[sanitizeRole(item.role)]) || 0
    }));

    const phaseChartData = processedPhases.map(phase => ({
        name: phase.name,
        value: phase.estimatedCost
    }));

    const timeline = processedPhases.map(phase => ({
        name: phase.name,
        shortName: phase.name.length > 20 ? phase.name.substring(0, 20) + '...' : phase.name,
        hours: phase.estimatedHours,
    }));

    return {
        calculatedBreakdown: breakdownList,
        totalCalculatedCost: totalCost,
        totalCalculatedHours: totalHours,
        costByPhase: phaseChartData,
        timelineData: timeline,
        phasesWithDynamicCost: processedPhases
    };
  }, [data, roleRates]);

  const handleRateChange = (role: string, newRate: string) => {
    // Allow empty string for clearing or valid number format
    if (newRate === '' || /^\d*\.?\d*$/.test(newRate)) {
        setRoleRates(prev => ({
            ...prev,
            [sanitizeRole(role)]: newRate
        }));
    }
  };

  // Calculate weeks based on Roadmap (Critical Path), fallback to hours/24 if roadmap empty
  const calculatedWeeks = data.roadmap && data.roadmap.length > 0 
    ? Math.max(...data.roadmap.map(r => r.endWeek))
    : Math.ceil(totalCalculatedHours / 24);

  const currency = data.totalEstimatedCost.currency;

  const handlePrintPDF = () => {
    window.print();
  };

  const handleDownloadHTML = () => {
    // Re-construct HTML using the CALCULATED values, not the original raw data
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Estimación: ${data.projectName}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>body { font-family: system-ui, sans-serif; }</style>
      </head>
      <body class="bg-slate-50 text-slate-900 p-8">
        <div class="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
          <h1 class="text-3xl font-bold text-indigo-700 mb-2">${data.projectName}</h1>
          <div class="flex justify-between text-sm text-slate-500 mb-6">
            <span>Solicitado por: ${data.requesterName}</span>
            <span>Fecha: ${data.requestDate}</span>
          </div>
          <div class="bg-slate-50 p-4 rounded-lg mb-6">
            <h2 class="font-bold mb-2">Resumen Ejecutivo</h2>
            <p>${data.executiveSummary}</p>
          </div>
          <div class="grid grid-cols-3 gap-4 mb-8">
             <div class="p-4 bg-green-50 rounded-lg text-center">
               <div class="text-green-800 font-bold text-xl">${formatCurrency(totalCalculatedCost, currency)}</div>
               <div class="text-xs text-green-600">Costo Total Estimado</div>
             </div>
             <div class="p-4 bg-blue-50 rounded-lg text-center">
               <div class="text-blue-800 font-bold text-xl">${calculatedWeeks} Semanas</div>
               <div class="text-xs text-blue-600">Duración Estimada (Ruta Crítica)</div>
             </div>
             <div class="p-4 bg-indigo-50 rounded-lg text-center">
               <div class="text-indigo-800 font-bold text-xl">${totalCalculatedHours} Hs</div>
               <div class="text-xs text-indigo-600">Horas Totales</div>
             </div>
          </div>

          <h2 class="text-xl font-bold mb-4">Desglose de Costos por Rol</h2>
          <table class="w-full text-sm text-left text-slate-500 mb-8 border border-slate-200 rounded-lg overflow-hidden">
             <thead class="text-xs text-slate-700 uppercase bg-slate-100">
                <tr>
                    <th class="px-4 py-2">Rol</th>
                    <th class="px-4 py-2 text-right">Horas Totales</th>
                    <th class="px-4 py-2 text-right">Tarifa/Hora</th>
                    <th class="px-4 py-2 text-right">Subtotal</th>
                </tr>
             </thead>
             <tbody>
                ${calculatedBreakdown.map(r => `
                  <tr class="bg-white border-b">
                    <td class="px-4 py-2 font-medium text-slate-900">${r.role}</td>
                    <td class="px-4 py-2 text-right">${r.totalHours} h</td>
                    <td class="px-4 py-2 text-right">${formatCurrency(r.hourlyRate, currency)}</td>
                    <td class="px-4 py-2 text-right font-bold text-slate-900">${formatCurrency(r.subtotalCost, currency)}</td>
                  </tr>
                `).join('')}
                <tr class="bg-slate-100 font-bold text-slate-900">
                  <td class="px-4 py-2">TOTAL</td>
                  <td class="px-4 py-2 text-right">${totalCalculatedHours} h</td>
                  <td class="px-4 py-2 text-right">-</td>
                  <td class="px-4 py-2 text-right">${formatCurrency(totalCalculatedCost, currency)}</td>
                </tr>
             </tbody>
          </table>

          <h2 class="text-xl font-bold mb-4">Fases del Proyecto</h2>
          <div class="space-y-6 mb-8">
            ${phasesWithDynamicCost.map(p => `
              <div class="border border-slate-200 rounded-lg overflow-hidden">
                <div class="bg-slate-50 p-4 border-b border-slate-100">
                    <div class="flex justify-between font-bold mb-1">
                        <span>${p.name}</span>
                        <span>${formatCurrency(p.estimatedCost, currency)}</span>
                    </div>
                    <div class="text-sm text-indigo-600">Responsable: ${p.assignedRole} | Esfuerzo: ${p.estimatedHours} hrs</div>
                </div>
                <div class="p-4">
                    <p class="text-sm text-slate-600 mb-4">${p.description}</p>
                    <table class="w-full text-xs text-left">
                        <thead class="bg-slate-50 text-slate-500">
                          <tr>
                            <th class="p-2">Tarea</th>
                            <th class="p-2">Rol</th>
                            <th class="p-2 text-right">Tarifa</th>
                            <th class="p-2 text-right">Hrs</th>
                            <th class="p-2 text-right">Costo</th>
                          </tr>
                        </thead>
                        <tbody>
                        ${p.tasks ? p.tasks.map(t => {
                           const rawRate = roleRates[sanitizeRole(t.assignedRole)];
                           const tRate = rawRate !== undefined && rawRate !== '' ? Number(rawRate) : (rawRate === '' ? 0 : t.hourlyRate);
                           
                           return `
                          <tr class="border-b border-slate-100">
                            <td class="p-2">${t.name}</td>
                            <td class="p-2 font-medium text-slate-600">${t.assignedRole}</td>
                            <td class="p-2 text-right text-slate-400">${formatCurrency(tRate, currency)}</td>
                            <td class="p-2 text-right">${t.hours}</td>
                            <td class="p-2 text-right font-medium">${formatCurrency(t.hours * tRate, currency)}</td>
                          </tr>`;
                        }).join('') : '<tr><td colspan="5" class="p-2 italic">Ver detalle en app</td></tr>'}
                        </tbody>
                    </table>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="text-center text-xs text-slate-400 mt-10">Generado por EstimIA</div>
        </div>
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Estimacion-${data.projectName.replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ---------------- ROADMAP LOGIC ----------------

  // 1. Calculate Max Duration in Weeks
  const maxDuration = Math.max(
    data.totalEstimatedDurationWeeks.max, 
    calculatedWeeks,
    data.roadmap.length > 0 ? Math.max(...data.roadmap.map(r => r.endWeek)) : 0
  );
  
  // 2. Determine Project Start Date (1st of Next Month)
  const projectStartDate = useMemo(() => {
    const now = new Date();
    // Month is 0-indexed. (now.getMonth() + 1) gets next month index.
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }, []);

  // 3. Build Timeline Groups (Months -> Weeks)
  const timelineGroups = useMemo(() => {
    const groups: { monthLabel: string; weeks: number[] }[] = [];
    
    // Helper to format month
    const formatMonth = (date: Date) => {
      return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    };

    let currentMonthLabel = '';
    let currentWeekList: number[] = [];

    // Loop through every project week (1 to maxDuration)
    for (let w = 1; w <= maxDuration; w++) {
      // Calculate date for this week. (Week 1 starts on projectStartDate)
      const weekStartDate = new Date(projectStartDate);
      weekStartDate.setDate(projectStartDate.getDate() + (w - 1) * 7);
      
      const monthLabel = formatMonth(weekStartDate);

      if (monthLabel !== currentMonthLabel) {
        // Push previous group if exists
        if (currentWeekList.length > 0) {
          groups.push({ monthLabel: currentMonthLabel, weeks: currentWeekList });
        }
        // Start new group
        currentMonthLabel = monthLabel;
        currentWeekList = [w];
      } else {
        currentWeekList.push(w);
      }
    }
    // Push final group
    if (currentWeekList.length > 0) {
      groups.push({ monthLabel: currentMonthLabel, weeks: currentWeekList });
    }

    return groups;
  }, [maxDuration, projectStartDate]);

  return (
    <div className="w-full max-w-[95%] 2xl:max-w-[1800px] mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 no-print">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Resultados de Estimación</h2>
          <p className="text-slate-500 text-sm mt-1">
            Proyecto: <span className="font-semibold text-slate-700">{data.projectName}</span> | 
            Solicitante: <span className="font-semibold text-slate-700">{data.requesterName}</span> | 
            Fecha: {data.requestDate}
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
           <button 
            onClick={handleDownloadHTML}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 bg-white transition-colors"
          >
            <FileCode size={16} />
            Descargar HTML
          </button>
          <button 
            onClick={handlePrintPDF}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 bg-white transition-colors"
          >
            <Download size={16} />
            Guardar PDF
          </button>
          <button 
            onClick={onReset}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Nueva Estimación
          </button>
        </div>
      </div>

      {/* Print Only Header */}
      <div className="hidden print-only mb-8 border-b pb-4">
        <h1 className="text-4xl font-bold text-slate-900">{data.projectName}</h1>
        <div className="flex justify-between mt-2 text-slate-600">
          <span>Solicitante: {data.requesterName}</span>
          <span>Fecha: {data.requestDate}</span>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-8 page-break-inside-avoid">
        <div className="flex flex-col xl:flex-row gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xl font-semibold text-slate-900">Resumen Ejecutivo</h3>
            </div>
            <p className="text-slate-600 leading-relaxed text-justify mb-6">{data.executiveSummary}</p>
            
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Users size={16} className="text-slate-500"/> 
                    Desglose de Horas y Costos por Rol
                </h4>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 text-left text-slate-500 uppercase tracking-wide">
                                <th className="pb-2 font-medium">Rol</th>
                                <th className="pb-2 text-right">Horas</th>
                                <th className="pb-2 text-right">Tarifa ({currency})</th>
                                <th className="pb-2 text-right font-bold text-slate-700">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {calculatedBreakdown.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="py-2 font-medium text-slate-800">{item.role}</td>
                                    <td className="py-2 text-right text-slate-600">{item.totalHours} h</td>
                                    <td className="py-2 text-right">
                                      <div className="flex items-center justify-end gap-1 relative group">
                                        <span className="text-slate-400 text-[10px] absolute right-24 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Editar:</span>
                                        <input 
                                          type="text"
                                          value={roleRates[sanitizeRole(item.role)] !== undefined ? roleRates[sanitizeRole(item.role)] : item.hourlyRate}
                                          onChange={(e) => handleRateChange(item.role, e.target.value)}
                                          className="w-24 text-right border border-transparent hover:border-slate-300 focus:border-indigo-500 bg-transparent focus:bg-white rounded px-2 py-1 outline-none transition-all font-medium text-slate-600 focus:text-indigo-700"
                                        />
                                      </div>
                                    </td>
                                    <td className="py-2 text-right font-bold text-indigo-700">{formatCurrency(item.subtotalCost, currency)}</td>
                                </tr>
                            ))}
                        </tbody>
                        {/* Table Footer for Totals */}
                        <tfoot className="bg-slate-100 font-bold text-slate-900 border-t border-slate-200">
                            <tr>
                                <td className="py-2 pl-2">TOTAL</td>
                                <td className="py-2 text-right text-indigo-700">{totalCalculatedHours} h</td>
                                <td className="py-2 text-right">-</td>
                                <td className="py-2 text-right text-indigo-700">{formatCurrency(totalCalculatedCost, currency)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div className="mt-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Stack Tecnológico</h4>
              <div className="flex flex-wrap gap-2">
                {data.recommendedTechStack.map((tech, idx) => (
                  <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {/* Updated KPIs Card */}
          <div className="flex-shrink-0 grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-4 xl:border-l xl:pl-8 border-slate-100 min-w-[280px]">
            
            <div className="bg-green-50 p-5 rounded-lg border border-green-100 shadow-sm">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <DollarSign size={18} />
                <span className="text-sm font-bold uppercase tracking-wide">Costo Estimado</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {formatCurrency(totalCalculatedCost, currency)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Basado en {totalCalculatedHours} horas totales
              </div>
            </div>

            <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100 shadow-sm">
              <div className="flex items-center gap-2 text-indigo-700 mb-1">
                <Briefcase size={18} />
                <span className="text-sm font-bold uppercase tracking-wide">Esfuerzo Total</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {totalCalculatedHours} hs
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Rango inicial: {data.totalEstimatedHours.min} - {data.totalEstimatedHours.max} horas
              </div>
            </div>

            <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 shadow-sm">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <Clock size={18} />
                <span className="text-sm font-bold uppercase tracking-wide">Tiempo Total</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {calculatedWeeks} Semanas
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Basado en Roadmap (Ruta Crítica)
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Roadmap Visualization */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-8 page-break-inside-avoid">
        <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
          <Calendar size={20} className="text-slate-400" />
          Roadmap de Desarrollo
        </h3>
        
        <div className="relative overflow-x-auto">
          <div className="w-full min-w-[800px] md:min-w-0">
              
              {/* Header: Months */}
              <div className="flex border-b border-slate-200">
                <div className="w-64 flex-shrink-0 border-r border-transparent"></div> {/* Spacer for Phase Name */}
                <div className="flex-grow flex">
                   {timelineGroups.map((group, idx) => (
                     <div key={idx} className="text-xs font-bold text-slate-500 uppercase tracking-wide text-center border-l border-slate-200 py-2 bg-slate-50" 
                          style={{ width: `${(group.weeks.length / maxDuration) * 100}%` }}>
                        {group.monthLabel}
                     </div>
                   ))}
                </div>
              </div>

              {/* Header: Weeks */}
              <div className="flex border-b border-slate-200">
                <div className="w-64 flex-shrink-0 text-xs font-bold text-slate-500 uppercase tracking-wide pl-2 py-2 flex items-end">Fase del Proyecto</div>
                <div className="flex-grow flex relative">
                   {/* We iterate 1..maxDuration to draw exactly one cell per week */}
                   {Array.from({ length: maxDuration }, (_, i) => i + 1).map(w => (
                     <div key={w} className="flex-1 text-[10px] text-slate-400 text-center py-2 border-l border-slate-100">
                        Sem {w}
                     </div>
                   ))}
                </div>
              </div>

              {/* Grid Body */}
              <div className="relative mt-0">
                 {/* Background Grid Lines (Vertical) */}
                 <div className="absolute inset-0 flex pointer-events-none pl-64">
                    {Array.from({ length: maxDuration }, (_, i) => i + 1).map(w => (
                        <div key={w} className="flex-1 border-l border-slate-100 border-dashed h-full"></div>
                    ))}
                 </div>

                 {data.roadmap.map((item, idx) => {
                   // Defensive Calculation: Ensure startWeek is at least 1 (not 0)
                   const safeStart = Math.max(1, item.startWeek);
                   const safeEnd = Math.max(safeStart, item.endWeek);

                   // Percentage from left edge of grid area
                   // Start Index (0-based) = safeStart - 1
                   const leftPercent = ((safeStart - 1) / maxDuration) * 100;
                   const widthPercent = ((safeEnd - safeStart + 1) / maxDuration) * 100;

                   return (
                    <div key={idx} className="flex items-center relative z-10 h-12 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <div className="w-64 flex-shrink-0 pr-4 pl-2 flex flex-col justify-center border-r border-slate-100 h-full">
                        <div className="text-sm font-medium text-slate-800 truncate" title={item.phaseName}>{item.phaseName}</div>
                        <div className="text-[10px] text-slate-500 truncate" title={item.milestone}>🚩 {item.milestone}</div>
                      </div>
                      
                      {/* Bar Container */}
                      <div className="flex-grow relative h-full">
                        <div 
                          className={`absolute top-1/2 -translate-y-1/2 h-7 rounded shadow-sm flex items-center px-2 text-[10px] text-white font-medium whitespace-nowrap overflow-hidden transition-all duration-500
                            ${idx % 2 === 0 ? 'bg-indigo-500' : 'bg-blue-500'}`}
                          style={{ 
                            left: `${leftPercent}%`, 
                            width: `${widthPercent}%` 
                          }}
                        >
                          {widthPercent > 5 && <span>Sem {safeStart}-{safeEnd}</span>}
                        </div>
                      </div>
                    </div>
                   );
                })}
              </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8 page-break-inside-avoid">
        {/* Cost Breakdown Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <DollarSign size={20} className="text-slate-400" />
            Distribución de Presupuesto por Fase
          </h3>
          <div className="flex-grow flex flex-col md:flex-row items-center justify-center">
            <div className="h-64 w-full md:w-2/3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costByPhase}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {costByPhase.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value, currency)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/3 pl-4 mt-4 md:mt-0 space-y-2 overflow-y-auto max-h-64">
              {costByPhase.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-slate-600">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate font-medium">{entry.name}</span>
                    <span className="text-[10px] text-slate-400">{formatCurrency(entry.value, currency)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-slate-400" />
            Esfuerzo Estimado por Fase
          </h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" style={{ fontSize: '10px' }} />
                <YAxis 
                  dataKey="shortName" 
                  type="category" 
                  width={140} 
                  style={{ fontSize: '11px', fontWeight: 500 }} 
                  tick={{ fill: '#475569' }}
                />
                <RechartsTooltip 
                  cursor={{fill: '#f1f5f9'}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-lg">
                          <p className="font-bold text-sm text-slate-800">{data.name}</p>
                          <p className="text-indigo-600 text-sm font-medium">{data.hours} Horas</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="hours" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Phases (Collapsible) */}
        <div className="xl:col-span-2 space-y-4 page-break-inside-avoid">
          <div className="flex items-center gap-2 mb-2">
             <Layers size={20} className="text-slate-500" />
             <h3 className="text-lg font-semibold text-slate-900">Desglose de Fases y Tareas</h3>
          </div>
          
          {phasesWithDynamicCost.map((phase, idx) => (
            <PhaseCard key={idx} phase={phase} currency={currency} roleRates={roleRates} />
          ))}
        </div>

        {/* Right Column: Team & Risks */}
        <div className="space-y-8 page-break-inside-avoid">
          
          {/* Team Composition */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Users size={20} className="text-slate-400" />
              Equipo Sugerido
            </h3>
            <ul className="space-y-3">
              {data.teamComposition.map((role, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 p-2 rounded hover:bg-slate-50">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></div>
                  <span>{role}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Risks */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-slate-400" />
              Análisis de Riesgos
            </h3>
            <div className="space-y-4">
              {data.risks.map((risk, idx) => (
                <div key={idx} className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-slate-800 leading-tight">{risk.risk}</span>
                    <span className={`ml-2 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded flex-shrink-0
                      ${risk.impact === 'Alto' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {risk.impact}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-2 pt-2 border-t border-orange-200/50">
                    <span className="font-semibold text-orange-800">Mitigación:</span> {risk.mitigation}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard;
