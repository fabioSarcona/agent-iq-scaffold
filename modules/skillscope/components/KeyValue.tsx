interface KeyValueProps {
  label: string;
  value: string | string[];
  className?: string;
}

export function KeyValue({ label, value, className = "" }: KeyValueProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">
        {Array.isArray(value) ? (
          <ul className="list-disc list-inside space-y-0.5">
            {value.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <span>{value}</span>
        )}
      </dd>
    </div>
  );
}