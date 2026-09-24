import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmationModal from '../components/ConfirmationModal';

describe('ConfirmationModal Component', () => {
  it('renders confirmation dialog title, message, and buttons when open', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmationModal
        isOpen={true}
        title="Delete Entity 'User'?"
        message="Are you sure you want to delete this entity? Any connecting relationships will also be removed."
        confirmLabel="Delete Entity"
        cancelLabel="Cancel"
        danger={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText("Delete Entity 'User'?")).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to delete this entity\? Any connecting relationships will also be removed\./)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Entity' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('triggers onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmationModal
        isOpen={true}
        title="Delete Property 'email'?"
        message="Are you sure you want to remove property 'email' from 'User'?"
        confirmLabel="Delete Property"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const confirmButton = screen.getByRole('button', { name: 'Delete Property' });
    fireEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('triggers onCancel when cancel button is clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmationModal
        isOpen={true}
        title="Delete Project 'Project 1'?"
        message="Are you sure you want to permanently delete this project?"
        confirmLabel="Delete Project"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('does not render anything when isOpen is false', () => {
    render(
      <ConfirmationModal
        isOpen={false}
        title="Delete Project"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.queryByText('Delete Project')).not.toBeInTheDocument();
  });
});
