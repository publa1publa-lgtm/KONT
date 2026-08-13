-- Store free hex colors; convert legacy named presets.
UPDATE "PlanEvent" SET "color" = CASE "color"
  WHEN 'amber' THEN '#f59e0b'
  WHEN 'sky' THEN '#0ea5e9'
  WHEN 'emerald' THEN '#10b981'
  WHEN 'rose' THEN '#f43f5e'
  WHEN 'teal' THEN '#14b8a6'
  WHEN 'orange' THEN '#ea580c'
  WHEN 'slate' THEN '#64748b'
  WHEN 'coral' THEN '#fb7185'
  ELSE "color"
END
WHERE "color" IN ('amber', 'sky', 'emerald', 'rose', 'teal', 'orange', 'slate', 'coral');

ALTER TABLE "PlanEvent" ALTER COLUMN "color" SET DEFAULT '#f59e0b';
