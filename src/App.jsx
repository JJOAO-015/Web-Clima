import { useState } from 'react';
import './App.css';

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);

 
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
        alert("Cidade não encontrada!");
        setWeather(null);
      } else {
        setWeather(data);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBackgroundStyle = (uv) => {
    if (!uv && uv !== 0) return 'linear-gradient(to bottom, #6dd5ed, #2193b0)'; // Padrão (Azul céu)

    if (uv <= 2) return 'linear-gradient(to bottom, #a8ff78, #78ffd6)'; // Baixo (Verde/Ciano)
    if (uv <= 5) return 'linear-gradient(to bottom, #fffc00, #ffffff)'; // Moderado (Amarelo)
    if (uv <= 7) return 'linear-gradient(to bottom, #ff9966, #ff5e62)'; // Alto (Laranja)
    if (uv <= 10) return 'linear-gradient(to bottom, #cb2d3e, #ef473a)'; // Muito Alto (Vermelho)
    return 'linear-gradient(to bottom, #8E2DE2, #4A00E0)'; // Extremo (Roxo)
  };

  const getUVText = (uv) => {
    if (uv <= 2) return "Baixo";
    if (uv <= 5) return "Moderado";
    if (uv <= 7) return "Alto";
    if (uv <= 10) return "Muito Alto";
    return "Extremo";
  };

  return (
    <div 
      className="app-container"
      style={{ 
        background: weather ? getBackgroundStyle(weather.current.uv) : 'linear-gradient(to bottom, #6dd5ed, #2193b0)',
        transition: 'background 1s ease' 
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
            onKeyPress={(e) => e.key === 'Enter' && fetchWeather()}
          />
          <button onClick={fetchWeather} disabled={loading}>
            {loading ? '...' : 'Buscar'}
          </button>
        </div>

        {weather && (
          <div className="weather-info">
            <h2>{weather.location.name}, {weather.location.region}</h2>
            <div className="temp-container">
              <img src={weather.current.condition.icon} alt="Ícone do tempo" />
              <span className="temp">{Math.round(weather.current.temp_c)}°C</span>
            </div>
            <p className="condition">{weather.current.condition.text}</p>
            
            <div className="uv-badge">
              <p>Índice UV: <strong>{weather.current.uv}</strong></p>
              <span className="uv-label">Nível: {getUVText(weather.current.uv)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;