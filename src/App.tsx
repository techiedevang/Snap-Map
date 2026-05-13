import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Moon, Sun, Map as MapIcon, User } from 'lucide-react';
import MapHome from './pages/MapHome';
import Profile from './pages/Profile';

import './App.css';

function App() {
  const [isDark, setIsDark] = useState(false);

  // Night Rescue mode automatically turns on after 8 PM
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 20 || hour < 6) {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <BrowserRouter>
      <div className={`app-container ${isDark ? 'dark' : ''}`}>
        <header className="glass top-nav">
          <div className="logo-container">
            <h1>Snap&Map</h1>
          </div>
          <button
            className="theme-toggle"
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle Night Rescue Mode"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<MapHome />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>

        <nav className="glass bottom-nav">
          <Link to="/" className="nav-item">
            <MapIcon size={24} />
            <span>Map</span>
          </Link>
          <Link to="/profile" className="nav-item">
            <User size={24} />
            <span>Profile</span>
          </Link>
        </nav>
      </div>
    </BrowserRouter>
  );
}

export default App;
