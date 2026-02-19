import { useState } from 'react';

import { 
  Search, 
  ArrowLeft, 
  Wind, 
  SunMedium, 
  CloudRain, 
  Waves, 
  ThermometerSun, 
  Loader2 
} from 'lucide-react';
import './App.css';

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [marine, setMarine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  
  const fetchMarineData = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_direction,wave_period,sea_surface_temperature&timezone=auto`
      );
      const data = await response.json();
      const timeList = data?.hourly?.time ?? [];

      if (!timeList.length) {
        setMarine(null);
        return;
      }

      const now = Date.now();
      let bestIndex = 0;
      let bestDiff = Infinity;
      const dailyMap = {};

      timeList.forEach((t, index) => {
        const timeMs = new Date(t).getTime();
        const diff = Math.abs(timeMs - now);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestIndex = index;
        }

        if (t.includes('T12:00')) {
            const dateKey = t.split('T')[0];
            dailyMap[dateKey] = {
                waveHeight: data?.hourly?.wave_height?.[index],
                waveDirection: data?.hourly?.wave_direction?.[index],
                wavePeriod: data?.hourly?.wave_period?.[index],
                seaSurfaceTemperature: data?.hourly?.sea_surface_temperature?.[index],
            };
        }
      });

      setMarine({
        current: {
            updatedAt: timeList[bestIndex],
            waveHeight: data?.hourly?.wave_height?.[bestIndex],
            waveDirection: data?.hourly?.wave_direction?.[bestIndex],
            wavePeriod: data?.hourly?.wave_period?.[bestIndex],
            seaSurfaceTemperature: data?.hourly?.sea_surface_temperature?.[bestIndex],
        },
        daily: dailyMap
      });

    } catch (error) {
      console.error('Erro ao buscar dados maritimos:', error);
      setMarine(null);
    }
  };

  const fetchWeather = async () => {
    if (!city) return;
    setLoading(true);
    setSelectedDay(null);

    try {
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
      const response = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=4&lang=pt`
      );
      const data = await response.json();

      if (data.error) {
        alert('Cidade não encontrada!');
        setWeather(null);
        setMarine(null);
      } else {
        setWeather(data);
        await fetchMarineData(data.location.lat, data.location.lon);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBackgroundStyle = (uv) => {
    if (!uv && uv !== 0) return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    if (uv <= 2) return 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
    if (uv <= 5) return 'linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)';
    if (uv <= 7) return 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)';
    if (uv <= 10) return 'linear-gradient(135deg, #cb2d3e 0%, #ef473a 100%)';
    return 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)';
  };

  const getUVText = (uv) => {
    if (uv <= 2) return 'Baixo';
    if (uv <= 5) return 'Moderado';
    if (uv <= 7) return 'Alto';
    if (uv <= 10) return 'Muito Alto';
    return 'Extremo';
  };

  const toCompass = (deg) => {
    if (deg === undefined || deg === null) return '--';
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    return dirs[Math.round(deg / 45) % 8];
  };

  const formatDay = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
  };

  let displayData = null;

  if (weather) {
    if (selectedDay) {
        const dateKey = selectedDay.date;
        const marineForDay = marine?.daily?.[dateKey];
        displayData = {
            isForecast: true,
            label: formatDay(selectedDay.date),
            temp: selectedDay.day.avgtemp_c,
            condition: selectedDay.day.condition.text,
            icon: selectedDay.day.condition.icon,
            wind: selectedDay.day.maxwind_kph,
            uv: selectedDay.day.uv,
            min: selectedDay.day.mintemp_c,
            max: selectedDay.day.maxtemp_c,
            rain: selectedDay.day.daily_chance_of_rain,
            marine: marineForDay ? {
                height: marineForDay.waveHeight,
                period: marineForDay.wavePeriod,
                direction: marineForDay.waveDirection,
                temp: marineForDay.seaSurfaceTemperature
            } : null
        };
    } else {
        displayData = {
            isForecast: false,
            label: 'Hoje',
            temp: weather.current.temp_c,
            condition: weather.current.condition.text,
            icon: weather.current.condition.icon,
            wind: weather.current.wind_kph,
            uv: weather.current.uv,
            feelsLike: weather.current.feelslike_c,
            min: null, max: null, rain: null,
            marine: marine?.current ? {
                height: marine.current.waveHeight,
                period: marine.current.wavePeriod,
                direction: marine.current.waveDirection,
                temp: marine.current.seaSurfaceTemperature,
            } : null
        };
    }
  }

  return (
    <div
      className="app-container"
      style={{
        background: displayData ? getBackgroundStyle(displayData.uv) : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      }}
    >
      <div className="dashboard">
        
        <div className="header-search">
          <input
            type="text"
            placeholder="Buscar cidade..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchWeather()}
            className="search-input glass-panel"
          />
         
          <button onClick={fetchWeather} disabled={loading} className="search-btn glass-panel">
            {loading ? <Loader2 className="spin-icon" size={20} /> : <Search size={20} />}
          </button>
        </div>

        {weather && displayData && (
          <div className="dashboard-content">
            
            <div className="main-weather-section">
              <div className="location-info">
                <h2>{weather.location.name}</h2>
                <p>{weather.location.region} • {displayData.label}</p>
                {selectedDay && (
            
                    <button className="back-btn glass-panel icon-flex" onClick={() => setSelectedDay(null)}>
                        <ArrowLeft size={16} /> Voltar para o tempo real
                    </button>
                )}
              </div>

              <div className="big-temp-display">
                <img src={displayData.icon} alt="Icone" className="huge-icon" />
                <h1 className="huge-temp">{Math.round(displayData.temp)}°</h1>
              </div>
              <h3 className="condition-text">{displayData.condition}</h3>
              
              {displayData.isForecast && (
                <div className="min-max-pill glass-panel">
                    Máx: {Math.round(displayData.max)}° • Mín: {Math.round(displayData.min)}°
                </div>
              )}
            </div>

            <div className="details-grid">
              
              {!displayData.isForecast && (
                <div className="widget glass-panel">
                  
                  <span className="widget-title icon-flex"><ThermometerSun size={16} /> Sensação</span>
                  <span className="widget-value">{Math.round(displayData.feelsLike)}°</span>
                </div>
              )}

              <div className="widget glass-panel">
                <span className="widget-title icon-flex"><Wind size={16} /> Vento</span>
                <span className="widget-value">{Math.round(displayData.wind)} <small>km/h</small></span>
              </div>

              <div className="widget glass-panel highlight-uv">
                <span className="widget-title icon-flex"><SunMedium size={16} /> Índice UV</span>
                <span className="widget-value">{displayData.uv}</span>
                <span className="widget-subtitle">{getUVText(displayData.uv)}</span>
              </div>

              {displayData.isForecast && (
                <div className="widget glass-panel">
                  <span className="widget-title icon-flex"><CloudRain size={16} /> Chuva</span>
                  <span className="widget-value">{displayData.rain}%</span>
                </div>
              )}
            </div>

            {displayData.marine && displayData.marine.height != null && (
              <div className="marine-panel glass-panel full-width">
               
                <h4 className="icon-flex">
                  <Waves size={20} /> {displayData.isForecast ? 'Previsão Marítima' : 'Condições Marítimas'}
                </h4>
                <div className="marine-grid">
                  <div className="marine-item">
                    <span>Ondas</span>
                    <strong>{displayData.marine.height ?? '--'} m</strong>
                  </div>
                  <div className="marine-item">
                    <span>Período</span>
                    <strong>{displayData.marine.period ?? '--'} s</strong>
                  </div>
                  <div className="marine-item">
                    <span>Direção</span>
                    <strong>{displayData.marine.direction ?? '--'}° {toCompass(displayData.marine.direction)}</strong>
                  </div>
                  <div className="marine-item">
                    <span>Água</span>
                    <strong>{displayData.marine.temp ?? '--'}°C</strong>
                  </div>
                </div>
              </div>
            )}

            {weather.forecast && (
              <div className="weekly-forecast full-width">
                <div className="forecast-row">
                  {weather.forecast.forecastday.map((day, index) => {
                    if (index === 0) return null;
                    const isSelected = selectedDay && selectedDay.date === day.date;
                    return (
                        <div 
                            key={day.date} 
                            className={`forecast-card glass-panel ${isSelected ? 'active' : ''}`}
                            onClick={() => setSelectedDay(day)}
                        >
                            <span className="day-name">{formatDay(day.date)}</span>
                            <img src={day.day.condition.icon} alt="icone" />
                            <div className="day-temps">
                                <span className="max">{Math.round(day.day.maxtemp_c)}°</span>
                                <span className="min">{Math.round(day.day.mintemp_c)}°</span>
                            </div>
                            <div className="day-mini-data">
                                
                                <span className="icon-flex"><CloudRain size={14} /> {day.day.daily_chance_of_rain}%</span>
                                <span className="icon-flex"><SunMedium size={14} /> {day.day.uv}</span>
                            </div>
                        </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

export default App;