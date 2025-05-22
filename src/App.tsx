import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PlaceProvider } from './contexts/PlaceContext'; // Import the provider
import MainPage from './pages/MainPage'; // Assuming you have a MainPage or similar

function App() {
  return (
    <PlaceProvider> {/* Wrap your application with PlaceProvider */}
      <Router>
        {/* Other global providers like ThemeProvider, AuthProvider can go here */}
        <div className="flex flex-col min-h-screen">
          {/* <Header /> */}
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<MainPage />} />
              {/* Define other routes here */}
            </Routes>
          </main>
          {/* <Footer /> */}
        </div>
      </Router>
    </PlaceProvider>
  );
}

export default App;
