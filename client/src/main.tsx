import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Helmet } from "react-helmet";

createRoot(document.getElementById("root")!).render(
  <>
    <Helmet>
      <title>FoodShare - Reduce Food Waste, Share Delicious Meals</title>
      <meta name="description" content="FoodShare connects people with excess food to those seeking affordable meals, reducing food waste one meal at a time." />
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
    </Helmet>
    <App />
  </>
);
