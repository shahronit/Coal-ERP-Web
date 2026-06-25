export const formatApiError = (err, fallback = 'Something went wrong') => {
  const payload = err?.data;
  if (payload?.errors?.length) {
    return payload.errors.map((e) => e.message || e.field).join(' · ');
  }
  if (payload?.message) return payload.message;
  if (err?.status === 403) return 'You do not have permission for this action';
  if (err?.status === 404) return 'Resource not found';
  return fallback;
};
