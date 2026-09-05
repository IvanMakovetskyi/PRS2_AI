export interface StatusMessage {
  id: number;
  text: string;
  tone?: "info" | "success" | "warning" | "error";
}

export function StatusToast({ message }: { message?: StatusMessage }) {
  return (
    <div className="status-viewport" aria-live="polite" aria-atomic="true">
      {message && (
        <div className={`status-toast status-toast--${message.tone ?? "info"}`}>
          <span className="status-toast__mark" aria-hidden="true" />
          {message.text}
        </div>
      )}
    </div>
  );
}
