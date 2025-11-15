import { Link, useParams } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  Chip,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from "@mui/material";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdById,
  approveAd,
  rejectAd,
  requestChangesAd,
} from "../../api/axios";

type ModerationAction = "approved" | "rejected" | "requestChanges";
type AdStatus = "pending" | "approved" | "rejected" | "draft";
type AdPriority = "normal" | "urgent";

type ModerationHistoryItem = {
  id: number;
  moderatorName: string;
  action: ModerationAction;
  reason: string | null;
  comment: string | null;
  timestamp: string;
};

type AdFull = {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  images?: string[];
  status: AdStatus;
  priority: AdPriority;
  seller: {
    name: string;
    rating: string;
    totalAds: number;
    registeredAt: string;
  };
  characteristics: Record<string, string>;
  moderationHistory: ModerationHistoryItem[];
};

const statusLabel = (status: AdStatus) => {
  switch (status) {
    case "approved":
      return "Одобрено";
    case "rejected":
      return "Отклонено";
    case "pending":
      return "Ожидает";
    default:
      return "Черновик";
  }
};

const statusColor = (
  status: AdStatus
): "success" | "error" | "warning" | "default" => {
  switch (status) {
    case "approved":
      return "success";
    case "rejected":
      return "error";
    case "pending":
      return "warning";
    default:
      return "default";
  }
};

const actionLabel = (action: ModerationAction) => {
  switch (action) {
    case "approved":
      return "Одобрено";
    case "rejected":
      return "Отклонено";
    case "requestChanges":
      return "На доработку";
  }
};

const actionColor = (
  action: ModerationAction
): "success" | "error" | "warning" => {
  switch (action) {
    case "approved":
      return "success";
    case "rejected":
      return "error";
    case "requestChanges":
      return "warning";
  }
};

export default function ItemPage() {
  const { id } = useParams();
  const numericId = Number(id);

  const prevId = numericId > 1 ? numericId - 1 : null;
  const nextId = numericId + 1;

  const queryClient = useQueryClient();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectComment, setRejectComment] = useState("");

  const [changesOpen, setChangesOpen] = useState(false);
  const [changesReason, setChangesReason] = useState("");
  const [changesComment, setChangesComment] = useState("");

  // useQuery 
  const {
    data: ad,
    isLoading,
    isError,
  } = useQuery<AdFull>({
    queryKey: ["ad", id],
    queryFn: () => getAdById(numericId),
  });

  const optimisticUpdate = (
    updater: (old: AdFull) => AdFull
  ): { previous: AdFull | undefined } => {
    const previous = queryClient.getQueryData<AdFull>(["ad", id]);

    queryClient.setQueryData<AdFull>(["ad", id], (old) => {
      if (!old) return old as any;
      return updater(old);
    });

    return { previous };
  };

  const rollback = (ctx: any) => {
    if (ctx?.previous) {
      queryClient.setQueryData(["ad", id], ctx.previous);
    }
  };

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["ad", id] });
    queryClient.invalidateQueries({ queryKey: ["ads"] });
  };

  // -одобрить
  const approveMutation = useMutation({
    mutationFn: () => approveAd(numericId),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["ad", id] });

      return optimisticUpdate((old) => ({
        ...old,
        status: "approved",
        moderationHistory: [
          {
            id: Date.now(),
            moderatorName: "Вы",
            action: "approved",
            reason: null,
            comment: null,
            timestamp: new Date().toISOString(),
          },
          ...old.moderationHistory,
        ],
      }));
    },

    onError: rollback,
    onSettled: refetch,
  });

  // отклонить
  const rejectMutation = useMutation({
    mutationFn: (payload: { reason: string; comment?: string }) =>
      rejectAd(numericId, payload),

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["ad", id] });

      return optimisticUpdate((old) => ({
        ...old,
        status: "rejected",
        moderationHistory: [
          {
            id: Date.now(),
            moderatorName: "Вы",
            action: "rejected",
            reason: payload.reason,
            comment: payload.comment || null,
            timestamp: new Date().toISOString(),
          },
          ...old.moderationHistory,
        ],
      }));
    },

    onError: rollback,
    onSettled: () => {
      refetch();
      setRejectOpen(false);
      setRejectReason("");
      setRejectComment("");
    },
  });

  // отправить на доработку
  const changesMutation = useMutation({
    mutationFn: (payload: { reason: string; comment?: string }) =>
      requestChangesAd(numericId, payload),

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["ad", id] });

      return optimisticUpdate((old) => ({
        ...old,
        status: "pending",
        moderationHistory: [
          {
            id: Date.now(),
            moderatorName: "Вы",
            action: "requestChanges",
            reason: payload.reason,
            comment: payload.comment || null,
            timestamp: new Date().toISOString(),
          },
          ...old.moderationHistory,
        ],
      }));
    },

    onError: rollback,
    onSettled: () => {
      refetch();
      setChangesOpen(false);
      setChangesReason("");
      setChangesComment("");
    },
  });

  const moderationStats = useMemo(() => {
    if (!ad) return null;

    return {
      total: ad.moderationHistory.length,
      approved: ad.moderationHistory.filter((x) => x.action === "approved")
        .length,
      rejected: ad.moderationHistory.filter((x) => x.action === "rejected")
        .length,
      changes: ad.moderationHistory.filter(
        (x) => x.action === "requestChanges"
      ).length,
      last: ad.moderationHistory[0]?.timestamp,
    };
  }, [ad]);

  const groupedHistory = useMemo(() => {
    if (!ad) return {};
    const groups: Record<string, ModerationHistoryItem[]> = {};

    for (const item of ad.moderationHistory) {
      const date = new Date(item.timestamp).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    }

    return groups;
  }, [ad]);

  const canApprove = ad?.status !== "approved";
  const canReject = ad?.status !== "rejected";
  const canChanges = true;

  // Горячие клавиши
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "a":
          if (canApprove) approveMutation.mutate();
          break;

        case "d":
          if (canReject) setRejectOpen(true);
          break;

        case "r":
          if (canChanges) setChangesOpen(true);
          break;

        case "arrowleft":
          if (prevId) window.location.href = `/item/${prevId}`;
          break;

        case "arrowright":
          window.location.href = `/item/${nextId}`;
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [canApprove, canReject, canChanges, prevId, nextId]);

  if (isLoading) {
    return (
      <Grid container justifyContent="center" sx={{ mt: 4 }}>
        <CircularProgress />
      </Grid>
    );
  }

  if (isError || !ad) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        Ошибка загрузки объявления
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", mt: 3 }}>
      {/* Навигация */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Button component={Link} to="/list" variant="outlined">
          ← К списку
        </Button>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            sx={{ minWidth: 100 }}
            component={Link}
            to={prevId ? `/item/${prevId}` : "#"}
            disabled={!prevId}
            variant="outlined"
            size="small"
          >
            ◀ Пред
          </Button>

          <Button
            sx={{ minWidth: 100 }}
            component={Link}
            to={`/item/${nextId}`}
            variant="outlined"
            size="small"
          >
            След ▶
          </Button>
        </Box>
      </Box>

      <Typography variant="h4" gutterBottom>
        {ad.title}
      </Typography>

      <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2 }}>
        <Chip label={statusLabel(ad.status)} color={statusColor(ad.status)} />
        <Chip
          label={ad.priority === "urgent" ? "Срочно" : "Обычное"}
          sx={{
            backgroundColor: ad.priority === "urgent" ? "#ff9800" : "#e0e0e0",
            color: ad.priority === "urgent" ? "#fff" : "#000",
            fontWeight: "bold",
          }}
        />
      </Box>

      <Grid container spacing={2}>
        {ad.images?.map((img, idx) => (
          <Grid size = {{xs: 12, sm: 4}} key={idx}>
            <Card>
              <CardMedia component="img" height="160" image={img} />
            </Card>
          </Grid>
        ))}

        {!ad.images?.length && (
          <Grid size = {{xs: 12}}>
            <Card>
              <CardMedia
                component="img"
                height="200"
                image="https://placehold.co/600x200"
              />
            </Card>
          </Grid>
        )}
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" fontWeight="bold">
        {ad.price.toLocaleString()} ₽
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 1 }}>
        Категория: {ad.category}
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6">Описание</Typography>
      <Typography sx={{ mt: 1 }}>{ad.description}</Typography>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6">Характеристики</Typography>
      <Grid container spacing={1} sx={{ mt: 1 }}>
        {Object.entries(ad.characteristics).map(([key, value]) => (
          <Grid size = {{ xs: 12, sm: 6}} key={key}>
            <Typography>
              <strong>{key}:</strong> {String(value)}
            </Typography>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6">Продавец</Typography>
      <Typography>Имя: {ad.seller.name}</Typography>
      <Typography>Рейтинг: {ad.seller.rating}</Typography>
      <Typography>Всего объявлений: {ad.seller.totalAds}</Typography>
      <Typography>
        На сайте с: {new Date(ad.seller.registeredAt).toLocaleDateString()}
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6">Статистика модерации</Typography>
      <Box sx={{ mt: 1 }}>
        <Typography>Всего действий: {moderationStats?.total}</Typography>
        <Typography>Одобрено: {moderationStats?.approved}</Typography>
        <Typography>Отклонено: {moderationStats?.rejected}</Typography>
        <Typography>На доработку: {moderationStats?.changes}</Typography>
        {moderationStats?.last && (
          <Typography>
            Последнее изменение:{" "}
            {new Date(moderationStats.last).toLocaleString()}
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" sx={{ mb: 1 }}>
        История модерации
      </Typography>

      {ad.moderationHistory.length === 0 ? (
        <Typography>Пока нет действий</Typography>
      ) : (
        Object.entries(groupedHistory).map(([date, items]) => (
          <Box key={date} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {date}
            </Typography>

            {items.map((h) => (
              <Box
                key={h.id}
                sx={{
                  p: 1.5,
                  mb: 1,
                  borderRadius: 1,
                  border: "1px solid",
                  boxShadow: "0px 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.5,
                  }}
                >
                  <Typography variant="subtitle2">
                    {h.moderatorName}
                  </Typography>
                  <Chip
                    size="small"
                    label={actionLabel(h.action)}
                    color={actionColor(h.action)}
                  />
                </Box>

                {h.reason && (
                  <Typography variant="body2">
                    <strong>Причина:</strong> {h.reason}
                  </Typography>
                )}
                {h.comment && (
                  <Typography variant="body2">
                    <strong>Комментарий:</strong> {h.comment}
                  </Typography>
                )}

                <Typography variant="caption" color="text.secondary">
                  {new Date(h.timestamp).toLocaleString()}
                </Typography>
              </Box>
            ))}
          </Box>
        ))
      )}

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" sx={{ mb: 2 }}>
        Действия модератора
      </Typography>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 1 }}>
        <Button
          variant="contained"
          color="success"
          disabled={!canApprove || approveMutation.isPending}
          onClick={() => approveMutation.mutate()}
        >
          Одобрить
        </Button>

        <Button
          variant="contained"
          color="error"
          disabled={!canReject}
          onClick={() => setRejectOpen(true)}
        >
          Отклонить
        </Button>

        <Button
          variant="contained"
          color="warning"
          disabled={!canChanges}
          onClick={() => setChangesOpen(true)}
        >
          На доработку
        </Button>
      </Box>

      {/* окно отклонения */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} fullWidth>
        <DialogTitle>Отклонение объявления</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          <TextField
            select
            label="Причина"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            fullWidth
          >
            <MenuItem value="Запрещенный товар">Запрещенный товар</MenuItem>
            <MenuItem value="Неверная категория">Неверная категория</MenuItem>
            <MenuItem value="Некорректное описание">Некорректное описание</MenuItem>
            <MenuItem value="Проблемы с фото">Проблемы с фото</MenuItem>
            <MenuItem value="Подозрение на мошенничество">
              Подозрение на мошенничество
            </MenuItem>
            <MenuItem value="Другое">Другое</MenuItem>
          </TextField>

          <TextField
            label="Комментарий"
            multiline
            minRows={3}
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            fullWidth
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Отмена</Button>
          <Button
            variant="contained"
            color="error"
            disabled={!rejectReason || rejectMutation.isPending}
            onClick={() =>
              rejectMutation.mutate({
                reason: rejectReason,
                comment: rejectComment,
              })
            }
          >
            Отклонить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Окно отправления на доработку */}
      <Dialog open={changesOpen} onClose={() => setChangesOpen(false)} fullWidth>
        <DialogTitle>Запросить изменения</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          <TextField
            select
            label="Причина"
            value={changesReason}
            onChange={(e) => setChangesReason(e.target.value)}
            fullWidth
          >
            <MenuItem value="Запрещенный товар">Запрещенный товар</MenuItem>
            <MenuItem value="Неверная категория">Неверная категория</MenuItem>
            <MenuItem value="Некорректное описание">Некорректное описание</MenuItem>
            <MenuItem value="Проблемы с фото">Проблемы с фото</MenuItem>
            <MenuItem value="Подозрение на мошенничество">
              Подозрение на мошенничество
            </MenuItem>
            <MenuItem value="Другое">Другое</MenuItem>
          </TextField>

          <TextField
            label="Комментарий"
            multiline
            minRows={3}
            value={changesComment}
            onChange={(e) => setChangesComment(e.target.value)}
            fullWidth
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setChangesOpen(false)}>Отмена</Button>
          <Button
            variant="contained"
            color="warning"
            disabled={!changesReason || changesMutation.isPending}
            onClick={() =>
              changesMutation.mutate({
                reason: changesReason,
                comment: changesComment,
              })
            }
          >
            Отправить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
