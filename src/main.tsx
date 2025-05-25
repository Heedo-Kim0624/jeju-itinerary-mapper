import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initEventDebugger } from './utils/eventDebugger';

// Initialize the event debugger in development mode
initEventDebugger();

createRoot(document.getElementById("root")!).render(<App />);
