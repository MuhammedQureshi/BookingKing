import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import DemoPage from "@/pages/DemoPage";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";

function App() {
  return (
    <div className="App">
      <Toaster position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DemoPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
