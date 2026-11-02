/**
 * The whole romantic journey, end to end, in a real DOM.
 * Requires the app to be serving on TEST_APP_ORIGIN (default localhost:3000).
 */
import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Experience } from '@/components/experience/experience';
import { LETTER_ONE, POEM_STANZAS } from '@/lib/content';

const user = userEvent.setup();

describe('For Samiya — the journey', () => {
  it('unlocks with her birthday and carries her from letter to thank you', async () => {
    const { container } = render(<Experience />);

    /* ---------------- the birthday lock ---------------- */
    expect(await screen.findByText('Hey, My Samiya')).toBeInTheDocument();

    const input = screen.getByLabelText('Her birthday');
    await user.type(input, '14.11.2008');
    await user.click(screen.getByRole('button', { name: /unlock/i }));
    expect(await screen.findByText('Hmm, not quite, my love. Try once more.')).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, '14112007');
    await user.click(screen.getByRole('button', { name: /unlock/i }));

    /* ---------------- the envelope + letter ---------------- */
    expect(await screen.findByText('For my Samiya', {}, { timeout: 8000 })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /open the letter/i }));

    expect(await screen.findByText(LETTER_ONE.paragraphs[0], {}, { timeout: 8000 })).toBeInTheDocument();
    expect(screen.getByText(LETTER_ONE.paragraphs[4])).toBeInTheDocument();
    expect(screen.getByText('Yousuf')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: new RegExp(LETTER_ONE.cta, 'i') }));

    /* ---------------- flowers + poem ---------------- */
    expect(
      await screen.findByText('For The Girl Who Makes My World Beautiful', {}, { timeout: 8000 }),
    ).toBeInTheDocument();
    expect(screen.getByText(POEM_STANZAS[0][0])).toBeInTheDocument();
    expect(screen.getByText(POEM_STANZAS[7][1])).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /ask you something/i }));

    /* ---------------- the proposal ---------------- */
    expect(await screen.findByText('Can I take you on a date?', {}, { timeout: 8000 })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /yes, i'd love to/i }));

    /* ---------------- our date ---------------- */
    expect(await screen.findByText("Then it's a date, my love!", {}, { timeout: 12000 })).toBeInTheDocument();

    const dayButtons = Array.from(
      container.querySelectorAll<HTMLButtonElement>('[data-cal-date]'),
    ).filter((button) => !button.disabled);
    expect(dayButtons.length).toBeGreaterThan(5);
    const chosenDay = dayButtons[4];
    const chosenIso = chosenDay.getAttribute('data-cal-date')!;
    await user.click(chosenDay);

    await user.click(screen.getByRole('button', { name: '6:00 PM' }));
    await user.click(screen.getByRole('button', { name: /a lovely dinner together/i }));

    const note = screen.getByLabelText(/Anything you want me to know before our date\?/i);
    await user.type(note, 'Counting the hours.');

    expect(screen.getByText('Counting the hours.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /confirm our little date/i }));

    /* ---------------- the thank you ---------------- */
    expect(
      await screen.findByText('Looking forward to seeing you, Samiya.', {}, { timeout: 15000 }),
    ).toBeInTheDocument();

    expect(screen.getByText('Our Little Date')).toBeInTheDocument();
    expect(screen.getByText('6:00 PM')).toBeInTheDocument();
    expect(screen.getByText('A lovely dinner together')).toBeInTheDocument();
    expect(screen.getByText('Counting the hours.')).toBeInTheDocument();
    // Nothing she skipped should be presented as if she had shared it.
    expect(screen.queryByText(/^voice message$/i)).toBeNull();
    expect(screen.queryByText(/your photos/i)).toBeNull();
    expect(screen.queryByText(/^shared location$/i)).toBeNull();

    /* ---------------- her plan really is saved ---------------- */
    const stored = JSON.parse(window.localStorage.getItem('for-samiya.v1') ?? '{}');
    expect(stored.token).toMatch(/^[0-9a-f-]{36}$/i);
    expect(stored.stage).toBe('thanks');

    const response = await fetch(`/api/date-response?token=${stored.token}`);
    const payload = await response.json();
    expect(payload.ok).toBe(true);
    expect(payload.response.selectedDate).toBe(chosenIso);
    expect(payload.response.selectedTime).toBe('18:00');
    expect(payload.response.activity).toBe('dinner');
    expect(payload.response.personalMessage).toBe('Counting the hours.');
    expect(payload.response.media).toHaveLength(0);
    expect(payload.response.location).toBeNull();

    /* ---------------- coming back later resumes the thank you ---------------- */
    const firstToken = stored.token;
    screen.getAllByRole('button', { name: /review our date/i });
    await user.click(screen.getAllByRole('button', { name: /review our date/i })[0]);
    expect(await screen.findByText("Then it's a date, my love!", {}, { timeout: 8000 })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Counting the hours.')).toBeInTheDocument();
    });

    const saved = JSON.parse(window.localStorage.getItem('for-samiya.v1') ?? '{}');
    expect(saved.token).toBe(firstToken);
  }, 60_000);
});
