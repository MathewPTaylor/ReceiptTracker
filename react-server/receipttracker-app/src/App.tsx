import { useState, type SubmitEvent, type ChangeEvent } from 'react';
import "./App.css"
import Login from './Login.tsx';
import Home from './Home.tsx';



function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);  // TODO change back to false 
  return (
    <>
      <div style={{display: !isLoggedIn? 'block': 'none'}}>
        <Login onLoginSuccess={(state) => setIsLoggedIn(state)}></Login>
      </div>

      <div style={{display: isLoggedIn? 'block': 'none'}}>
        <Home></Home>
      </div>
    </>
    );
}

export default App;