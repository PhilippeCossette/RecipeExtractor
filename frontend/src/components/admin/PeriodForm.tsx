import { useAppForm } from "@/hooks/useAppForm";

export const PERIOD_OPTIONS = [
  { value: "1", label: "Last 24 hours" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last year" },
] as const;

/** The admin page's period select. Changing it calls onChange right away (no submit button). */
export function PeriodForm({ days, onChange }: { days: number; onChange: (days: number) => void }) {
  const form = useAppForm({ defaultValues: { days: String(days) } });

  return (
    <form onSubmit={(e) => e.preventDefault()} className="w-44">
      <form.AppField name="days" listeners={{ onChange: ({ value }) => onChange(Number(value)) }}>
        {(field) => <field.SelectField label="Period" hideLabel options={PERIOD_OPTIONS} />}
      </form.AppField>
    </form>
  );
}
