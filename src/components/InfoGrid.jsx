import styled from 'styled-components';

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;

  > div {
    background: #fff;
    border-radius: 12px;
    padding: 0.75rem 1rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
  }

  > div > span:first-child {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #666;
    margin-bottom: 0.25rem;
  }

  > div > span:last-child {
    color: #014F40;
    font-weight: 600;
  }
`;

export default InfoGrid;
