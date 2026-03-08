import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <div className="min-h-screen bg-cm-bg">
      <Routes>
        <Route
          path="/"
          element={
            <div className="flex items-center justify-center h-screen">
              <h1 className="text-4xl font-bold text-cm-cyan">
                CapMan AI
              </h1>
            </div>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
