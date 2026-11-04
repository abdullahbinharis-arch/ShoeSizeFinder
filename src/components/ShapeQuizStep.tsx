import { useState } from 'react';
import type { ArchType, FootShape, ToeShape, WidthFeel } from '../lib/types';
import { ChoiceCard } from './ChoiceCard';
import { PrimaryButton } from './PrimaryButton';
import { StepShell } from './StepShell';

interface ShapeQuizStepProps {
  onComplete: (answers: Partial<FootShape>) => void;
  onSkip: () => void;
}

const TOE_OPTIONS: { value: ToeShape; title: string; description: string }[] = [
  { value: 'egyptian', title: 'Egyptian', description: 'Big toe is the longest, then they taper down' },
  { value: 'greek', title: 'Greek', description: 'Second toe is longer than the big toe' },
  { value: 'roman', title: 'Roman', description: 'First three toes are roughly the same length' },
  { value: 'square', title: 'Square', description: 'All toes are about even, blunt end' },
];

const WIDTH_OPTIONS: { value: WidthFeel; title: string; description: string }[] = [
  { value: 'narrow', title: 'Narrow', description: 'Shoes often feel loose side-to-side' },
  { value: 'normal', title: 'Normal', description: 'Standard width fits fine' },
  { value: 'wide', title: 'Wide', description: 'Shoes often pinch across the widest part' },
];

const ARCH_OPTIONS: { value: ArchType; title: string; description: string }[] = [
  { value: 'flat', title: 'Flat', description: 'Little visible arch, footprint shows almost the whole foot' },
  { value: 'normal', title: 'Normal', description: 'A clear curve along the inside of the foot' },
  { value: 'high', title: 'High', description: 'Big gap on the inside of the footprint' },
];

export function ShapeQuizStep({ onComplete, onSkip }: ShapeQuizStepProps) {
  const [toe, setToe] = useState<ToeShape | null>(null);
  const [width, setWidth] = useState<WidthFeel | null>(null);
  const [arch, setArch] = useState<ArchType | null>(null);

  const submit = () => {
    const answers: Partial<FootShape> = {};
    if (toe) answers.toe = toe;
    if (width) answers.width = width;
    if (arch) answers.arch = arch;
    onComplete(answers);
  };

  const renderGroup = <T extends string>(
    label: string,
    options: { value: T; title: string; description: string }[],
    selected: T | null,
    onSelect: (v: T) => void,
  ) => (
    <div className="choice-group">
      <p className="choice-group-label">{label}</p>
      {options.map((o) => (
        <ChoiceCard key={o.value} title={o.title} description={o.description} selected={selected === o.value} onSelect={() => onSelect(o.value)} />
      ))}
    </div>
  );

  return (
    <StepShell
      title="One last thing — your foot shape"
      subtitle="These answers tailor buying tips to your feet. Optional, but recommended."
    >
      {renderGroup('Toe shape', TOE_OPTIONS, toe, setToe)}
      {renderGroup('Width feel', WIDTH_OPTIONS, width, setWidth)}
      {renderGroup('Arch type', ARCH_OPTIONS, arch, setArch)}
      <PrimaryButton onClick={submit}>See my results</PrimaryButton>
      <button type="button" className="btn-secondary" onClick={onSkip}>Skip — just my sizes</button>
    </StepShell>
  );
}
