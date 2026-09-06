/*
 * Header for the secondary destinations. The sky page uses
 * SkyIntro instead, because its job is to state a live fact
 * rather than to title a page.
 */
export default function PageHeader({ eyebrow, title, description, aside }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>

      {aside && <div className="page-header-aside">{aside}</div>}
    </header>
  );
}
