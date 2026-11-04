interface ChoiceCardProps {
  title: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
}

export function ChoiceCard({ title, description, selected, onSelect }: ChoiceCardProps) {
  return (
    <button
      type="button"
      className={selected ? 'choice-card selected' : 'choice-card'}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="choice-title">{title}</span>
      {description ? <span className="choice-desc">{description}</span> : null}
    </button>
  );
}
