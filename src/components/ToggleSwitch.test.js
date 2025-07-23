import { render, screen, fireEvent } from '@testing-library/react';
import ToggleSwitch from './ToggleSwitch';

describe('ToggleSwitch', () => {
  test('renders labels and handles click', () => {
    const handleChange = jest.fn();
    render(
      <ToggleSwitch
        leftLabel="Left"
        rightLabel="Right"
        value="left"
        onChange={handleChange}
      />
    );

    // Verify labels
    expect(screen.getByText('Left')).toBeInTheDocument();
    expect(screen.getByText('Right')).toBeInTheDocument();

    // Click right button
    fireEvent.click(screen.getByText('Right'));
    expect(handleChange).toHaveBeenCalledWith('right');
  });
});
