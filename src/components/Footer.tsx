export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 border-t border-[--color-border]">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <p className="text-[--color-text-muted] text-sm">
          © {currentYear} Adjoint Labs Ltd. Oxford, UK.
        </p>
      </div>
    </footer>
  );
}
