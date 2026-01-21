import React, { useState, useEffect } from 'react';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Chip, TextField, InputAdornment, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';

export default function Inventory() {
  const [stock, setStock] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    // Fetch stock data
    // api.get('/reports/inventory/stock-on-hand/?warehouse_id=1').then(res => setStock(res.data));
    // Mock data
    setStock([
      { id: 1, product_name: 'Paracetamol 500mg', batch_no: 'B001', qty: 100, expiry_date: '2025-12-31', status: 'Good' },
      { id: 2, product_name: 'Ibuprofen 400mg', batch_no: 'B002', qty: 50, expiry_date: '2024-06-30', status: 'Low Stock' },
      { id: 3, product_name: 'Amoxicillin 250mg', batch_no: 'B003', qty: 10, expiry_date: '2024-02-15', status: 'Expiring Soon' },
      { id: 4, product_name: 'Vitamin C 1000mg', batch_no: 'B004', qty: 200, expiry_date: '2026-01-01', status: 'Good' },
      { id: 5, product_name: 'Cough Syrup', batch_no: 'B005', qty: 0, expiry_date: '2025-05-20', status: 'Out of Stock' },
    ]);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Good': return 'success';
      case 'Low Stock': return 'warning';
      case 'Expiring Soon': return 'error';
      case 'Out of Stock': return 'default';
      default: return 'primary';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {t('inventory')}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {t('stock_on_hand')}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}>
          {t('add')}
        </Button>
      </Box>

      <Paper elevation={2} sx={{ mb: 3, p: 2, display: 'flex', gap: 2 }}>
        <TextField
          placeholder={t('search_products')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          size="small"
          sx={{ width: 300 }}
        />
        <Button startIcon={<FilterListIcon />} variant="outlined">
          Filters
        </Button>
      </Paper>

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>{t('products')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('batch')}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>{t('quantity')}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>{t('expiry')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>{t('status')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stock.filter(item => item.product_name.toLowerCase().includes(searchTerm.toLowerCase())).map((row) => (
              <TableRow key={row.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{row.product_name}</TableCell>
                <TableCell>
                  <Chip label={row.batch_no} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: row.qty === 0 ? 'bold' : 'normal', color: row.qty === 0 ? 'error.main' : 'inherit' }}>
                  {row.qty}
                </TableCell>
                <TableCell align="right">{row.expiry_date}</TableCell>
                <TableCell align="center">
                  <Chip 
                    label={row.status} 
                    color={getStatusColor(row.status)} 
                    size="small" 
                    sx={{ minWidth: 100 }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}