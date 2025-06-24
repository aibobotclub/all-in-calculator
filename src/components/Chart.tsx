import { DailyDetail } from '@/types/calculator';
import { useTranslation } from 'react-i18next';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  TooltipProps,
  Line
} from 'recharts';
import { useState, useEffect } from 'react';

interface ChartProps {
  data: DailyDetail[];
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  const { t } = useTranslation();
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg p-4 transition-all duration-200 transform hover:scale-102">
        <p className="text-sm font-semibold text-gray-700 mb-2 border-b pb-2">
          {t('calculator.chart.day')} {label}
        </p>
        {payload.map((entry, index) => (
          <p
            key={index}
            className="text-sm py-1 flex items-center justify-between"
            style={{ color: entry.color }}
          >
            <span className="font-medium">{t(`calculator.chart.${entry.name}`)}</span>
            <span className="ml-4">{entry.value.toFixed(4)} ANT</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Chart({ data }: ChartProps) {
  const { t } = useTranslation();
  const [visibleLines, setVisibleLines] = useState({
    releaseANT: true,
    reinvestEarnings: true,
    totalDailyANT: true
  });
  const [chartHeight, setChartHeight] = useState(500);

  // 响应式调整图表高度
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) { // sm
        setChartHeight(300);
      } else if (width < 1024) { // md/lg
        setChartHeight(400);
      } else { // xl and above
        setChartHeight(500);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const chartData = data.map(item => ({
    day: item.day,
    releaseANT: item.releaseANT,
    reinvestEarnings: item.reinvestRelease,
    totalDailyANT: item.releaseANT + item.reinvestRelease
  }));

  const handleLegendClick = (dataKey: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  };

  const CustomLegend = () => (
    <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 mb-4 px-2">
      <button
        onClick={() => handleLegendClick('releaseANT')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 transform hover:scale-105 ${
          visibleLines.releaseANT 
            ? 'bg-indigo-100 text-indigo-700 shadow-sm ring-1 ring-indigo-200' 
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
        <span className="text-sm font-medium whitespace-nowrap">{t('calculator.chart.releaseANT')}</span>
      </button>
      <button
        onClick={() => handleLegendClick('reinvestEarnings')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 transform hover:scale-105 ${
          visibleLines.reinvestEarnings 
            ? 'bg-green-100 text-green-700 shadow-sm ring-1 ring-green-200' 
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        <span className="w-3 h-3 rounded-full bg-green-500"></span>
        <span className="text-sm font-medium whitespace-nowrap">{t('calculator.chart.reinvestEarnings')}</span>
      </button>
      <button
        onClick={() => handleLegendClick('totalDailyANT')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 transform hover:scale-105 ${
          visibleLines.totalDailyANT 
            ? 'bg-purple-100 text-purple-700 shadow-sm ring-1 ring-purple-200' 
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        <span className="w-3 h-3 rounded-full bg-purple-500"></span>
        <span className="text-sm font-medium whitespace-nowrap">{t('calculator.chart.totalDailyANT')}</span>
      </button>
    </div>
  );
  
  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-medium text-gray-800 mb-6 text-center">
        {t('calculator.chart.title')}
      </h3>
      <CustomLegend />
      <div className="mt-6 -mx-4 sm:mx-0">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ComposedChart
            data={chartData}
            margin={{
              top: 20,
              right: 15,
              left: 15,
              bottom: 20,
            }}
          >
            <defs>
              <linearGradient id="colorReleaseANT" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorReinvestEarnings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorTotalDaily" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              opacity={0.5}
              vertical={false}
            />
            
            <XAxis
              dataKey="day"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tick={{ fill: '#6b7280' }}
              tickFormatter={(value) => `${t('calculator.chart.day')} ${value}`}
              minTickGap={30}
            />
            
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tick={{ fill: '#6b7280' }}
              tickFormatter={(value) => `${value.toFixed(2)}`}
              width={60}
            />
            
            <Tooltip 
              content={<CustomTooltip />}
              wrapperStyle={{ outline: 'none' }}
            />

            {visibleLines.releaseANT && (
              <Area
                type="monotone"
                dataKey="releaseANT"
                name="releaseANT"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#colorReleaseANT)"
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
              />
            )}
            
            {visibleLines.reinvestEarnings && (
              <Area
                type="monotone"
                dataKey="reinvestEarnings"
                name="reinvestEarnings"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#colorReinvestEarnings)"
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#22c55e' }}
              />
            )}

            {visibleLines.totalDailyANT && (
              <Line
                type="monotone"
                dataKey="totalDailyANT"
                name="totalDailyANT"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#8b5cf6' }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 