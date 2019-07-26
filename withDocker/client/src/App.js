import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';


const { REACT_APP_API = "http://localhost:3001" } = process.env;

function App() {
  const [offTime, setOffTime] = useState("No value");

  const send = async () => {
    const response = await axios.get(REACT_APP_API);
    const { data: { value = "No value responsed" } = {} } = response;
    setOffTime(value);
  }

  useEffect(() => {
    send();
  });

  return (
    <div className="App">
      <header className="App-header">
        <div>{offTime}</div>
        <button onClick={() => send()}>Force Update</button>
      </header>
    </div>
  );
}

export default App;
