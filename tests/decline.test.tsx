import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Experience } from '@/components/experience/experience';

const user = userEvent.setup();

describe('The question', () => {
  it('lets her decline, and never traps her', async () => {
    window.localStorage.setItem(
      'for-samiya.v1',
      JSON.stringify({
        token: '',
        unlocked: true,
        stage: 'proposal',
        visited: ['lock', 'letter', 'flowers', 'proposal'],
        updatedAt: new Date().toISOString(),
      }),
    );

    render(<Experience />);

    expect(await screen.findByText('Can I take you on a date?', {}, { timeout: 8000 })).toBeInTheDocument();

    const no = screen.getByRole('button', { name: 'No, not today' });
    await user.click(no);
    await user.click(screen.getByRole('button', { name: 'No, not today' }));
    await user.click(screen.getByRole('button', { name: 'No, not today' }));

    expect(await screen.findByText("That's okay, Samiya.", {}, { timeout: 6000 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /give it another thought/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /leave for now/i })).toBeInTheDocument();

    // She can come back to the question and change her mind.
    await user.click(screen.getByRole('button', { name: /give it another thought/i }));
    expect(await screen.findByText('Can I take you on a date?', {}, { timeout: 6000 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /yes, i'd love to/i })).toBeInTheDocument();
  }, 40_000);

  it('keeps the romantic pages free of any admin link', async () => {
    const { container } = render(<Experience />);
    await screen.findByText('Hey, My Samiya', {}, { timeout: 8000 });

    const html = container.innerHTML.toLowerCase();
    expect(html).not.toContain('/admin');
    expect(html).not.toContain('dashboard');
    expect(container.querySelectorAll('a').length).toBe(0);
  }, 30_000);
});
