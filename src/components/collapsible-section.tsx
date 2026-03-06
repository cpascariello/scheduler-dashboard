type CollapsibleSectionProps = {
  open: boolean;
  children: React.ReactNode;
};

export function CollapsibleSection({
  open,
  children,
}: CollapsibleSectionProps) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-200 ease-out"
      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
    >
      <div className="overflow-hidden min-h-0">{children}</div>
    </div>
  );
}
