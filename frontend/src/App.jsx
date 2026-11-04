import { BrowserRouter, Routes, Route } from "react-router-dom";

const HomePage = () => <h1>E-commerce Home Page</h1>;
const ProductsPage = () => <h1>Products Page</h1>;
const LoginPage = () => <h1>Login Page</h1>;

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  </BrowserRouter>
);

export default App;
