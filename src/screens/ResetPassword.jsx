import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Home from './Home';
import PasswordChangeModal from '../components/PasswordChangeModal';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    navigate('/home', { replace: true });
  };

  return (
    <>
      <Home />
      <PasswordChangeModal open={open} onClose={handleClose} token={token} />
    </>
  );
}
