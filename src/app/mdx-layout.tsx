export function MdxLayout({ children }: { children: React.ReactNode }) {
  // Create any shared layout or styles here
  return (
    <div className="flex flex-col items-center">
      <div className="px-16 sm:px-40">
        <article className="prose prose-slate">{children}</article>
      </div>
    </div>
  );
}
