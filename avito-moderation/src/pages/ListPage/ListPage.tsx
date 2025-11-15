import {
  Typography,
  Alert,
  TextField,
  MenuItem,
  Button,
  Box,
  Pagination,
  Skeleton,
} from "@mui/material";
import { Grid } from "@mui/material";

import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo, useRef } from "react";

import { api } from "../../api/axios";
import CardItem from "./AdCard";

type AdsResponse = {
  ads: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
};

type FiltersState = {
  search: string;
  status: string[];
  category: string;
  sortBy: string;
  sortOrder: string;
  minPrice: string;
  maxPrice: string;
};

export default function ListPage() {
  const [params, setParams] = useSearchParams();
    const searchRef = useRef<HTMLInputElement | null>(null);

  const page = Number(params.get("page") || "1");

  const urlFilters: FiltersState = {
    search: params.get("search") || "",
    status: params.get("status") ? params.get("status")!.split(",") : [],
    category: params.get("category") || "",
    sortBy: params.get("sortBy") || "createdAt",
    sortOrder: params.get("sortOrder") || "desc",
    minPrice: params.get("minPrice") || "",
    maxPrice: params.get("maxPrice") || "",
  };

  const [filters, setFilters] = useState<FiltersState>(urlFilters);

  useEffect(() => {
    setFilters(urlFilters);
  }, [params.toString()]);

  const handleChange = <K extends keyof FiltersState>(
    field: K,
    value: FiltersState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const { data, isLoading, isError } = useQuery<AdsResponse>({
    queryKey: [
      "ads",
      urlFilters.search,
      urlFilters.status.join(","),
      urlFilters.category,
      urlFilters.sortBy,
      urlFilters.sortOrder,
      urlFilters.minPrice,
      urlFilters.maxPrice,
      page,
    ],

    queryFn: async () => {
      const res = await api.get("/ads", {
        params: {
          search: urlFilters.search || undefined,
          status: urlFilters.status.length ? urlFilters.status : undefined,
          category: urlFilters.category || undefined,
          sortBy: urlFilters.sortBy,
          sortOrder: urlFilters.sortOrder,
          minPrice: urlFilters.minPrice || undefined,
          maxPrice: urlFilters.maxPrice || undefined,
          page,
          limit: 10,
        },
      });
      return res.data;
    },
  });

  // категории из полученных объявлений
  const categoriesList = useMemo(() => {
    if (!data?.ads) return [];
    return Array.from(new Set(data.ads.map((a) => a.category)));
  }, [data]);

  const applyFilters = () => {
    const next = new URLSearchParams();

    if (filters.search) next.set("search", filters.search);
    if (filters.status.length) next.set("status", filters.status.join(","));
    if (filters.category) next.set("category", filters.category);
    if (filters.minPrice) next.set("minPrice", filters.minPrice);
    if (filters.maxPrice) next.set("maxPrice", filters.maxPrice);

    if (filters.sortBy && filters.sortBy !== "createdAt") {
      next.set("sortBy", filters.sortBy);
    }
    if (filters.sortOrder && filters.sortOrder !== "desc") {
      next.set("sortOrder", filters.sortOrder);
    }

    next.set("page", "1");
    setParams(next);
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      status: [],
      category: "",
      sortBy: "createdAt",
      sortOrder: "desc",
      minPrice: "",
      maxPrice: "",
    });
    setParams({ page: "1" });
  };

  const changePage = (newPage: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(newPage));
    setParams(next);
  };

    useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---------- LOADING ----------
  if (isLoading) {
    return (
      <>
        <Typography variant="h5" gutterBottom>
          Список объявлений
        </Typography>

        <Grid container spacing={2}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
              <Box
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "1px solid #eee",
                  p: 1,
                }}
              >
                <Skeleton variant="rectangular" height={160} />
                <Box sx={{ p: 1 }}>
                  <Skeleton width="80%" />
                  <Skeleton width="60%" />
                  <Skeleton width="40%" />
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </>
    );
  }

  // ---------- ERROR ----------
  if (isError || !data) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        Ошибка загрузки данных
      </Alert>
    );
  }

  const { ads, pagination } = data;

  // ---------- ПУСТОЙ РЕЗУЛЬТАТ ----------
  if (!ads.length) {
    return (
      <>
        <Typography variant="h5" gutterBottom>
          Список объявлений
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Alert
            severity="info"
            sx={(theme) => ({
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 2,
              borderRadius: 2,
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(25, 118, 210, 0.08)",
              color: theme.palette.text.primary,
              ".MuiAlert-icon": {
                color: theme.palette.info.main,
              },
            })}
            action={
              <Button
                variant="outlined"
                color="info"
                onClick={resetFilters}
                sx={{ color: (theme) => theme.palette.info.main }}
              >
                Сбросить фильтры
              </Button>
            }
          >
            По вашему запросу ничего не найдено.
          </Alert>
        </Box>
      </>
    );
  }

  // ---------- ОСНОВНОЙ РЕНДЕР ----------
  return (
    <>
      <Typography variant="h5" gutterBottom>
        Список объявлений
      </Typography>

      {/* ФИЛЬТРЫ */}
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters();
        }}
        sx={{
          display: "flex",
          gap: 2,
          mb: 3,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <TextField
          label="Поиск"
          value={filters.search}
          onChange={(e) => handleChange("search", e.target.value)}
          size="small"
        />

        {/* Мультивыбор статусов */}
        <TextField
          label="Статус"
          select
          SelectProps={{ multiple: true }}
          value={filters.status}
          onChange={(e) => {
            const value = e.target.value;
            handleChange(
              "status",
              typeof value === "string" ? value.split(",") : value
            );
          }}
          size="small"
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="pending">Ожидает</MenuItem>
          <MenuItem value="approved">Одобрено</MenuItem>
          <MenuItem value="rejected">Отклонено</MenuItem>
          <MenuItem value="draft">Черновик</MenuItem>
        </TextField>


        {/* Категория */}
        <TextField
          label="Категория"
          select
          size="small"
          value={filters.category}
          onChange={(e) => handleChange("category", e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">Все</MenuItem>
          {categoriesList.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Минимум ₽"
          type="number"
          size="small"
          value={filters.minPrice}
          onChange={(e) => handleChange("minPrice", e.target.value)}
          sx={{ width: 120 }}
        />

        <TextField
          label="Максимум ₽"
          type="number"
          size="small"
          value={filters.maxPrice}
          onChange={(e) => handleChange("maxPrice", e.target.value)}
          sx={{ width: 120 }}
        />

        <TextField
          label="Сортировка"
          select
          size="small"
          value={filters.sortBy}
          onChange={(e) => handleChange("sortBy", e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="createdAt">По дате</MenuItem>
          <MenuItem value="price">По цене</MenuItem>
          <MenuItem value="priority">По приоритету</MenuItem>
        </TextField>

        <TextField
          label="Порядок"
          select
          size="small"
          value={filters.sortOrder}
          onChange={(e) => handleChange("sortOrder", e.target.value)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="asc">По возрастанию</MenuItem>
          <MenuItem value="desc">По убыванию</MenuItem>
        </TextField>

        <Button type="submit" variant="contained">
          Применить
        </Button>

        <Button variant="outlined" color="warning" onClick={resetFilters}>
          Сбросить
        </Button>
      </Box>

      {/* Информация о количестве объявлений + пагинация */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          alignItems: "center",
          position: "relative",
        }}
      >
        <Typography variant="body1" fontWeight={500} color="text.secondary">
          Всего объявлений: <strong>{pagination.totalItems}</strong>
        </Typography>

        <Box
          sx={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <Pagination
            page={pagination.currentPage}
            count={pagination.totalPages}
            color="primary"
            onChange={(_, newPage) => changePage(newPage)}
          />
        </Box>
      </Box>

      <Grid container spacing={2}>
        {ads.map((ad) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={ad.id}>
            <CardItem ad={ad} />
          </Grid>
        ))}
      </Grid>

      {pagination.totalPages > 1 && (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Pagination
            page={pagination.currentPage}
            count={pagination.totalPages}
            color="primary"
            onChange={(_, newPage) => changePage(newPage)}
          />
        </Box>
      )}
    </>
  );
}
