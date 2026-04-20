import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useForm } from '../../../shared/hooks/useForm';

describe('useForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Initial state ────────────────────────────────────────────────────────

  it('initializes values from initialValues', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: { name: 'Juan', email: '' },
        onSubmit: vi.fn(),
      })
    );

    expect(result.current.values).toEqual({ name: 'Juan', email: '' });
  });

  it('initializes with empty errors', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues: { name: '' }, onSubmit: vi.fn() })
    );

    expect(result.current.errors).toEqual({});
  });

  it('initializes isSubmitting as false', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues: { name: '' }, onSubmit: vi.fn() })
    );

    expect(result.current.isSubmitting).toBe(false);
  });

  // ─── handleChange ─────────────────────────────────────────────────────────

  it('updates value when handleChange is called', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues: { name: '' }, onSubmit: vi.fn() })
    );

    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'María' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.values.name).toBe('María');
  });

  // ─── handleBlur ───────────────────────────────────────────────────────────

  it('marks field as touched on blur', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues: { name: '' }, onSubmit: vi.fn() })
    );

    act(() => {
      result.current.handleBlur({
        target: { name: 'name', value: '' },
      } as React.FocusEvent<HTMLInputElement>);
    });

    expect(result.current.touched.name).toBe(true);
  });

  it('runs validation on blur and sets errors', () => {
    const validate = (v: { name: string }) =>
      v.name.trim() === '' ? { name: 'Requerido' } : {};

    const { result } = renderHook(() =>
      useForm({ initialValues: { name: '' }, validate, onSubmit: vi.fn() })
    );

    act(() => {
      result.current.handleBlur({
        target: { name: 'name', value: '' },
      } as React.FocusEvent<HTMLInputElement>);
    });

    expect(result.current.errors.name).toBe('Requerido');
  });

  // ─── setFieldValue ────────────────────────────────────────────────────────

  it('updates a field value programmatically via setFieldValue', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues: { name: '' }, onSubmit: vi.fn() })
    );

    act(() => {
      result.current.setFieldValue('name', 'Programático');
    });

    expect(result.current.values.name).toBe('Programático');
  });

  // ─── reset ────────────────────────────────────────────────────────────────

  it('resets values to initialValues after reset()', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues: { name: 'Original' }, onSubmit: vi.fn() })
    );

    act(() => {
      result.current.setFieldValue('name', 'Changed');
    });
    expect(result.current.values.name).toBe('Changed');

    act(() => {
      result.current.reset();
    });

    expect(result.current.values.name).toBe('Original');
  });

  it('clears errors after reset()', () => {
    const validate = (v: { name: string }) =>
      v.name.trim() === '' ? { name: 'Requerido' } : {};

    const { result } = renderHook(() =>
      useForm({ initialValues: { name: '' }, validate, onSubmit: vi.fn() })
    );

    act(() => {
      result.current.handleBlur({
        target: { name: 'name', value: '' },
      } as React.FocusEvent<HTMLInputElement>);
    });
    expect(result.current.errors.name).toBe('Requerido');

    act(() => {
      result.current.reset();
    });

    expect(result.current.errors).toEqual({});
  });

  // ─── handleSubmit ─────────────────────────────────────────────────────────

  it('calls onSubmit with current values when no validation errors', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useForm({ initialValues: { name: 'Juan' }, onSubmit: handleSubmit })
    );

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(handleSubmit).toHaveBeenCalledWith({ name: 'Juan' });
  });

  it('does not call onSubmit when validation fails', async () => {
    const handleSubmit = vi.fn();
    const validate = (v: { name: string }) =>
      v.name.trim() === '' ? { name: 'Requerido' } : {};

    const { result } = renderHook(() =>
      useForm({ initialValues: { name: '' }, validate, onSubmit: handleSubmit })
    );

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('sets isSubmitting to true while onSubmit is in progress and false after', async () => {
    let resolveFn!: () => void;
    const promise = new Promise<void>((resolve) => { resolveFn = resolve; });
    const handleSubmit = vi.fn().mockReturnValue(promise);

    const { result } = renderHook(() =>
      useForm({ initialValues: { name: 'Juan' }, onSubmit: handleSubmit })
    );

    act(() => {
      result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    await waitFor(() => expect(result.current.isSubmitting).toBe(true));

    act(() => resolveFn());

    await waitFor(() => expect(result.current.isSubmitting).toBe(false));
  });

  it('marks all fields as touched on submit attempt', async () => {
    const { result } = renderHook(() =>
      useForm({ initialValues: { name: '', email: '' }, onSubmit: vi.fn() })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.touched.name).toBe(true);
    expect(result.current.touched.email).toBe(true);
  });

  // ─── Edge cases ──────────────────────────────────────────────────────────

  it('works without a validate function (no errors)', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useForm({ initialValues: { name: '' }, onSubmit: handleSubmit })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(handleSubmit).toHaveBeenCalled();
    expect(result.current.errors).toEqual({});
  });
});
