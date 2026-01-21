import React, { useState, useEffect } from 'react';
import { Typography, Grid, Paper, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Box, Card, CardContent, InputAdornment, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    // Fetch products from API
    // api.get('/masterdata/products/').then(res => setProducts(res.data));
    // Mock data for now
    setProducts([
      { id: 1, name: 'Paracetamol 500mg', price: 10.00, category: 'Pain Relief', stock: 150 },
      { id: 2, name: 'Ibuprofen 400mg', price: 15.00, category: 'Pain Relief', stock: 85 },
      { id: 3, name: 'Amoxicillin 250mg', price: 25.50, category: 'Antibiotics', stock: 40 },
      { id: 4, name: 'Vitamin C 1000mg', price: 12.00, category: 'Supplements', stock: 200 },
      { id: 5, name: 'Cough Syrup', price: 18.00, category: 'Cold & Flu', stock: 30 },
      { id: 6, name: 'Bandages (Pack)', price: 5.00, category: 'First Aid', stock: 500 },
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

  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.qty), 0).toFixed(2);
  };

  const handleCheckout = async () => {
    try {
      const payload = {
        branch_id: 1,
        warehouse_id: 1,
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
    <Grid container spacing={3} sx={{ height: 'calc(100vh - 100px)' }}>
      {/* Left Side: Product Catalog */}
      <Grid item xs={12} md={8} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Paper elevation={2} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
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
            variant="outlined"
            size="small"
          />
        </Paper>
        
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <Grid container spacing={2}>
            {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    cursor: 'pointer', 
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                  }}
                  onClick={() => addToCart(product)}
                >
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Box sx={{ 
                      width: 50, 
                      height: 50, 
                      borderRadius: '50%', 
                      bgcolor: 'primary.light', 
                      color: 'primary.contrastText',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 1
                    }}>
                      <Typography variant="h6">{product.name.charAt(0)}</Typography>
                    </Box>
                    <Typography variant="subtitle2" noWrap title={product.name} sx={{ fontWeight: 600 }}>
                      {product.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1 }}>
                      {product.category}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Typography variant="body2" color="primary" fontWeight="bold">
                        ${product.price.toFixed(2)}
                      </Typography>
                      <Chip label={`${product.stock} left`} size="small" sx={{ fontSize: '0.6rem', height: 20 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Grid>

      {/* Right Side: Cart / Checkout */}
      <Grid item xs={12} md={4} sx={{ height: '100%' }}>
        <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', alignItems: 'center' }}>
            <ShoppingCartIcon sx={{ mr: 1 }} />
            <Typography variant="h6">{t('items')}</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Typography variant="subtitle2">{cart.length} {t('items')}</Typography>
          </Box>

          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
            {cart.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                <ShoppingCartIcon sx={{ fontSize: 60, opacity: 0.2, mb: 2 }} />
                <Typography>{t('cart_empty')}</Typography>
                <Typography variant="caption">{t('add_to_cart')}</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('items')}</TableCell>
                      <TableCell align="center">{t('quantity')}</TableCell>
                      <TableCell align="right">{t('total')}</TableCell>
                      <TableCell width={40}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="500">{item.name}</Typography>
                          <Typography variant="caption" color="textSecondary">${item.price.toFixed(2)}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconButton size="small" onClick={() => updateQty(item.id, -1)} sx={{ p: 0.5 }}>
                              <RemoveCircleOutlineIcon fontSize="small" />
                            </IconButton>
                            <Typography sx={{ mx: 1, minWidth: 20, textAlign: 'center' }}>{item.qty}</Typography>
                            <IconButton size="small" onClick={() => updateQty(item.id, 1)} sx={{ p: 0.5 }}>
                              <AddCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          ${(item.price * item.qty).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" color="error" onClick={() => removeFromCart(item.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          <Box sx={{ p: 3, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="textSecondary">{t('subtotal')}</Typography>
              <Typography fontWeight="600">${calculateTotal()}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography color="textSecondary">{t('tax')} (0%)</Typography>
              <Typography fontWeight="600">$0.00</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5" fontWeight="700" color="primary">{t('total')}</Typography>
              <Typography variant="h5" fontWeight="700" color="primary">${calculateTotal()}</Typography>
            </Box>
            
            <Button
              fullWidth
              variant="contained"
              size="large"
              disabled={cart.length === 0}
              onClick={handleCheckout}
              sx={{ 
                py: 1.5, 
                fontSize: '1.1rem', 
                fontWeight: 600,
              }}
            >
              {t('checkout')}
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}