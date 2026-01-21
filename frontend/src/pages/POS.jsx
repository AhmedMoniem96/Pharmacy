import React, { useState, useEffect } from 'react';
import { Typography, Grid, Paper, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api/axios';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fetch products from API
    // api.get('/masterdata/products/').then(res => setProducts(res.data));
    // Mock data for now
    setProducts([
      { id: 1, name: 'Paracetamol', price: 10.00 },
      { id: 2, name: 'Ibuprofen', price: 15.00 },
    ]);
  }, []);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.qty), 0).toFixed(2);
  };

  const handleCheckout = async () => {
    try {
      // Construct payload for API
      const payload = {
        branch_id: 1, // Replace with actual branch ID
        warehouse_id: 1, // Replace with actual warehouse ID
        items: cart.map(item => ({ product_id: item.id, qty: item.qty })),
        discount_total: "0.00",
        payments: [{ method: "CASH", amount: calculateTotal() }]
      };
      await api.post('/sales/pos/sale/', payload);
      setCart([]);
      alert('Sale completed successfully!');
    } catch (error) {
      console.error('Checkout failed', error);
      alert('Checkout failed');
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={8}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>Products</Typography>
          <TextField
            fullWidth
            label="Search Products"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
              <Grid item xs={4} key={product.id}>
                <Paper
                  sx={{ p: 2, cursor: 'pointer', textAlign: 'center', '&:hover': { bgcolor: '#f5f5f5' } }}
                  onClick={() => addToCart(product)}
                >
                  <Typography variant="subtitle1">{product.name}</Typography>
                  <Typography variant="body2">${product.price.toFixed(2)}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>
      <Grid item xs={4}>
        <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom>Current Sale</Typography>
          <TableContainer sx={{ flexGrow: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cart.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="right">{item.qty}</TableCell>
                    <TableCell align="right">${(item.price * item.qty).toFixed(2)}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => removeFromCart(item.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
            <Typography variant="h5" align="right">Total: ${calculateTotal()}</Typography>
            <Button
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 2 }}
              disabled={cart.length === 0}
              onClick={handleCheckout}
            >
              Checkout
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}