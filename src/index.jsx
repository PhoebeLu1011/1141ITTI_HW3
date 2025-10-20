import { createRoot } from 'react-dom/client'
import GithubRepos from "./GithubRepos";
import React from 'react';


function App() {
  return (
    <div style={{ padding: 24 }}>
      <section style={{ marginBottom: 40 }}>
        <GithubRepos username="PhoebeLu1011" />
      </section>

    </div>
  );
}

const el = document.getElementById('root');
createRoot(el).render(<App />); 
