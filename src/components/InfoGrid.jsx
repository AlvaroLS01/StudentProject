import styled from 'styled-components';

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem 2rem;
  margin-bottom: 1rem;
`;

export default InfoGrid;
