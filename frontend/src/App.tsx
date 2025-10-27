import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [health, setHealth] = useState('Checking backend health...');

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealth(data.status || 'Backend status unknown.'))
      .catch(() => setHealth('Failed to connect to backend.'));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI-Powered Document Editor</h1>
        <p>{health}</p>
      </header>
    </div>
  );
}

export default App;
