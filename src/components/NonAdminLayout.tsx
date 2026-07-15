import React, { useMemo, useState, useEffect } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  InputBase,
  List,
  ListItem,
  ListItemText,
  Pagination,
  Stack,
  Switch,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  BottomNavigation,
  BottomNavigationAction,
  Fab,
  ListItemIcon,
  Button,
  Paper,
  ListItemButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import AddIcon from "@mui/icons-material/Add";
import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import MenuIcon from "@mui/icons-material/Menu";

// =======================
// Entity Types
// =======================
export type Entity = {
  id: string;
  name: string;
  type: "Individual" | "Merchant" | "Organization";
  email?: string;
  phone?: string;
  country?: string;
  createdAt: string;
  status: "Active" | "Suspended" | "Pending";
};

// Sample Data
const SAMPLE_ENTITIES: Entity[] = Array.from({ length: 23 }).map((_, i) => ({
  id: `ent_${i + 1}`,
  name: ["Ada Lovelace", "Alan Turing", "Grace Hopper", "Katherine Johnson"][i % 4] + ` ${i + 1}`,
  type: (["Individual", "Merchant", "Organization"] as const)[i % 3],
  email: `entity${i + 1}@example.com`,
  phone: `+234801000${String(i + 1).padStart(3, "0")}`,
  country: ["Nigeria", "Ghana", "Kenya"][i % 3],
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  status: (["Active", "Suspended", "Pending"] as const)[i % 3],
}));

// =======================
// MAIN COMPONENT
// =======================
export default function NonAdminLayout({
  data = SAMPLE_ENTITIES,
  pageSize = 6,
}: {
  data?: Entity[];
  pageSize?: number;
}) {
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm"));
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Entity | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [bottomNav, setBottomNav] = useState("list");

  // =======================
  // FILTERING (memoized)
  // =======================
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = data.filter((d) => (showInactive ? true : d.status === "Active"));
    if (selectedStatus) list = list.filter((d) => d.status === selectedStatus);
    if (q) list = list.filter((d) => d.name.toLowerCase().includes(q) || d.email?.toLowerCase().includes(q));
    return list;
  }, [data, query, selectedStatus, showInactive]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  // if current page is out of range after filters change — reset to 1
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages]);

  const pageItems = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  // smooth-scroll to top when page changes for better UX
  const handlePageChange = (_: any, p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // small helper to compute initials safely
  const getInitials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("");

  // =======================
  // RENDER
  // =======================
  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* SIDEBAR (left) */}
      <Drawer
        anchor="left"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ sx: { width: { xs: 260, sm: 300 }, transitionDuration: "200ms" } }}
      >
        <Box sx={{ width: "100%", p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Navigation
          </Typography>

          <List disablePadding>
            <ListItemButton>
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>

            <ListItemButton selected>
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="Entities" />
            </ListItemButton>

            <ListItemButton>
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItemButton>
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2">Quick filters</Typography>
          <List>
            {["Active", "Pending", "Suspended"].map((s) => (
              <ListItem key={s} disablePadding>
                <ListItemButton selected={selectedStatus === s} onClick={() => setSelectedStatus(selectedStatus === s ? null : s)}>
                  <ListItemText primary={s} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSelectedStatus(null);
                setShowInactive(false);
                setQuery("");
                setPage(1);
                setSidebarOpen(false);
              }}
            >
              Reset
            </Button>

            <Button fullWidth variant="contained" onClick={() => setSidebarOpen(false)}>
              Apply
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* TOP BAR */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar
          sx={{
            gap: 1,
            px: 1,
            display: "grid",
            gridTemplateColumns: { xs: "auto 1fr auto", sm: "auto 1fr auto" },
            alignItems: "center",
          }}
        >
          {/* Left: menu */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton onClick={() => setSidebarOpen(true)} aria-label="open menu">
              <MenuIcon />
            </IconButton>
          </Box>

          {/* Middle: title + subtitle (stacked) */}
          <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              Entities
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Manage individuals, merchants & organizations
            </Typography>
          </Box>

          {/* Right actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton aria-label="filters" onClick={() => setFilterOpen(true)}>
              <FilterListIcon />
            </IconButton>
          </Box>
        </Toolbar>

        {/* Search Bar */}
        <Box sx={{ px: { xs: 1, sm: 2 }, pb: 1 }}>
          <Paper
            component="div"
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              background: (theme) => theme.palette.background.paper,
              borderRadius: 2,
              px: 1,
              py: 0.5,
            }}
            elevation={0}
          >
            <SearchIcon />
            <InputBase
              placeholder="Search by name, email or phone"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              sx={{ ml: 1, flex: 1, minWidth: 0 }}
              inputProps={{ 'aria-label': 'search entities' }}
            />

            <Chip label={`${filtered.length}`} size="small" sx={{ ml: 1 }} />
          </Paper>
        </Box>
      </AppBar>

      {/* MAIN CONTENT */}
      <Box component="main" sx={{ flex: 1, overflow: "auto", p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2}>
          {/* Responsive Grid for cards */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "repeat(3, 1fr)",
              },
              gap: 16,
            }}
          >
            {pageItems.map((e) => (
              <Card
                key={e.id}
                sx={{
                  borderRadius: 3,
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 120,
                  background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.background.paper})`,
                  color: theme.palette.getContrastText(theme.palette.primary.light),
                }}
                elevation={3}
              >
                <CardActionArea onClick={() => setSelected(e)} sx={{ alignItems: "stretch" }}>
                  <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", p: { xs: 1, sm: 2 } }}>
                    <Avatar sx={{ width: { xs: 44, sm: 56 }, height: { xs: 44, sm: 56 }, bgcolor: theme.palette.secondary.main }}>
                      {getInitials(e.name)}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={700} noWrap sx={{ fontSize: { xs: 14, sm: 16 } }}>
                        {e.name}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                        {e.email} • {e.phone}
                      </Typography>

                      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                        <Chip size="small" label={e.type} />
                        <Chip size="small" label={e.country} />
                        <Chip size="small" label={e.status} variant={e.status === "Active" ? "filled" : "outlined"} />
                      </Stack>
                    </Box>

                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="caption">{new Date(e.createdAt).toLocaleDateString()}</Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>

          {pageItems.length === 0 && (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography variant="body2" color="text.secondary">
                No entities found. Try clearing filters or search.
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Pagination */}
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Pagination count={totalPages} page={page} onChange={handlePageChange} size={isSmUp ? "medium" : "small"} />
        </Box>
      </Box>

      {/* BOTTOM NAV - hidden on sm+ */}
      <Box component="footer" sx={{ display: { xs: "block", sm: "none" } }}>
        <BottomNavigation value={bottomNav} onChange={(e, val) => setBottomNav(val)} showLabels>
          <BottomNavigationAction label="List" value="list" icon={<SearchIcon />} />
          <BottomNavigationAction label="Filters" value="filters" icon={<FilterListIcon />} onClick={() => setFilterOpen(true)} />
          <BottomNavigationAction label="Theme" value="theme" icon={<Brightness4Icon />} />
        </BottomNavigation>
      </Box>

      {/* FAB */}
      <Fab
        color="primary"
        sx={{ position: "fixed", bottom: { xs: 80, sm: 24 }, right: { xs: 16, sm: 32 } }}
        aria-label="add-entity"
      >
        <AddIcon />
      </Fab>

      {/* FILTER DRAWER (right) */}
      <Drawer
        anchor="right"
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ sx: { width: { xs: 320, sm: 360, md: 420 } } }}
      >
        <Box sx={{ width: "100%", p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Filters</Typography>
            <Switch checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} inputProps={{ 'aria-label': 'show inactive' }} />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2">Status</Typography>
          <List>
            {["Active", "Pending", "Suspended"].map((s) => (
              <ListItem key={s} disablePadding>
                <ListItemButton selected={selectedStatus === s} onClick={() => setSelectedStatus(selectedStatus === s ? null : s)}>
                  <ListItemText primary={s} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2">Quick actions</Typography>
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                setQuery("");
                setSelectedStatus(null);
                setShowInactive(false);
                setPage(1);
                setFilterOpen(false);
              }}
            >
              Reset
            </Button>
            <Button variant="contained" fullWidth onClick={() => setFilterOpen(false)}>
              Apply
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* ENTITY DETAILS DIALOG */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} fullWidth maxWidth="md">
        <DialogTitle>Entity details</DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 3 } }}>
          {selected && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ width: 72, height: 72 }}>{getInitials(selected.name)}</Avatar>
                <Box>
                  <Typography fontWeight={700}>{selected.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selected.type} • {selected.country}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              <Typography variant="body2">Contact</Typography>
              <Typography variant="body2">{selected.email}</Typography>
              <Typography variant="body2">{selected.phone}</Typography>

              <Divider />

              <Typography variant="body2">Status</Typography>
              <Chip label={selected.status} />

              <Divider />

              <Typography variant="body2" color="text.secondary">
                Created at
              </Typography>
              <Typography>{new Date(selected.createdAt).toLocaleString()}</Typography>

              <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                <Button variant="outlined" fullWidth onClick={() => { /* edit action */ }}>
                  Edit
                </Button>
                <Button variant="contained" fullWidth color="error" onClick={() => { /* delete action */ }}>
                  Delete
                </Button>
              </Box>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
