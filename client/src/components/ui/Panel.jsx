export default function Panel({ className = "", children, ...props }) {
  return (
    <section className={`ow-panel ${className}`} {...props}>
      {children}
    </section>
  );
}
