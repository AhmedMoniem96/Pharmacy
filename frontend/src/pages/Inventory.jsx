import React, { useState, useEffect } from 'react';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import api from '../api/axios';

export default function Inventory() {
  const [stock, setStock] = useState([]);

  useEffect(() => {
    // Fetch stock data
    // api.get('/reports/inventory/stock-on-hand/?warehouse_id=1').then(res => setStock(res.data));
    // Mock data
    setStock([
      { id: 1, product_name: 'Paracetamol', batch_no: 'B001', qty: 100, expiry_date: '2025-12-31' },
      { id: 2, product_name: 'Ibuprofen', batch_no: 'B002', qty: 50, expiry_date: '2024-06-30' },
    ]);
  }, []);

  return (
    <div>
      <Typography variant="h4" gutterBottom>Inventory</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product Name</TableCell>
              <TableCell>Batch No</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Expiry Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stock.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.product_name}</TableCell>
                <TableCell>{row.batch_no}</TableCell>
                <TableCell align="right">{row.qty}</TableCell>
                <TableCell align="right">{row.expiry_date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}