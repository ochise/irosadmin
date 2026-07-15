import React from "react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
import SettingsIcon from "@mui/icons-material/Settings";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import LanguageIcon from "@mui/icons-material/Language";
import SecurityIcon from "@mui/icons-material/Security";
import { Box, Typography, Select, MenuItem as SelectItem } from "@mui/material";
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PermDataSettingIcon from '@mui/icons-material/PermDataSetting';
import { useNavigate } from 'react-router-dom'
import NaturePeopleIcon from '@mui/icons-material/NaturePeople';

export type ConfigDropdownProps = {
    /** initial dark mode value */
    initialDark?: boolean;
    /** initial language */
    initialLang?: string;
    /** callback when dark mode toggles */
    onDarkChange?: (value: boolean) => void;
    /** callback when language changes */
    onLanguageChange?: (lang: string) => void;
};

export const ConfigDropdown: React.FC<ConfigDropdownProps> = ({
    initialDark = false,
    initialLang = "en",
    onDarkChange,
    onLanguageChange,
}) => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const [dark, setDark] = React.useState(initialDark);
    const [lang, setLang] = React.useState<string>(initialLang);

    const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const handleToggleDark = (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = e.target.checked;
        setDark(next);
        onDarkChange?.(next);
    };

    const navigate = useNavigate();

    return (
        <>
            <Tooltip title="Configuration">
                <IconButton
                    aria-controls={open ? "config-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? "true" : undefined}
                    onClick={handleOpen}
                    size="large"
                >
                    <SettingsIcon />
                </IconButton>
            </Tooltip>

            <Menu
                id="config-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'config-button',
                    role: 'menu'
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle1">Settings</Typography>
                </Box>

                <MenuItem>
                    <ListItemIcon>
                        <Brightness4Icon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Dark mode</ListItemText>
                    <Switch checked={dark} onChange={handleToggleDark} inputProps={{ 'aria-label': 'toggle dark mode' }} />
                </MenuItem>

                <Divider />
                <MenuItem onClick={() => navigate('/manage-access')}>
                    <ListItemIcon>
                        <ManageAccountsIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Manage access</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => navigate('/admin/service-provider')}>
                    <ListItemIcon>
                        <NaturePeopleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Manage service providers</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleClose}>
                    <ListItemText>
                        <Typography variant="body2" color="text.secondary">Close</Typography>
                    </ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
};

export default ConfigDropdown;
