interface FoldProps {
  progress: number;
  children: React.ReactNode;
}

export function FoldY({ progress, children }: FoldProps) {
  if (progress <= 0) {
    return null;
  }
  if (progress >= 1) {
    return children;
  }
  return (
    <div
      className="grid"
      style={{ gridTemplateRows: `${progress}fr`, opacity: progress }}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

export function FoldX({ progress, children }: FoldProps) {
  if (progress <= 0) {
    return null;
  }
  if (progress >= 1) {
    return children;
  }
  return (
    <span
      className="inline-grid overflow-hidden align-top"
      style={{ gridTemplateColumns: `${progress}fr`, opacity: progress }}
    >
      <span className="min-w-0">
        <span className="block w-max whitespace-nowrap">{children}</span>
      </span>
    </span>
  );
}
