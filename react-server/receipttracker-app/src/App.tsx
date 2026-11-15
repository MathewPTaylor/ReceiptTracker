import { useState, type SubmitEvent, type ChangeEvent } from 'react';
import "./App.css"
import Login from './Login.tsx';
import Home from './Home.tsx';
import Signup from './Signup.tsx';
import Navbar from './components/Navbar.tsx';
import Chatbot from './Chatbot.tsx';
import Analytics from './Analytics.tsx';
import Account from './Account.tsx';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);  // TODO change back to false 
  const [pageNo, setPageNo] = useState(0);
  const home = 0;
  const chatbot = 1;
  const analytics = 2;
  const account = 3;
  
  return (
    <>
      <div style={{display: !isLoggedIn? 'block': 'none'}}>
        <Login onLoginSuccess={(state) => setIsLoggedIn(state)}></Login>
      </div>

      {/* <div style={{display: !isLoggedIn? 'block': 'none'}}>
        <Signup></Signup>
      </div> */}

      <div style={{display: isLoggedIn? 'block': 'none'}}>
        <div style={{display: pageNo === home ? 'block' : 'none'}}>
          <Home></Home>
        </div>
        <div style={{display: pageNo === chatbot ? 'block' : 'none'}}>
          <Chatbot></Chatbot>
        </div>

        <div style={{display: pageNo === analytics ? 'block' : 'none'}}>
          <Analytics></Analytics>
        </div>

        <div style={{display: pageNo === account ? 'block' : 'none'}}>
          <Account></Account>
        </div>

        <Navbar onNavClickFunc={setPageNo} curPageNo={pageNo} ></Navbar>
      </div>
    </>
    );
}

export default App;
