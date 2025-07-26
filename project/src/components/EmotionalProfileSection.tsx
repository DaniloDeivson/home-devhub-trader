import React from 'react';
import { Brain, ChevronUp, ChevronDown, Target, TrendingDown, Activity, AlertCircle } from 'lucide-react';

interface EmotionalProfileSectionProps {
  showEmotionalProfile: boolean;
  setShowEmotionalProfile: (show: boolean) => void;
  
  emotionalMetrics?: {
    disciplina_operacao?: any;
    disciplina_alavancagem?: any;
    dailyLossDisciplineIndex?: number;
    resumo_comparativo?: any;
    disciplina_diaria?: any;
    leverageDisciplineIndex?: number;
    furyProbability?: number;
  };
}

export function EmotionalProfileSection({
  showEmotionalProfile,
  setShowEmotionalProfile,
  emotionalMetrics = {
    stopDisciplineIndex: 85.7,
    dailyLossDisciplineIndex: 72.3,
    leverageDisciplineIndex: 91.2,
    furyProbability: 8.5
  }
}: EmotionalProfileSectionProps) {
  const calcularIndiceEmocional = () => {
  if (!emotionalMetrics?.resumo_comparativo) return 0;
  
  const resumo = emotionalMetrics.resumo_comparativo;
  const indices = [];
  
  // 1. Índice Disciplina Stop
  if (resumo.disciplina_operacao !== undefined) {
    indices.push(resumo.disciplina_operacao);
  }
  
  // 2. Índice Disciplina Perda/Dia  
  if (resumo.disciplina_dia !== undefined) {
    indices.push(resumo.disciplina_dia);
  }
  
  // 3. Índice Disciplina Alavancagem
  if (resumo.disciplina_alavancagem !== undefined && resumo.disciplina_alavancagem !== null) {
    indices.push(resumo.disciplina_alavancagem);
  }
  
  // 4. Índice Controle de Fúria (inverter probabilidade)
  if (resumo.probabilidade_furia !== undefined) {
    const indiceControleFuria = 100 - resumo.probabilidade_furia;
    indices.push(indiceControleFuria);
  }
  
  // Calcular média
  return indices.length > 0 ? indices.reduce((sum, idx) => sum + idx, 0) / indices.length : 0;
};

const indiceEmocionalTotal = calcularIndiceEmocional();
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <Brain className="w-5 h-5 text-purple-400 mr-2" />
          <h2 className="text-lg font-medium">Perfil Emocional</h2>
        </div>
        <button 
          onClick={() => setShowEmotionalProfile(!showEmotionalProfile)}
          className="p-1.5 hover:bg-gray-700 rounded-md"
        >
          {showEmotionalProfile ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>
      
      {showEmotionalProfile && (
        <div className="p-4">
          <div className="bg-blue-600 rounded-lg p-4">
  <div className="flex items-center mb-2">
    <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
    <h3 className="font-medium">Índice Emocional Total</h3>
  </div>
  <p className={`text-2xl font-bold ${
    indiceEmocionalTotal >= 90 
      ? 'text-green-400' 
      : indiceEmocionalTotal >= 75 
        ? 'text-yellow-400' 
        : indiceEmocionalTotal >= 60
          ? 'text-orange-400'
          : 'text-red-400'
  }`}>
    {indiceEmocionalTotal.toFixed(1)}%
  </p>
  <p className="text-xs text-gray-400 mt-1">
    Risco de trading emocional: {
      indiceEmocionalTotal >= 90 ? 'Muito Baixo' :
      indiceEmocionalTotal >= 75 ? 'Baixo' :
      indiceEmocionalTotal >= 60 ? 'Médio' : 'Alto'
    }
  </p>
</div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            


            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Target className="w-5 h-5 text-green-400 mr-2" />
                <h3 className="font-medium">Índice Disciplina Stop</h3>
              </div>
              <p className={`text-2xl font-bold ${
                (emotionalMetrics?.disciplina_operacao?.indice_disciplina || 0) >= 90 
                  ? 'text-green-400' 
                  : (emotionalMetrics?.disciplina_operacao?.indice_disciplina || 0) >= 70 
                    ? 'text-yellow-400' 
                    : 'text-red-400'
              }`}>
                {emotionalMetrics?.disciplina_operacao?.indice_disciplina?.toFixed(2) || 'N/A'}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Disciplina no uso de stop loss
              </p>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <TrendingDown className="w-5 h-5 text-orange-400 mr-2" />
                <h3 className="font-medium">Índice Disciplina Perda/Dia</h3>
              </div>
              <p className={`text-2xl font-bold ${
                (emotionalMetrics?.disciplina_dia?.indice_disciplina_diaria || 0) >= 90 
                  ? 'text-green-400' 
                  : (emotionalMetrics?.disciplina_dia?.indice_disciplina_diaria || 0) >= 70 
                    ? 'text-yellow-400' 
                    : 'text-red-400'
              }`}>
                {emotionalMetrics?.disciplina_dia?.indice_disciplina_diaria?.toFixed(2) || 'N/A'}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Controle de perdas diárias
              </p>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Activity className="w-5 h-5 text-cyan-400 mr-2" />
                <h3 className="font-medium">Índice Disciplina Alavancagem</h3>
              </div>
              <p className={`text-2xl font-bold ${
                (emotionalMetrics?.disciplina_alavancagem?.indice_disciplina_alavancagem || 0) >= 90 
                  ? 'text-green-400' 
                  : (emotionalMetrics?.disciplina_alavancagem?.indice_disciplina_alavancagem || 0) >= 70 
                    ? 'text-yellow-400' 
                    : 'text-red-400'
              }`}>
                {emotionalMetrics?.disciplina_alavancagem?.indice_disciplina_alavancagem?.toFixed(2) || 'N/A'}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Controle de alavancagem
              </p>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <h3 className="font-medium">Probabilidade de Fúria</h3>
              </div>
              <p className={`text-2xl font-bold ${
                (emotionalMetrics?.resumo_comparativo?.percentual_dias_furia || 0) <= 5 
                  ? 'text-green-400' 
                  : (emotionalMetrics?.resumo_comparativo?.percentual_dias_furia || 0) <= 15 
                    ? 'text-yellow-400' 
                    : 'text-red-400'
              }`}>
                {emotionalMetrics?.resumo_comparativo?.percentual_dias_furia?.toFixed(2) || 'N/A'}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Risco de trading emocional
              </p>
            </div>
            {/* Ind */}
          </div>

          <div className="mt-6 p-4 bg-purple-900 bg-opacity-20 border border-purple-800 rounded-lg">
            <div className="flex items-start">
              <Brain className="w-5 h-5 text-purple-400 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-300 mb-2">Interpretação da Análise Emocional</h4>
                <ul className="text-sm text-purple-200 space-y-1">
                  <li>• <strong>Disciplina Stop:</strong> Mede o cumprimento das regras de stop loss</li>
                  <li>• <strong>Disciplina Perda/Dia:</strong> Avalia o controle de perdas máximas diárias</li>
                  <li>• <strong>Disciplina Alavancagem:</strong> Verifica o uso consistente de alavancagem</li>
                  <li>• <strong>Probabilidade de Fúria:</strong> Indica tendência a trading emocional</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}