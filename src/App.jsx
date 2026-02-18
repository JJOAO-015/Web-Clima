import { useState } from 'react';
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
        `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=3&lang=pt`
      );
      const data = await response.json();

      if (data.error) {
        alert('Cidade nao encontrada!');
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
    if (!uv && uv !== 0) return 'linear-gradient(to bottom, #6dd5ed, #2193b0)';
    if (uv <= 2) return 'linear-gradient(to bottom, #a8ff78, #78ffd6)';
    if (uv <= 5) return 'linear-gradient(to bottom, #fffc00, #ffffff)';
    if (uv <= 7) return 'linear-gradient(to bottom, #ff9966, #ff5e62)';
    if (uv <= 10) return 'linear-gradient(to bottom, #cb2d3e, #ef473a)';
    return 'linear-gradient(to bottom, #8e2de2, #4a00e0)';
  };

  const getUVText = (uv) => {
    if (uv <= 2) return 'Baixo 😀';
    if (uv <= 5) return 'Moderado 🙂';
    if (uv <= 7) return 'Alto 😐';
    if (uv <= 10) return 'Muito alto 😟';
    return 'Extremo 🥵';
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
            windDir: '',
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
            label: 'Temperatura atual',
            temp: weather.current.temp_c,
            condition: weather.current.condition.text,
            icon: weather.current.condition.icon,
            wind: weather.current.wind_kph,
            windDir: `(${weather.current.wind_dir})`,
            uv: weather.current.uv,
            feelsLike: weather.current.feelslike_c,
           
            marine: marine?.current ? {
                height: marine.current.waveHeight,
                period: marine.current.wavePeriod,
                direction: marine.current.waveDirection,
                temp: marine.current.seaSurfaceTemperature,
                updatedAt: marine.current.updatedAt 
            } : null
        };
    }
  }

  return (
    <div
      className="app-container"
      style={{
        background: displayData ? getBackgroundStyle(displayData.uv) : 'linear-gradient(to bottom, #6dd5ed, #2193b0)',
        transition: 'background 1s ease',
      }}
    >
      <div className="card">
        <h1>Clima & UV</h1>

        <div className="search-box">
          <input
            type="text"
            placeholder="Digite a cidade (ex: Salvador)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchWeather()}
          />
          <button onClick={fetchWeather} disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {weather && displayData && (
          <div className="weather-info">
            
            <div className="location-header">
                <h2>{weather.location.name}, {weather.location.region}</h2>
                {selectedDay && (
                    <button className="back-btn" onClick={() => setSelectedDay(null)}>
                        Voltar para Agora
                    </button>
                )}
            </div>

            <div className="cards-grid">
              

              <section className="info-card current-card">
                <h3>{displayData.label}</h3>

                <div className="temp-container">
                  <img src={displayData.icon} alt="Icone do tempo" />
                  <span className="temp">{Math.round(displayData.temp)}°C</span>
                </div>

                <p className="condition">{displayData.condition}</p>

                {displayData.isForecast && (
                   <div className="min-max-display">
                      <span className="min">Min: {Math.round(displayData.min)}°</span> • 
                      <span className="max"> Max: {Math.round(displayData.max)}°</span>
                   </div>
                )}

                <div className="metric-grid two-cols">
                  {!displayData.isForecast && (
                    <div className="metric-box">
                        <span className="metric-label">Sensacao</span>
                        <strong>{Math.round(displayData.feelsLike)}°C</strong>
                    </div>
                  )}

                  <div className="metric-box">
                    <span className="metric-label">Indice UV</span>
                    <strong>{displayData.uv}</strong>
                    <small>{getUVText(displayData.uv)}</small>
                  </div>

                   {displayData.isForecast && (
                    <div className="metric-box">
                        <span className="metric-label">Chuva</span>
                        <strong>{displayData.rain}%</strong>
                    </div>
                   )}
                </div>

                <div className="metric-grid one-col compact">
                  <div className="metric-box">
                    <span className="metric-label">Vento</span>
                    <strong>
                      {Math.round(displayData.wind)} KM/H {displayData.windDir}
                    </strong>
                  </div>
                </div>
              </section>

             
              {displayData.marine && displayData.marine.height != null && (
                <section className="info-card marine-card">
                  <h3>
                     {displayData.isForecast ? 'Previsão Marítima' : 'Marítimo (Agora)'}
                  </h3>
                  
                  
                  {!displayData.isForecast && displayData.marine.updatedAt && (
                      <p className="data-source">
                          Atualizado: {new Date(displayData.marine.updatedAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                      </p>
                  )}

                  <div className="metric-grid two-cols">
                    <div className="metric-box">
                      <span className="metric-label">Altura da onda</span>
                      <strong>{displayData.marine.height ?? '--'} m</strong>
                    </div>
                    <div className="metric-box">
                      <span className="metric-label">Período</span>
                      <strong>{displayData.marine.period ?? '--'} s</strong>
                    </div>
                    <div className="metric-box">
                      <span className="metric-label">Direçao</span>
                      <strong>
                        {displayData.marine.direction ?? '--'}° {toCompass(displayData.marine.direction)}
                      </strong>
                    </div>
                    <div className="metric-box">
                      <span className="metric-label">Temp. Água</span>
                      <strong>{displayData.marine.temp ?? '--'}°C</strong>
                    </div>
                  </div>
                </section>
              )}
            </div>

           
            {weather.forecast && (
              <div className="forecast-section">
                <h3>Próximos Dias</h3>
                <div className="forecast-row">
                  {weather.forecast.forecastday.map((day) => {
                    const isSelected = selectedDay && selectedDay.date === day.date;
                    return (
                        <div 
                            key={day.date} 
                            className={`day-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => setSelectedDay(day)}
                        >
                            <span className="day-name">{formatDay(day.date)}</span>
                            <img src={day.day.condition.icon} alt="icone" className="day-icon" />
                            <div className="day-temps">
                                <span className="max">{Math.round(day.day.maxtemp_c)}°</span>
                                <span className="min">{Math.round(day.day.mintemp_c)}°</span>
                            </div>
                            <div className="mini-stats">
                                <span className="rain-chance">☔ {day.day.daily_chance_of_rain}%</span>
                                <span className="uv-mini">☀️ UV: {day.day.uv}</span>
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