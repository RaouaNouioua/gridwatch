import React, { useState } from 'react';
import axios from 'axios';
import { Activity, AlertTriangle, Zap, Server, ActivityIcon, Clock, CheckCircle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

// Types
type PredictionHistory = {
  id: string;
  load: number;
  isAnomaly: boolean;
  timestamp: string;
};

type PredictionState = 'normal' | 'anomaly' | 'loading' | 'error';

// Mock Scenarios
const scenarios = [
  {
    id: '1',
    name: 'Summer Peak',
    values: { lag1: 15400, lag2: 15200, lag3: 15000, lag24: 15500, lag48: 15300, lag168: 14800, hour: 14, month: 7 },
    prediction: { load: 57084, isAnomaly: true, score: -0.42, confidence: 0.95 },
  },
  {
    id: '2',
    name: 'Normal Weekday',
    values: { lag1: 14200, lag2: 14150, lag3: 14100, lag24: 14050, lag48: 14000, lag168: 13900, hour: 11, month: 4 },
    prediction: { load: 52327, isAnomaly: false, score: 0.18, confidence: 0.95 },
  },
  {
    id: '3',
    name: 'Winter Night',
    values: { lag1: 11000, lag2: 11200, lag3: 11500, lag24: 11100, lag48: 11300, lag168: 11000, hour: 3, month: 1 },
    prediction: { load: 48750, isAnomaly: false, score: 0.09, confidence: 0.95 },
  },
  {
    id: '4',
    name: 'Anomaly Injection',
    values: { lag1: 10000, lag2: 25000, lag3: 11500, lag24: 12000, lag48: 11800, lag168: 12100, hour: 12, month: 5 },
    prediction: { load: 61200, isAnomaly: true, score: -0.55, confidence: 0.95 },
  },
];

export default function App() {
  const [activeScenario, setActiveScenario] = useState('1');
  const [predictionState, setPredictionState] = useState<PredictionState>('normal');
  const [history, setHistory] = useState<PredictionHistory[]>([]);
  const [animatedLoad, setAnimatedLoad] = useState(0);
  const [manualInputs, setManualInputs] = useState({
    lag1: '15400', lag2: '15200', lag3: '15000',
    lag24: '15500', lag48: '15300', lag168: '14800',
    hour: '14', month: '7', dayOfWeek: '1', isWeekend: '0'
  });
  const [chartData, setChartData] = useState<any[]>([]);

  const handleScenarioChange = (id: string) => {
    setActiveScenario(id);
    const scenario = scenarios.find(s => s.id === id);
    if (scenario) {
      setManualInputs({
        lag1: scenario.values.lag1.toString(),
        lag2: scenario.values.lag2.toString(),
        lag3: scenario.values.lag3.toString(),
        lag24: scenario.values.lag24.toString(),
        lag48: scenario.values.lag48.toString(),
        lag168: scenario.values.lag168.toString(),
        hour: scenario.values.hour.toString(),
        month: scenario.values.month.toString(),
        dayOfWeek: '1',
        isWeekend: '0'
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setManualInputs({ ...manualInputs, [e.target.name]: e.target.value });
  };

  const runForecast = async () => {
    const scenario = scenarios.find(s => s.id === activeScenario);
    if (!scenario) return;

    // Parse all inputs — use scenario defaults if field is empty
    const lag1 = parseFloat(manualInputs.lag1) || scenario.values.lag1;
    const lag2 = parseFloat(manualInputs.lag2) || scenario.values.lag2;
    const lag3 = parseFloat(manualInputs.lag3) || scenario.values.lag3;
    const lag24 = parseFloat(manualInputs.lag24) || scenario.values.lag24;
    const lag48 = parseFloat(manualInputs.lag48) || scenario.values.lag48;
    const lag168 = parseFloat(manualInputs.lag168) || scenario.values.lag168;
    const hour = parseInt(manualInputs.hour) || scenario.values.hour;
    const month = parseInt(manualInputs.month) || scenario.values.month;
    const dayofweek = parseInt(manualInputs.dayOfWeek);
    const is_weekend = parseInt(manualInputs.isWeekend);

    // Build the exact payload matching FastAPI's PredictionRequest schema
    const payload = {
      timestamp: new Date().toISOString(),
      lag_1_hour: lag1,
      lag_2_hour: lag2,
      lag_3_hour: lag3,
      lag_24_hour: lag24,
      lag_48_hour: lag48,
      lag_168_hour: lag168,
      rolling_mean_24h: Math.round((lag1 + lag2 + lag3) / 3),
      rolling_std_24h: 1200,
      rolling_mean_7d: Math.round((lag24 + lag48 + lag168) / 3),
      hour: hour,
      dayofweek: dayofweek,
      quarter: Math.ceil(month / 3),
      month: month,
      year: 2024,
      dayofyear: Math.min(365, month * 30 + 15),
      is_weekend: is_weekend,
    };

    setPredictionState('loading');

    try {
      const res = await axios.post('http://127.0.0.1:8000/predict', payload);
      const data = res.data;

      const prediction = {
        load: Math.round(data.predicted_load_mw),
        isAnomaly: data.is_anomaly,
        score: data.anomaly_score,
        confidence: 0.95,
      };

      setPredictionState(prediction.isAnomaly ? 'anomaly' : 'normal');

      const newHistory: PredictionHistory = {
        id: Date.now().toString(),
        load: prediction.load,
        isAnomaly: prediction.isAnomaly,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setHistory(prev => [newHistory, ...prev].slice(0, 6));
      animateValue(prediction.load);

      setChartData(prev => [...prev, {
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        predicted: prediction.load,
        scenario: scenario.name,
        isAnomaly: prediction.isAnomaly,
      }]);

    } catch (err) {
      // Fallback: use scenario's hardcoded mock prediction when backend is offline
      console.warn('Backend offline — using scenario mock data');
      const prediction = scenario.prediction;
      setPredictionState(prediction.isAnomaly ? 'anomaly' : 'normal');

      const newHistory: PredictionHistory = {
        id: Date.now().toString(),
        load: prediction.load,
        isAnomaly: prediction.isAnomaly,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setHistory(prev => [newHistory, ...prev].slice(0, 6));
      animateValue(prediction.load);

      setChartData(prev => [...prev, {
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        predicted: prediction.load,
        scenario: scenario.name,
        isAnomaly: prediction.isAnomaly,
      }]);
    }
  };

  const animateValue = (targetValue: number) => {
    setAnimatedLoad(0);
    const duration = 1000;
    const steps = 30;
    const increment = targetValue / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= targetValue) {
        setAnimatedLoad(targetValue);
        clearInterval(interval);
      } else {
        setAnimatedLoad(Math.floor(current));
      }
    }, duration / steps);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex justify-between items-center border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <Zap className="text-blue-500 w-8 h-8" />
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              GridWatch
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Server className={`w-5 h-5 ${predictionState === 'error' ? 'text-red-500' : 'text-green-500'}`} />
            <span className="text-sm text-neutral-400">
              {predictionState === 'error' ? 'Backend Offline' : 'Backend Connected'}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Controls Panel */}
          <div className="col-span-1 border border-neutral-800 bg-neutral-900/50 rounded-xl p-5 shadow-xl backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ActivityIcon className="w-5 h-5 text-indigo-400" /> Model Configuration
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Scenario Preset</label>
                <div className="flex gap-2">
                  {scenarios.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleScenarioChange(s.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        activeScenario === s.id 
                          ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50' 
                          : 'bg-neutral-800 text-neutral-400 border border-transparent hover:bg-neutral-700'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Lag 1h (MW)", name: "lag1" },
                  { label: "Lag 2h (MW)", name: "lag2" },
                  { label: "Lag 3h (MW)", name: "lag3" },
                  { label: "Lag 24h (MW)", name: "lag24" },
                  { label: "Hour (0-23)", name: "hour" },
                  { label: "Month (1-12)", name: "month" },
                ].map((input) => (
                  <div key={input.name}>
                    <label className="block text-xs text-neutral-400 mb-1">{input.label}</label>
                    <input 
                      type="number"
                      name={input.name}
                      value={(manualInputs as any)[input.name]}
                      onChange={handleInputChange}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={runForecast}
                disabled={predictionState === 'loading'}
                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-3 rounded-lg shadow-lg shadow-blue-900/20 transition-all flex justify-center items-center gap-2"
              >
                {predictionState === 'loading' ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Run Forecast <Zap className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>

          {/* Visualization Area */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`relative overflow-hidden rounded-xl p-6 border ${
                predictionState === 'anomaly' 
                  ? 'bg-red-500/10 border-red-500/50' 
                  : predictionState === 'loading' 
                    ? 'bg-neutral-800/30 border-neutral-700' 
                    : 'bg-emerald-500/10 border-emerald-500/50'
              }`}>
                <div className="absolute top-0 right-0 p-4 opacity-50">
                  {predictionState === 'anomaly' ? <AlertTriangle className="w-12 h-12 text-red-500" /> : <Activity className="w-12 h-12 text-emerald-500" />}
                </div>
                <h3 className="text-neutral-400 text-sm font-medium mb-1">Predicted Load</h3>
                <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                  {animatedLoad.toLocaleString()} <span className="text-lg text-neutral-500">MW</span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  {predictionState === 'anomaly' ? (
                    <span className="text-red-400 flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> Anomaly Detected</span>
                  ) : predictionState === 'error' ? (
                    <span className="text-red-500 flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> Failed to fetch</span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Normal Operation</span>
                  )}
                </div>
              </div>

              {/* History / Recent Activity */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 shadow-xl backdrop-blur-sm">
                <h3 className="text-sm font-medium text-neutral-400 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Recent Forecasts
                </h3>
                <div className="space-y-3">
                  {history.length === 0 ? (
                    <div className="text-center text-sm text-neutral-600 py-4">No forecasts yet</div>
                  ) : history.map((item, i) => (
                    <div key={item.id} className="flex justify-between items-center text-sm border-b border-neutral-800/50 pb-2 last:border-0 last:pb-0">
                      <span className="text-neutral-300">{item.timestamp}</span>
                      <span className="font-mono text-neutral-200">{item.load} MW</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${item.isAnomaly ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                        {item.isAnomaly ? 'Anomaly' : 'Normal'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 shadow-xl backdrop-blur-sm h-[350px]">
              <h3 className="text-sm font-medium text-neutral-400 mb-4">Live Forecast Session</h3>
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-neutral-600 text-sm font-mono">
                  Run a forecast to see predictions appear here
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="time" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#666"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      domain={['auto', 'auto']}
                      tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => [`${value.toLocaleString()} MW`, 'Predicted Load']}
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      name="Predicted Load (MW)"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        return (
                          <circle
                            key={props.index}
                            cx={cx}
                            cy={cy}
                            r={6}
                            fill={payload.isAnomaly ? '#ef4444' : '#22c55e'}
                            stroke={payload.isAnomaly ? '#ef4444' : '#22c55e'}
                          />
                        );
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}