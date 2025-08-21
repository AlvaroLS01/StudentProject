import styled from 'styled-components';

export const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1500;
`;

export const Modal = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 2rem 1.5rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  animation: slideDown 0.3s ease forwards;
  position: relative;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-15px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const ModalTitle = styled.h2`
  margin-top: 0;
  margin-bottom: 1rem;
  text-align: center;
  color: #014F40;
`;

export const ModalText = styled.p`
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
  color: #014F40;
  text-align: center;
`;

export const ModalActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
`;

export const ModalButton = styled.button`
  padding: 0.7rem 1.4rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
  ${p =>
    p.primary
      ? `background: #046654; color: #fff; &:hover { background: #034640; }`
      : `background: #e9e9e9; color: #333; &:hover { background: #d4d4d4; }`};
`;
