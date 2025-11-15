import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  useTheme,
} from "@mui/material";

import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import {
  getStatsSummary,
  getActivityChart,
  getDecisionsChart,
  getCategoriesChart,
} from "../../api/axios";

export default function StatsPage() {
  const theme = useTheme();

  // --- PieChart label ---
  const renderPieLabel = (props: any) => {
    const { percent, x, y, fill } = props;
    const value = Math.round(percent * 100);

    if (value === 0) return null;

    return (
      <text
        x={x}
        y={y}
        fill={fill}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={15}
        fontWeight={600}
      >
        {value}%
      </text>
    );
  };

  // --- Queries ---
  const summaryQuery = useQuery({
    queryKey: ["stats-summary"],
    queryFn: getStatsSummary,
  });

  const activityQuery = useQuery({
    queryKey: ["stats-activity"],
    queryFn: getActivityChart,
  });

  const decisionsQuery = useQuery({
    queryKey: ["stats-decisions"],
    queryFn: getDecisionsChart,
  });

  const categoriesQuery = useQuery({
    queryKey: ["stats-categories"],
    queryFn: getCategoriesChart,
  });

  const loading =
    summaryQuery.isLoading ||
    activityQuery.isLoading ||
    decisionsQuery.isLoading ||
    categoriesQuery.isLoading;

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  const error =
    summaryQuery.isError ||
    activityQuery.isError ||
    decisionsQuery.isError ||
    categoriesQuery.isError;

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        Ошибка загрузки статистики
      </Alert>
    );
  }


  const summary = summaryQuery.data;
  const activity = activityQuery.data || [];
  const decisions = decisionsQuery.data;
  const categoriesRaw = categoriesQuery.data;

  const categories = Object.entries(categoriesRaw).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Статистика модератора
      </Typography>

      {/* Общая статистика */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" fontWeight={600}>
          Общая статистика
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          <StatCard title="Всего обработано" value={summary.totalReviewed} />
          <StatCard title="Сегодня" value={summary.totalReviewedToday} />
          <StatCard title="За неделю" value={summary.totalReviewedThisWeek} />
          <StatCard title="За месяц" value={summary.totalReviewedThisMonth} />
        </Box>
      </Paper>

      {/* График активности по дням */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" fontWeight={600}>
          Активность по дням
        </Typography>
        <Divider sx={{ my: 2 }} />

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={activity}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />

            <Line
              type="monotone"
              dataKey="approved"
              name="Одобрено"
              stroke="#4caf50"
              strokeWidth={2}
            />

            <Line
              type="monotone"
              dataKey="rejected"
              name="Отклонено"
              stroke="#f44336"
              strokeWidth={2}
            />

            <Line
              type="monotone"
              dataKey="requestChanges"
              name="На доработку"
              stroke="#ff9800"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* Диаграмма распределение решений */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" fontWeight={600}>
          Распределение решений
        </Typography>
        <Divider sx={{ my: 2 }} />

        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Tooltip />
            <Pie
              data={[
                { name: "Одобрено", value: decisions.approved, fill: "#4caf50" },
                { name: "Отклонено", value: decisions.rejected, fill: "#f44336" },
                { name: "На доработку", value: decisions.requestChanges, fill: "#ff9800" },
              ]}
              cx="50%"
              cy="50%"
              outerRadius={110}
              dataKey="value"
              labelLine={false}
              label={renderPieLabel}
            />
          </PieChart>
        </ResponsiveContainer>
      </Paper>

      {/* График категорий  */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" fontWeight={600}>
          Категории
        </Typography>
        <Divider sx={{ my: 2 }} />

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categories}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill={theme.palette.primary.main} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Paper
      sx={{
        p: 2,
        width: 250,
        textAlign: "center",
        borderRadius: 2,
      }}
    >
      <Typography color="text.secondary">{title}</Typography>
      <Typography variant="h5" fontWeight={700}>
        {value}
      </Typography>
    </Paper>
  );
}
