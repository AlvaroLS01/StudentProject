import styled from 'styled-components';

const CommonCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.06);
  padding: 2rem;
  margin-bottom: 1.75rem;
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
  }
`;

export default CommonCard;
