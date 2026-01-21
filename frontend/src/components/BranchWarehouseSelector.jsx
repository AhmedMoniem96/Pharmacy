import React, { useState, useEffect } from 'react';
import { FormControl, Select, MenuItem, Box, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function BranchWarehouseSelector() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [branch, setBranch] = useState('');
  const [warehouse, setWarehouse] = useState('');

  useEffect(() => {
    if (user) {
      // Set defaults if available
      if (user.allowed_branches && user.allowed_branches.length > 0) {
        setBranch(user.allowed_branches[0].id);
      }
      if (user.allowed_warehouses && user.allowed_warehouses.length > 0) {
        setWarehouse(user.allowed_warehouses[0].id);
      }
    }
  }, [user]);

  const handleBranchChange = (event) => {
    setBranch(event.target.value);
    // Logic to filter warehouses based on branch could go here if needed
  };

  const handleWarehouseChange = (event) => {
    setWarehouse(event.target.value);
  };

  if (!user) return null;

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
        <Select
          value={branch}
          onChange={handleBranchChange}
          displayEmpty
          inputProps={{ 'aria-label': 'Select Branch' }}
          sx={{ color: 'inherit', '& .MuiSelect-icon': { color: 'inherit' } }}
        >
          <MenuItem value="" disabled>
            {t('select_branch')}
          </MenuItem>
          {user.allowed_branches?.map((b) => (
            <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
        <Select
          value={warehouse}
          onChange={handleWarehouseChange}
          displayEmpty
          inputProps={{ 'aria-label': 'Select Warehouse' }}
          sx={{ color: 'inherit', '& .MuiSelect-icon': { color: 'inherit' } }}
        >
          <MenuItem value="" disabled>
            {t('select_warehouse')}
          </MenuItem>
          {user.allowed_warehouses?.map((w) => (
            <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}