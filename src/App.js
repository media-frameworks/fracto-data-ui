import logo from './logo.jpg';
import './App.css';

console.log("process.env.NODE_ENV", process.env.NODE_ENV)

function App() {
  return (
     <div className="App">
       <header className="App-header">
         <p>fracto-data</p>
         <img src={logo} className="App-logo" alt="logo" />
       </header>
     </div>
  );
}

export default App;
