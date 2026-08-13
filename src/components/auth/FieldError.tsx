export function FieldError({
  id,
  message,
}: {
  id?: string;
  message?: string;
}) {
  if (!message) return null;

  return (
    <p id={id} className="text-[12px] leading-snug text-red-600" role="alert">
      {message}
    </p>
  );
}
