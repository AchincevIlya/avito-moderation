import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/Layout";
import ListPage from "../pages/ListPage/ListPage";
import ItemPage from "../pages/ItemPage/ItemPage";
import StatsPage from "../pages/StatsPage/StatsPage";

// основной роутер приложения
export const createAppRouter = (
  toggleTheme: () => void,
  mode: "light" | "dark"
) =>
  createBrowserRouter([
    {
      path: "/",
      // общий layout со шапкой и темой
      element: <Layout toggleTheme={toggleTheme} mode={mode} />,
      children: [
        { path: "/", element: <ListPage /> },       // список
        { path: "/list", element: <ListPage /> },   // список
        { path: "/item/:id", element: <ItemPage /> }, // детальная
        { path: "/stats", element: <StatsPage /> }, // статистика
      ],
    },
  ]);
