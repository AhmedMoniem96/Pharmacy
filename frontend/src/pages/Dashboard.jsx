import React from 'react';
import { Typography, Grid, Paper, Box, Card, CardContent, Divider, List, ListItem, ListItemText, ListItemAvatar, Avatar } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import { useTranslation } from 'react-i18next';

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
    <Box sx={{ 
      position: 'absolute', 
      top: -10, 
      right: -10, 
      width: 100, 
      height: 100, 
      borderRadius: '50%', 
      bgcolor: `${color}22`, 
      zIndex: 0 
    }} />
    <CardContent sx={{ zIndex: 1, flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: `${color}15`, color: color, mr: 2 }}>
          {icon}
        </Avatar>
        <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="textSecondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const { t } = useTranslation();

  // Mock data for recent transactions
  const recentTransactions = [
    { id: 1, type: 'Sale', amount: '$45.00', date: '10 mins ago', status: 'Completed' },
    { id: 2, type: 'Restock', amount: '-$120.00', date: '1 hour ago', status: 'Pending' },
    { id: 3, type: 'Sale', amount: '$12.50', date: '2 hours ago', status: 'Completed' },
    { id: 4, type: 'Sale', amount: '$85.00', date: '3 hours ago', status: 'Completed' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
          {t('dashboard')}
        </Typography>
        <Typography variant="body1" color="textSecondary">
          {t('welcome')}, Admin. Here's what's happening today.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title={t('total_sales')} 
            value="$1,250" 
            subtitle="+15% from yesterday"
            icon={<AttachMoneyIcon />} 
            color="#2e7d32" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Transactions" 
            value="45" 
            subtitle="Today's total invoices"
            icon={<TrendingUpIcon />} 
            color="#1976d2" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title={t('low_stock')} 
            value="3" 
            subtitle="Items below threshold"
            icon={<WarningIcon />} 
            color="#ed6c02" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title={t('expiring_soon')} 
            value="5" 
            subtitle="In next 30 days"
            icon={<EventBusyIcon />} 
            color="#d32f2f" 
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Recent Activity
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {recentTransactions.map((tx) => (
                <React.Fragment key={tx.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: tx.type === 'Sale' ? '#e8f5e9' : '#ffebee', color: tx.type === 'Sale' ? '#2e7d32' : '#d32f2f' }}>
                        <LocalPharmacyIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={tx.type === 'Sale' ? 'New Sale Recorded' : 'Inventory Restock'} 
                      secondary={tx.date} 
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: tx.type === 'Sale' ? '#2e7d32' : '#d32f2f' }}>
                        {tx.amount}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {tx.status}
                      </Typography>
                    </Box>
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'inherit' }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                <Typography variant="subtitle1" sx={{ color: 'inherit', fontWeight: 600 }}>New Sale</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Process a new transaction</Typography>
              </Paper>
              <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                <Typography variant="subtitle1" sx={{ color: 'inherit', fontWeight: 600 }}>Add Inventory</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Receive new stock items</Typography>
              </Paper>
              <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                <Typography variant="subtitle1" sx={{ color: 'inherit', fontWeight: 600 }}>Generate Report</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>View daily sales summary</Typography>
              </Paper>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}