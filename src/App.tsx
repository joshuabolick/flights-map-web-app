import FlightMap from './components/FlightMap'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Real-Time Flight Tracker</h1>
      </header>
      <main>
        <FlightMap />
      </main>
    </div>
  )
}

export default App
