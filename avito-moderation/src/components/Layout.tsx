import { Link, Outlet, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
} from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

interface LayoutProps {
  toggleTheme: () => void;
  mode: "light" | "dark";
}

// layout c навигацией и переключателем темы 
export default function Layout({ toggleTheme, mode }: LayoutProps) {
  const location = useLocation();

  const isActive = (path: string): boolean => location.pathname === path;

  return (
    <Box>
      {/* Верхняя панель */}
      <AppBar position="fixed" color="primary" sx={{ px: 2 }}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Avito Moderation
          </Typography>

          {/* Пункт "Список" */}
          <Button
            component={Link}
            to="/list"
            sx={(theme) => ({
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "10px",
              px: 2,
              py: 0.7,

              color: isActive("/list")
                ? theme.palette.mode === "light"
                  ? "#fff"
                  : "#000"
                : theme.palette.text.primary,

              backgroundColor: isActive("/list")
                ? theme.palette.mode === "light"
                  ? "rgba(255,255,255,0.25)"
                  : "rgba(255,255,255,0.2)"
                : "transparent",

              "&:hover": {
                backgroundColor: isActive("/list")
                  ? theme.palette.mode === "light"
                    ? "rgba(255,255,255,0.35)"
                    : "rgba(255,255,255,0.3)"
                  : theme.palette.action.hover,
              },
            })}
          >
            СПИСОК
          </Button>
          
          {/* Пункт "Статистика" */}
          <Button
            component={Link}
            to="/stats"
            sx={(theme) => ({
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "10px",
              px: 2,
              py: 0.7,

              color: isActive("/stats")
                ? theme.palette.mode === "light"
                  ? "#fff"
                  : "#000"
                : theme.palette.text.primary,

              backgroundColor: isActive("/stats")
                ? theme.palette.mode === "light"
                  ? "rgba(255,255,255,0.25)"
                  : "rgba(255,255,255,0.2)"
                : "transparent",

              "&:hover": {
                backgroundColor: isActive("/stats")
                  ? theme.palette.mode === "light"
                    ? "rgba(255,255,255,0.35)"
                    : "rgba(255,255,255,0.3)"
                  : theme.palette.action.hover,
              },
            })}
          >
            СТАТИСТИКА
          </Button>
          
          {/* Переключатель темы */}
          <IconButton color="inherit" onClick={toggleTheme}>
            {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      
      {/* Контент страниц */}
      <Box sx={{ mt: 10, p: 2 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
