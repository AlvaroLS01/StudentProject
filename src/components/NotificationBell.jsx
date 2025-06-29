import React from 'react';
import styled from 'styled-components';
import { useNotificationsStore } from '../NotificationsStore';

const BellWrapper = styled.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  font-size: 1.5rem;
  z-index: 1200;
`;

const Bubble = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  background: red;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
`;

export default function NotificationBell() {
  const { unreadCount } = useNotificationsStore();
  if (unreadCount === 0) return null;
  return (
    <BellWrapper>
      🔔
      <Bubble>{unreadCount}</Bubble>
    </BellWrapper>
  );
}
