import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ColorPickerFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function ColorPickerField({ id, label, value, onChange, required }: ColorPickerFieldProps) {
  const handleColorChange = (newValue: string) => {
    // Ensure value starts with #
    if (!newValue.startsWith('#')) {
      newValue = '#' + newValue;
    }
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="flex gap-2">
        <div
          className="w-12 h-10 rounded-lg border border-border cursor-pointer shrink-0"
          style={{ backgroundColor: value }}
          onClick={() => document.getElementById(`${id}_input`)?.click()}
        />
        <Input
          id={`${id}_input`}
          type="color"
          value={value}
          onChange={(e) => handleColorChange(e.target.value)}
          className="sr-only"
        />
        <Input
          value={value.replace('#', '').toUpperCase()}
          onChange={(e) => handleColorChange(e.target.value)}
          placeholder="00D1D1"
          className="flex-1 font-mono"
          maxLength={6}
        />
      </div>
    </div>
  );
}
