export function DashboardHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-xl font-bold">{title}</h1>
      {children}
    </div>
  );
}
