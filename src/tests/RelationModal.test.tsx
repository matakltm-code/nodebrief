import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('Relationship Line Double-Click & Edit Modal', () => {
  it('opens edit popup modal on double-clicking relation badge', () => {
    render(<App />);

    // Find a relationship badge text on canvas (e.g. has many [1:N])
    const relationBadges = screen.getAllByText(/has many/i);
    expect(relationBadges.length).toBeGreaterThanOrEqual(1);

    // Double click relation badge
    fireEvent.doubleClick(relationBadges[0]);

    // Verify modal appears
    expect(screen.getByText('Edit Relationship Link')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
    expect(screen.getByTitle('Delete relationship')).toBeInTheDocument();
  });

  it('updates relation label by default when changing cardinality dropdown', () => {
    render(<App />);

    const relationBadges = screen.getAllByText(/has many/i);
    fireEvent.doubleClick(relationBadges[0]);

    // Cardinality select dropdown in Edit modal
    const cardinalitySelect = screen.getByDisplayValue('1:N (One to Many)');
    const labelInput = screen.getByPlaceholderText('e.g. has many, belongs to, owns');

    // Change to M:N (Many to Many)
    fireEvent.change(cardinalitySelect, { target: { value: 'M:N' } });

    // Label should default to "many to many"
    expect(labelInput).toHaveValue('many to many');

    // Change to 1:1 (One to One)
    fireEvent.change(cardinalitySelect, { target: { value: '1:1' } });

    // Label should default to "has one"
    expect(labelInput).toHaveValue('has one');
  });
});
