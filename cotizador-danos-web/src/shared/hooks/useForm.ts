
import { useState, useCallback } from 'react';

type FieldEvent = React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
type BlurEvent = React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
type ValidationErrors<T> = Partial<Record<keyof T, string>>;
type ValidateFn<T> = (values: T) => ValidationErrors<T>;

interface UseFormOptions<T> {
	initialValues: T;
	validate?: ValidateFn<T>;
	onSubmit: (values: T) => void | Promise<void>;
}

interface UseFormResult<T> {
	values: T;
	errors: ValidationErrors<T>;
	touched: Partial<Record<keyof T, boolean>>;
	isSubmitting: boolean;
	handleChange: (e: FieldEvent) => void;
	handleBlur: (e: BlurEvent) => void;
	handleSubmit: (e: React.FormEvent) => Promise<void>;
	setFieldValue: (field: keyof T, value: T[keyof T]) => void;
	reset: () => void;
}

export function useForm<T extends Record<string, unknown>>(
	options: UseFormOptions<T>
): UseFormResult<T> {
	const { initialValues, validate, onSubmit } = options;

	const [values, setValues] = useState<T>(initialValues);
	const [errors, setErrors] = useState<ValidationErrors<T>>({});
	const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const runValidation = useCallback(
		(current: T): ValidationErrors<T> => (validate ? validate(current) : {}),
		[validate]
	);

	const handleChange = useCallback((e: FieldEvent) => {
		const { name, value } = e.target;
		setValues((prev) => ({ ...prev, [name]: value }));
	}, []);

	const handleBlur = useCallback(
		(e: BlurEvent) => {
			const { name } = e.target;
			setTouched((prev) => ({ ...prev, [name]: true }));
			setErrors((prev) => ({ ...prev, ...runValidation({ ...values, [name]: e.target.value }) }));
		},
		[values, runValidation]
	);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			const allTouched = Object.keys(values).reduce(
				(acc, key) => ({ ...acc, [key]: true }),
				{} as Record<keyof T, boolean>
			);
			setTouched(allTouched);

			const validationErrors = runValidation(values);
			setErrors(validationErrors);
			if (Object.keys(validationErrors).length > 0) return;

			setIsSubmitting(true);
			try {
				await onSubmit(values);
			} finally {
				setIsSubmitting(false);
			}
		},
		[values, runValidation, onSubmit]
	);

	const setFieldValue = useCallback((field: keyof T, value: T[keyof T]) => {
		setValues((prev) => ({ ...prev, [field]: value }));
	}, []);

	const reset = useCallback(() => {
		setValues(initialValues);
		setErrors({});
		setTouched({});
		setIsSubmitting(false);
	}, [initialValues]);

	return {
		values,
		errors,
		touched,
		isSubmitting,
		handleChange,
		handleBlur,
		handleSubmit,
		setFieldValue,
		reset,
	};
}
