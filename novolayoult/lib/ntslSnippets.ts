export const ntslSnippets = {
  // Basic Structure
  basicStructure: `// Estrutura básica do robô
input
  stopLoss: float = 100;
  takeProfit: float = 200;
var
  entryPrice: float;
begin
  // Lógica principal aqui
end;`,

  // Moving Average Crossover
  mediaMovel: `// Cruzamento de médias móveis
var
  fastMA, slowMA: float;
begin
  fastMA := sma(9);
  slowMA := sma(21);
  
  if fastMA > slowMA and fastMA[1] <= slowMA[1] then
    buy(1, close);
  
  if fastMA < slowMA and fastMA[1] >= slowMA[1] then
    sell(1, close);
end;`,

  // Stop Loss and Take Profit
  stopLoss: `// Stop Loss e Take Profit
if position = 0 and condition then begin
  buy(1, close);
  entryPrice := close;
  set_stop_loss(entryPrice - stopLoss);
  set_take_profit(entryPrice + takeProfit);
end;`,

  // Trailing Stop
  trailing: `// Trailing Stop
var
  stopDistance: float = 100;
  lastStopPrice: float = 0;
begin
  if position > 0 then begin
    if lastStopPrice = 0 then
      lastStopPrice := entryPrice - stopDistance;
    
    if close - stopDistance > lastStopPrice then begin
      lastStopPrice := close - stopDistance;
      set_stop_loss(lastStopPrice);
    end;
  end;
end;`,

  // Breakout Strategy
  rompimento: `// Rompimento de máxima/mínima
var
  periodHigh, periodLow: float;
begin
  periodHigh := highest(high, 20);
  periodLow := lowest(low, 20);
  
  if close > periodHigh[1] then
    buy(1, close)
  else if close < periodLow[1] then
    sell(1, close);
end;`,

  // RSI Strategy
  rsi: `// Estratégia com RSI
var
  rsiValue: float;
  oversold: float = 30;
  overbought: float = 70;
begin
  rsiValue := rsi(14);
  
  if position = 0 and rsiValue < oversold then
    buy(1, close);
    
  if position > 0 and rsiValue > overbought then
    sell(1, close);
end;`,

  // Bollinger Bands Strategy
  bollinger: `// Estratégia com Bandas de Bollinger
var
  upperBand, lowerBand, middleBand: float;
  period: integer = 20;
  deviations: float = 2;
begin
  bollinger(period, deviations, upperBand, middleBand, lowerBand);
  
  if position = 0 and close < lowerBand then
    buy(1, close);
    
  if position > 0 and close > upperBand then
    sell(1, close);
end;`,

  // MACD Strategy
  macd: `// Estratégia com MACD
var
  macdLine, signalLine, histogram: float;
begin
  macd(12, 26, 9, macdLine, signalLine, histogram);
  
  if macdLine > signalLine and macdLine[1] <= signalLine[1] then
    buy(1, close);
    
  if macdLine < signalLine and macdLine[1] >= signalLine[1] then
    sell(1, close);
end;`,

  // HFT Scalping Strategy
  hftScalping: `// Estratégia HFT para Scalping
input
  rsiPeriod: integer = 7;
  rsiOverbought: float = 70;
  rsiOversold: float = 30;
  stopLoss: float = 50;
  takeProfit: float = 100;
var
  rsiValue: float;
  entryPrice: float;
begin
  rsiValue := rsi(rsiPeriod);
  
  // Compra rápida quando RSI está sobrevendido
  if position = 0 and rsiValue < rsiOversold and rsiValue[1] < rsiValue then begin
    buy(1, close);
    entryPrice := close;
    set_stop_loss(entryPrice - stopLoss);
    set_take_profit(entryPrice + takeProfit);
  end;
  
  // Venda rápida quando RSI está sobrecomprado
  if position > 0 and rsiValue > rsiOverbought then
    sell(1, close);
    
  // Saída rápida se o movimento não continuar
  if position > 0 and close < close[1] and close[1] < close[2] then
    sell(1, close);
end;`,

  // Correlation Strategy
  correlacao: `// Estratégia de Correlação entre Ativos
input
  symbol1: string = "PETR4";
  symbol2: string = "VALE3";
  correlationPeriod: integer = 20;
  deviationThreshold: float = 1.5;
var
  price1, price2: float;
  ratio, avgRatio, stdRatio: float;
  zScore: float;
begin
  price1 := external_close(symbol1);
  price2 := external_close(symbol2);
  
  // Calcula a razão entre os preços
  ratio := price1 / price2;
  
  // Média e desvio padrão da razão
  avgRatio := sma_custom(ratio, correlationPeriod);
  stdRatio := stdev_custom(ratio, correlationPeriod);
  
  // Z-score (quantos desvios padrão a razão está da média)
  zScore := (ratio - avgRatio) / stdRatio;
  
  // Operações quando a correlação está fora do padrão
  if position = 0 and zScore < -deviationThreshold then
    buy(1, close); // Compra quando o ativo está subvalorizado em relação ao par
    
  if position > 0 and zScore > 0 then
    sell(1, close); // Vende quando a correlação normaliza
end;`,

  // Volume Profile Strategy
  volumeProfile: `// Estratégia baseada em Perfil de Volume
input
  volumeThreshold: float = 1.5; // Multiplicador do volume médio
  lookbackPeriod: integer = 20;
var
  avgVolume, currentVolume: float;
  valueArea: float;
begin
  avgVolume := sma_custom(volume, lookbackPeriod);
  currentVolume := volume;
  valueArea := vwap(lookbackPeriod);
  
  // Compra em suporte de volume com volume acima da média
  if position = 0 and close < valueArea and currentVolume > avgVolume * volumeThreshold then
    buy(1, close);
    
  // Venda em resistência de volume com volume acima da média
  if position > 0 and close > valueArea and currentVolume > avgVolume * volumeThreshold then
    sell(1, close);
end;`,

  // Volatility Breakout
  volatilityBreakout: `// Estratégia de Rompimento de Volatilidade (ATR)
input
  atrPeriod: integer = 14;
  atrMultiplier: float = 2.0;
  stopMultiplier: float = 1.5;
var
  atrValue: float;
  upperBand, lowerBand: float;
  entryPrice: float;
begin
  atrValue := atr(atrPeriod);
  upperBand := high[1] + atrValue * atrMultiplier;
  lowerBand := low[1] - atrValue * atrMultiplier;
  
  // Compra no rompimento superior
  if position = 0 and high > upperBand then begin
    buy(1, close);
    entryPrice := close;
    set_stop_loss(entryPrice - atrValue * stopMultiplier);
  end;
  
  // Venda no rompimento inferior
  if position = 0 and low < lowerBand then begin
    sell(1, close);
    entryPrice := close;
    set_stop_loss(entryPrice + atrValue * stopMultiplier);
  end;
end;`
};