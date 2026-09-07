import React from 'react';
import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudRain, 
  CloudLightning, 
  Snowflake, 
  CloudFog, 
  Droplets, 
  Wind,
  HelpCircle
} from 'lucide-react';

function getWeatherIcon(condition, code) {
  const c = (condition || '').toLowerCase();
  if (c.includes('thunder') || code === 95 || code === 96 || code === 99) {
    return <CloudLightning className="w-6 h-6 text-amber-400" />;
  }
  if (c.includes('snow') || c.includes('ice') || (code >= 71 && code <= 77)) {
    return <Snowflake className="w-6 h-6 text-cyan-300" />;
  }
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower') || (code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return <CloudRain className="w-6 h-6 text-blue-400" />;
  }
  if (c.includes('fog') || code === 45 || code === 48) {
    return <CloudFog className="w-6 h-6 text-slate-400" />;
  }
  if (c.includes('partly') || c.includes('mainly') || code === 1 || code === 2) {
    return <CloudSun className="w-6 h-6 text-amber-300" />;
  }
  if (c.includes('overcast') || c.includes('cloud') || code === 3) {
    return <Cloud className="w-6 h-6 text-slate-400" />;
  }
  if (c.includes('sun') || c.includes('clear') || code === 0) {
    return <Sun className="w-6 h-6 text-amber-400" />;
  }
  return <CloudSun className="w-6 h-6 text-amber-300" />;
}

function formatDate(dateStr) {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  } catch (e) {}
  return dateStr;
}

export default function WeatherForecast({ weatherDays }) {
  if (!weatherDays || weatherDays.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-400 bg-white/[0.02] rounded-2xl border border-white/5">
        No daily forecast data available for display.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 overflow-x-auto pb-1">
      {weatherDays.map((day, idx) => {
        const icon = getWeatherIcon(day.condition, day.weather_code);
        const formattedDate = formatDate(day.date);

        return (
          <div
            key={day.date || idx}
            className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <span className="text-xs font-semibold text-slate-300">
              {formattedDate}
            </span>

            <div className="my-1 transform group-hover:scale-110 transition-transform">
              {icon}
            </div>

            <div className="text-xs font-bold text-white truncate max-w-[120px]" title={day.condition}>
              {day.condition}
            </div>

            {/* Temperatures */}
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className="text-white">
                {day.temperature_max !== null && day.temperature_max !== undefined ? `${Math.round(day.temperature_max)}°` : '--'}
              </span>
              <span className="text-slate-500 font-normal">/</span>
              <span className="text-slate-400">
                {day.temperature_min !== null && day.temperature_min !== undefined ? `${Math.round(day.temperature_min)}°` : '--'}
              </span>
            </div>

            {/* Precipitation & Wind */}
            <div className="w-full pt-2 mt-auto border-t border-white/5 flex items-center justify-around text-[10px] text-slate-400">
              {day.precipitation_probability !== null && day.precipitation_probability !== undefined && (
                <span className="flex items-center gap-0.5 text-blue-300" title="Rain Probability">
                  <Droplets className="w-3 h-3 text-blue-400" />
                  {day.precipitation_probability}%
                </span>
              )}

              {day.wind_speed !== null && day.wind_speed !== undefined && (
                <span className="flex items-center gap-0.5 text-slate-400" title="Wind Speed">
                  <Wind className="w-3 h-3 text-slate-400" />
                  {Math.round(day.wind_speed)}k
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
