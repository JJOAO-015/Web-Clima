import { useState } from 'react';
import './App.css';

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [marine, setMarine] = useState(null);
  const [loading, setLoading] = useState(false);

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

      timeList.forEach((t, index) => {
        const diff = Math.abs(new Date(t).getTime() - now);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestIndex = index;
        }
      });

      setMarine({
        updatedAt: timeList[bestIndex],
        waveHeight: data?.hourly?.wave_height?.[bestIndex],
        waveDirection: data?.hourly?.wave_direction?.[bestIndex],
        wavePeriod: data?.hourly?.wave_period?.[bestIndex],
        seaSurfaceTemperature: data?.hourly?.sea_surface_temperature?.[bestIndex],
      });
    } catch (error) {
      console.error('Erro ao buscar dados maritimos:', error);
      setMarine(null);
    }
  };

  const fetchWeather = async () => {
    if (!city) return;
    setLoading(true);

    try {
      const apiKey = 'd78d074db4904ce1aa2203348260802';
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&lang=pt`
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

  const marineUpdatedLabel = marine?.updatedAt
    ? new Date(marine.updatedAt).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--';

  return (
    <div
      className="app-container"
      style={{
        background: weather ? getBackgroundStyle(weather.current.uv) : 'linear-gradient(to bottom, #6dd5ed, #2193b0)',
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

        {weather && (
          <div className="weather-info">
            <h2>
              {weather.location.name}, {weather.location.region}
            </h2>

            <div className="cards-grid">
              <section className="info-card current-card">
                <h3>Temperatura atual</h3>

                <div className="temp-container">
                  <img src={weather.current.condition.icon} alt="Icone do tempo" />
                  <span className="temp">{Math.round(weather.current.temp_c)}°C</span>
                </div>

                <p className="condition">{weather.current.condition.text}</p>

                <div className="metric-grid two-cols">
                  <div className="metric-box">
                    <span className="metric-label">Sensacao</span>
                    <strong>{Math.round(weather.current.feelslike_c)}°C</strong>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Indice UV</span>
                    <strong>{weather.current.uv}</strong>
                    <small>{getUVText(weather.current.uv)}</small>
                  </div>
                </div>
              </section>
            {marine?.waveHeight != null && (
              <section className="info-card marine-card">
                <h3>Previsão Marítima</h3>
                <p className="data-source">Fonte: Open-Meteo Marine ({marineUpdatedLabel})</p>

                <div className="metric-grid two-cols">
                  <div className="metric-box">
                    <span className="metric-label">Altura da onda</span>
                    <strong>{marine?.waveHeight ?? '--'} m</strong>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Período da onda</span>
                    <strong>{marine?.wavePeriod ?? '--'} s</strong>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Direçao da onda</span>
                    <strong>
                      {marine?.waveDirection ?? '--'}° {toCompass(marine?.waveDirection)}
                    </strong>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Temp. superfície do mar</span>
                    <strong>{marine?.seaSurfaceTemperature ?? '--'}°C</strong>
                  </div>
                </div>

                <div className="metric-grid one-col compact">
                  <div className="metric-box">
                    <span className="metric-label">Vento local</span>
                    <strong>
                      {Math.round(weather.current.wind_kph)} KM/H ({weather.current.wind_dir})
                    </strong>
                  </div>
                </div>
              </section>
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;