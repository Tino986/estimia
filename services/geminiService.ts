import { GoogleGenAI, Type } from "@google/genai";
import { EstimationResult, ProjectMetadata } from "../types";

const apiKey = process.env.API_KEY;

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: apiKey });

export const analyzePRD = async (prdContent: string, metadata: ProjectMetadata): Promise<EstimationResult> => {
  if (!apiKey) {
    throw new Error("API Key no configurada. Por favor verifica tu entorno.");
  }

  // Format rates for the prompt
  const ratesContext = Object.entries(metadata.userRates)
    .map(([role, rate]) => `- ${role}: $${rate} USD/hora`)
    .join('\n');

  const systemPrompt = `
    Eres un Arquitecto de Soluciones Senior y Product Manager Experto.
    Tu objetivo es analizar un Documento de Requisitos de Producto (PRD) para generar una estimación técnica detallada y matemática precisa.
    
    ESTRUCTURA DEL EQUIPO (OBLIGATORIO):
    Debes utilizar ÚNICA Y EXCLUSIVAMENTE los siguientes roles. No inventes roles nuevos. Asigna cualquier tarea necesaria (DevOps, Testing, Arquitectura, etc.) al rol más afín de esta lista:
    
    ${ratesContext}
    
    DEFINICIÓN DE ROLES:
    1. **Product Owner**: Responsable EXCLUSIVO de crear historias de usuario, administrar el backlog, definir requisitos funcionales y priorizar. Si hay tareas de definición, van a este rol.
    2. **Back-end Developer**: Arquitectura de servidor, bases de datos, APIs, lógica de negocio, integraciones, DevOps básico.
    3. **Front-end Developer**: Desarrollo de interfaces (Web/Mobile), integración con APIs, maquetación, lógica de cliente.
    4. **QA Engineer**: Pruebas manuales, automatizadas, reporte de bugs, validación de calidad.
    5. **UI/UX Designer**: Prototipos, wireframes, diseño visual, investigación de usuario.

    REGLAS MATEMÁTICAS ESTRICTAS:
    1. **Tarifas Fijas**: DEBES usar EXACTAMENTE las tarifas por hora provistas arriba para los cálculos.
    2. **Cálculo de Tareas**: Costo Tarea = Horas Tarea * Tarifa del Rol Asignado.
    3. **Jornada Laboral**:
       - La semana laboral es de **4 días** (Lunes a Jueves).
       - Cada día tiene **6 horas productivas**.
       - **Total Horas por Semana = 24 Horas** por recurso.
    4. **DURACIÓN Y ROADMAP (CRÍTICO)**:
       - El tiempo total en semanas NO es la suma lineal de horas.
       - DEBES identificar fases que pueden ejecutarse en **PARALELO** (ej. Backend y Frontend pueden avanzar juntos una vez definidos los requisitos).
       - El \`totalEstimatedDurationWeeks\` debe ser determinado por la **RUTA CRÍTICA** (el final de la última fase en el roadmap), considerando el paralelismo.
       - **IMPORTANTE**: La numeración de semanas comienza en **1**. La primera semana del proyecto es la Semana 1, nunca la Semana 0.
    5. **Consistencia**:
       - La suma de las horas de las tareas de una fase = Horas Totales de la Fase.
       - La suma de los costos de las tareas = Costo Total de la Fase.
       - La suma de todos los costos de fases = Costo Total del Proyecto.

    Devuelve la respuesta estrictamente en formato JSON.
  `;

  const userPrompt = `
    Detalles del Proyecto:
    - Nombre: ${metadata.projectName || "Sin nombre"}
    - Solicitante: ${metadata.requesterName || "Anónimo"}
    - Fecha Solicitud: ${metadata.date}

    Contenido del PRD / Requerimientos:
    ${prdContent}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          projectName: { type: Type.STRING },
          executiveSummary: { type: Type.STRING },
          totalEstimatedCost: {
            type: Type.OBJECT,
            properties: {
              min: { type: Type.NUMBER },
              max: { type: Type.NUMBER },
              currency: { type: Type.STRING }
            },
            required: ["min", "max", "currency"]
          },
          totalEstimatedDurationWeeks: {
            type: Type.OBJECT,
            properties: {
              min: { type: Type.NUMBER },
              max: { type: Type.NUMBER }
            },
            required: ["min", "max"]
          },
          totalEstimatedHours: {
            type: Type.OBJECT,
            properties: {
              min: { type: Type.NUMBER },
              max: { type: Type.NUMBER }
            },
            required: ["min", "max"]
          },
          hourlyRates: {
            type: Type.ARRAY,
            description: "Lista de tarifas por hora asignadas a cada rol involucrado (Debe coincidir con los inputs)",
            items: {
              type: Type.OBJECT,
              properties: {
                role: { type: Type.STRING },
                rate: { type: Type.NUMBER },
                currency: { type: Type.STRING }
              },
              required: ["role", "rate", "currency"]
            }
          },
          costBreakdown: {
            type: Type.ARRAY,
            description: "Desglose detallado de costos por rol. La suma debe coincidir con el total.",
            items: {
              type: Type.OBJECT,
              properties: {
                role: { type: Type.STRING },
                totalHours: { type: Type.NUMBER },
                hourlyRate: { type: Type.NUMBER },
                subtotalCost: { type: Type.NUMBER },
                currency: { type: Type.STRING }
              },
              required: ["role", "totalHours", "hourlyRate", "subtotalCost", "currency"]
            }
          },
          roadmap: {
            type: Type.ARRAY,
            description: "Planificación de alto nivel con fases paralelas si es posible. startWeek relativo al inicio (Mínimo 1). startWeek = 1 significa el inicio del proyecto.",
            items: {
              type: Type.OBJECT,
              properties: {
                phaseName: { type: Type.STRING },
                startWeek: { type: Type.NUMBER },
                endWeek: { type: Type.NUMBER },
                milestone: { type: Type.STRING }
              },
              required: ["phaseName", "startWeek", "endWeek", "milestone"]
            }
          },
          recommendedTechStack: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          phases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                estimatedHours: { type: Type.NUMBER },
                estimatedCost: { type: Type.NUMBER },
                complexity: { type: Type.STRING, enum: ["Baja", "Media", "Alta"] },
                assignedRole: { type: Type.STRING, description: "Rol responsable principal de la fase" },
                tasks: {
                  type: Type.ARRAY,
                  description: "Lista detallada de tareas con asignación de rol específica.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      hours: { type: Type.NUMBER },
                      cost: { type: Type.NUMBER },
                      assignedRole: { type: Type.STRING, description: "Rol específico (debe ser uno de los 5 roles definidos)" },
                      hourlyRate: { type: Type.NUMBER, description: "Valor hora aplicado a esta tarea" }
                    },
                    required: ["name", "hours", "cost", "assignedRole", "hourlyRate"]
                  }
                }
              },
              required: ["name", "description", "estimatedHours", "estimatedCost", "complexity", "assignedRole", "tasks"]
            }
          },
          risks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                risk: { type: Type.STRING },
                mitigation: { type: Type.STRING },
                impact: { type: Type.STRING, enum: ["Alto", "Medio", "Bajo"] }
              },
              required: ["risk", "mitigation", "impact"]
            }
          },
          teamComposition: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: [
          "projectName", 
          "executiveSummary", 
          "totalEstimatedCost", 
          "totalEstimatedDurationWeeks", 
          "totalEstimatedHours",
          "hourlyRates",
          "costBreakdown",
          "roadmap",
          "recommendedTechStack", 
          "phases", 
          "risks",
          "teamComposition"
        ]
      }
    }
  });

  if (!response.text) {
    throw new Error("No se pudo generar la estimación. Intenta de nuevo.");
  }

  try {
    const data = JSON.parse(response.text) as EstimationResult;
    return {
      ...data,
      requesterName: metadata.requesterName,
      requestDate: metadata.date
    };
  } catch (error) {
    console.error("Error parsing JSON:", error);
    throw new Error("Error al procesar la respuesta de la IA.");
  }
};
