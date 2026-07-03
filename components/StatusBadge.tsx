interface Props {
  value: string;
  labels: Record<string, string>;
  colors: Record<string, string>;
}

export function StatusBadge({ value, labels, colors }: Props) {
  const label = labels[value] || value;
  const color = colors[value] || 'bg-gray-100 text-gray-800';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${color}`}>
      {label}
    </span>
  );
}
