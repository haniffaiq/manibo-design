interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  compact?: boolean;
}

export function PageHeader({ title, description, actions, breadcrumbs, compact = false }: PageHeaderProps) {
  return (
    <div className={compact ? "" : "mb-8"}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-[13px] text-[var(--color-neutral-400)] mb-3">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span>/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-[var(--color-neutral-600)] transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-[var(--color-neutral-600)]">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-neutral-900)] tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-[var(--color-neutral-500)]">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
