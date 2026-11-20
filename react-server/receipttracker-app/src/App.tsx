import { useState, type SubmitEvent, type ChangeEvent } from 'react';
import "./styles/App.css"
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
      <div className={!isLoggedIn ? 'app-section' : 'app-section app-section--hidden'}>
        <Login onLoginSuccess={(state) => setIsLoggedIn(state)}></Login>
      </div>

      {/* <div className={!isLoggedIn ? 'app-section' : 'app-section app-section--hidden'}>
        <Signup></Signup>
      </div> */}

      <div className={isLoggedIn ? 'app-section' : 'app-section app-section--hidden'}>
        <div className={pageNo === home ? 'app-section' : 'app-section app-section--hidden'}>
          <Home></Home>
        </div>
        <div className={pageNo === chatbot ? 'app-section' : 'app-section app-section--hidden'}>
          <Chatbot></Chatbot>
        </div>

        <div className={pageNo === analytics ? 'app-section' : 'app-section app-section--hidden'}>
          <Analytics></Analytics>
        </div>

        <div className={pageNo === account ? 'app-section' : 'app-section app-section--hidden'}>
          <Account></Account>
        </div>

        <Navbar onNavClickFunc={setPageNo} curPageNo={pageNo} ></Navbar>
      </div>
    </>
    );
}

export default App;
