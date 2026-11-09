import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReadingForm from './ReadingForm.jsx';

const setup = (onSubmit = vi.fn().mockResolvedValue()) => {
  render(<ReadingForm onSubmit={onSubmit} />);
  return { onSubmit, user: userEvent.setup() };
};

describe('ReadingForm', () => {
  test('shows an error when the value is empty', async () => {
    const { user, onSubmit } = setup();
    await user.click(screen.getByRole('button', { name: /add reading/i }));
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a glucose value.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('shows an error when the value is out of range', async () => {
    const { user, onSubmit } = setup();
    await user.type(screen.getByLabelText(/glucose/i), '700');
    await user.click(screen.getByRole('button', { name: /add reading/i }));
    expect(screen.getByRole('alert')).toHaveTextContent('Value must be between 40 and 600 mg/dl.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('rejects a decimal value', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText(/glucose/i), '110.5');
    await user.click(screen.getByRole('button', { name: /add reading/i }));
    expect(screen.getByRole('alert')).toHaveTextContent('Value must be between 40 and 600 mg/dl.');
  });

  test('submits a valid reading', async () => {
    const { user, onSubmit } = setup();
    await user.selectOptions(screen.getByLabelText(/time slot/i), 'after_lunch');
    await user.type(screen.getByLabelText(/glucose/i), '140');
    await user.click(screen.getByRole('button', { name: /add reading/i }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ slot: 'after_lunch', value: 140 })
    );
  });

  test('shows the server error message (e.g. duplicate slot)', async () => {
    const onSubmit = vi.fn().mockRejectedValue(
      new Error('You already have an After lunch reading for this date.')
    );
    const { user } = setup(onSubmit);
    await user.type(screen.getByLabelText(/glucose/i), '140');
    await user.click(screen.getByRole('button', { name: /add reading/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You already have an After lunch reading for this date.'
    );
  });
});
