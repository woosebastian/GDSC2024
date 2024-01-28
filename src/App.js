// https://www.youtube.com/watch?v=b9eMGE7QtTk

import { useEffect } from 'react';

import './App.css';

const App = () => {
    useEffect(() => {

    }, []);

    return (
        <div className="app">
            <h1 className="title">Course Planner</h1>
            <a className="signInButton" href="https://www.google.com/">
                <div className="logIn">
                    {/* https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML/Creating_hyperlinks */}
                    {/* <button className="signInButton"> */}
                    Sign in with Google
                    {/* </button> */}
                </div>
            </a>
        </div>
    );
}

export default App;