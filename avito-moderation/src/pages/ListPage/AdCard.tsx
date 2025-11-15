import {
  Card,
  CardContent,
  Typography,
  CardMedia,
  Box,
  Chip,
  Button,
} from "@mui/material";
import { Link } from "react-router-dom";

type AdItem = {
  id: number;
  title: string;
  price: number;
  category: string;
  createdAt?: string;
  images?: string[];
  status: "pending" | "approved" | "rejected" | "draft";
  priority: "normal" | "urgent";
};

export default function CardItem({ ad }: { ad: AdItem }) {
  const statusLabel = {
    approved: "Одобрено",
    rejected: "Отклонено",
    pending: "Ожидает",
    draft: "Черновик",
  }[ad.status];

  const statusColor =
    ad.status === "approved"
      ? "success"
      : ad.status === "rejected"
      ? "error"
      : ad.status === "pending"
      ? "warning"
      : "default";

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardMedia
        component="img"
        height="160"
        image={ad.images?.[0] || "https://placehold.co/300x200"}
        alt={ad.title}
      />

      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" noWrap>
          {ad.title}
        </Typography>

        <Typography color="text.secondary">{ad.category}</Typography>

        <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>
          {ad.createdAt
            ? new Date(ad.createdAt).toLocaleDateString()
            : "—"}
        </Typography>

        <Typography fontWeight="bold" sx={{ my: 1 }}>
          {ad.price.toLocaleString()} ₽
        </Typography>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip label={statusLabel} color={statusColor} size="small" />

          <Chip
            label={ad.priority === "urgent" ? "Срочно" : "Обычное"}
            size="small"
            sx={{
              backgroundColor:
                ad.priority === "urgent" ? "#ff9800" : "#e0e0e0",
              color: ad.priority === "urgent" ? "#fff" : "#000",
              fontWeight: "bold",
            }}
          />
        </Box>
      </CardContent>

      <Button
        component={Link}
        to={`/item/${ad.id}`}
        sx={{ m: 1 }}
        variant="outlined"
      >
        Открыть →
      </Button>
    </Card>
  );
}
