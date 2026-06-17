import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { releaseNotesApi } from "../../services/releaseNotesService";
import { useRBAC } from "../../auth/RBACContext";
import "../../styles/release-notes.css";

import {
  SparkleIcon,
  LightningIcon,
  ShieldIcon,
  DatabaseIcon,
  WrenchIcon,
  AlertIcon,
  InfoIcon,
  ListIcon,
} from "../../config/releaseNotesIcons";

import { SECTION_CONFIG, DEFAULT_SECTION_CONFIG } from "../../config/constants";

// Maps each sectionType string (from the API) to a display icon.
// Color/theme metadata comes from SECTION_CONFIG/DEFAULT_SECTION_CONFIG in constants.
function getSectionConfig(sectionType) {
  const iconMap = {
    Highlights: SparkleIcon,
    Features: SparkleIcon,
    Enhancements: LightningIcon,
    "Governance Updates": ShieldIcon,
    "Data & Platform": DatabaseIcon,
    Fixes: WrenchIcon,
    "Breaking Changes": AlertIcon,
    "Known Issues": InfoIcon,
  };

  const Icon = iconMap[sectionType] ?? ListIcon;
  const meta = SECTION_CONFIG[sectionType] ?? DEFAULT_SECTION_CONFIG;

  return { Icon, ...meta };
}


const VersionBadge = memo(({ version }) => (
  <span className="rn-version-badge">v{version}</span>
));

const LatestBadge = memo(() => (
  <span className="rn-latest-badge">LATEST</span>
));

const TagChip = memo(({ tag }) => (
  <span className="rn-tag-chip">{tag}</span>
));

const HighlightsPanel = memo(({ items }) => {
  if (!items?.length) return null;
  return (
    <div className="rn-highlights">
      <p className="rn-highlights-label">HIGHLIGHTS</p>
      <ul className="rn-highlights-list">
        {items.map((item, i) => (
          <li key={i} className="rn-highlights-item">
            <span className="rn-highlights-icon" aria-hidden="true">
              <SparkleIcon />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
});

const SectionCard = memo(({ section }) => {
  const { sectionType, sectionName, items = [] } = section;
  const { Icon, color, bg } = getSectionConfig(sectionType);

  return (
    <div className="rn-section-card">
      <div className="rn-section-header">
        <span className="rn-section-icon" style={{ color, background: bg }}>
          <Icon />
        </span>
        <span className="rn-section-title">{sectionName || sectionType}</span>
        <span className="rn-section-count">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>
      <ul className="rn-section-items">
        {items.map((item, i) => (
          <li key={i} className="rn-section-item">{item}</li>
        ))}
      </ul>
    </div>
  );
});

const ReleaseCard = memo(({ note }) => {
  const { title, version, releaseDateFormatted, isLatest, tags = [], sections = [] } = note;

  const highlights = sections.find(s => s.sectionType === 'Highlights');
  const otherSections = sections.filter(s => s.sectionType !== 'Highlights');

  return (
    <article className="rn-card" aria-label={`Release ${version}`}>
      <div className="rn-card-header-row">
        <div className="rn-card-header-left">
          <VersionBadge version={version} />
          {isLatest && <LatestBadge />}
          {releaseDateFormatted && (
            <span className="rn-release-date">{releaseDateFormatted}</span>
          )}
        </div>
        <h2 className="rn-card-title">{title}</h2>
      </div>

      {tags.length > 0 && (
        <div className="rn-tags-row">
          {tags.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>
      )}

      {highlights && <HighlightsPanel items={highlights.items} />}

      {otherSections.length > 0 && (
        <div className="rn-sections-grid">
          {otherSections.map((section, i) => (
            <SectionCard key={`${section.sectionType}-${i}`} section={section} />
          ))}
        </div>
      )}
    </article>
  );
});

const SearchBar = memo(({ value, onChange }) => (
  <div className="rn-search-bar">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
    <input
      className="rn-search-input"
      type="text"
      placeholder="Search release notes…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Search release notes"
    />
    {value && (
      <button className="rn-search-clear" onClick={() => onChange('')} aria-label="Clear search">
        ×
      </button>
    )}
  </div>
));

const Skeleton = () => (
  <div className="rn-skeleton-wrap" aria-busy="true" aria-label="Loading release notes">
    {[1, 2, 3].map((n) => (
      <div key={n} className="rn-skeleton-card">
        <div className="rn-skeleton-row">
          <div className="rn-skeleton-badge" />
          <div className="rn-skeleton-title" />
        </div>
        <div className="rn-skeleton-tags" />
        <div className="rn-skeleton-body" />
      </div>
    ))}
  </div>
);

const EmptyState = ({ search, tag }) => (
  <div className="rn-empty">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
    <p className="rn-empty-title">No release notes found</p>
    <p className="rn-empty-sub">
      {search || tag
        ? 'Try adjusting your search or filters.'
        : 'Release notes will appear here once they are published.'}
    </p>
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="rn-error">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
    <p className="rn-error-title">Failed to load release notes</p>
    <p className="rn-error-sub">{message || 'Check that Pimcore is running and accessible.'}</p>
    <button className="rn-retry-btn" onClick={onRetry}>Try again</button>
  </div>
);

export default function ReleaseNotesPage() {
  const { hasPermission } = useRBAC();

  const [notes,       setNotes]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [pagination,  setPagination]  = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [search,      setSearch]      = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTag,   setActiveTag]   = useState('');
  const [sortDir,     setSortDir]     = useState('DESC');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchNotes = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await releaseNotesApi.getAll({
        page:    params.page    ?? 1,
        limit:   20,
        search:  params.search  ?? debouncedSearch,
        tag:     params.tag     ?? activeTag,
        sort:    params.sort    ?? sortDir,
      });
      setNotes(result.data ?? []);
      setPagination(result.pagination ?? {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeTag, sortDir]);

  useEffect(() => {
    fetchNotes({ page: 1 });
  }, [debouncedSearch, activeTag, sortDir]);

  // Collects unique tags across all loaded notes to populate the filter chips
  const allTags = useMemo(() => {
    const tagSet = new Set();
    notes.forEach((n) => (n.tags ?? []).forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [notes]);

  // Clicking the active tag a second time clears the filter (toggle behaviour)
  const handleTagFilter = useCallback((tag) => {
    setActiveTag((prev) => (prev === tag ? '' : tag));
  }, []);

  const handleSortToggle = useCallback(() => {
    setSortDir((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'));
  }, []);

  const handleSearchChange = useCallback((val) => {
    setSearch(val);
  }, []);

  // Prefer a note explicitly marked isLatest; fall back to the first result
  const latestNote = useMemo(() => notes.find((n) => n.isLatest) ?? notes[0] ?? null, [notes]);

  return (
    <div className="rn-page">
      <div className="rn-page-header">
        <div>
          <h1 className="rn-page-title">Release Notes</h1>
          <p className="rn-page-subtitle">
            Platform evolution log — features, governance, data model, and quality updates across the CDP.
            {latestNote && !loading && (
              <> Latest version <strong>v{latestNote.version}</strong> released {latestNote.releaseDateFormatted}.</>
            )}
          </p>
        </div>
      </div>

      <div className="rn-controls">
        <SearchBar value={search} onChange={handleSearchChange} />
        <div className="rn-controls-row">
          {allTags.length > 0 && (
            <div className="rn-filter-chips" role="group" aria-label="Filter by tag">
              <span className="rn-filter-label">Filter:</span>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  className={`rn-filter-chip${activeTag === tag ? ' rn-filter-chip--active' : ''}`}
                  onClick={() => handleTagFilter(tag)}
                  aria-pressed={activeTag === tag}
                >
                  {tag}
                </button>
              ))}
              {activeTag && (
                <button className="rn-filter-chip-clear" onClick={() => setActiveTag('')}>
                  Clear ×
                </button>
              )}
            </div>
          )}

          <button className="rn-sort-btn" onClick={handleSortToggle} title="Toggle sort direction">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points={sortDir === 'DESC' ? '19 12 12 19 5 12' : '5 12 12 5 19 12'} />
            </svg>
            {sortDir === 'DESC' ? 'Newest first' : 'Oldest first'}
          </button>

          {!loading && !error && (
            <span className="rn-total-count">
              {pagination.total ?? notes.length} release{(pagination.total ?? notes.length) !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {loading && <Skeleton />}

      {!loading && error && (
        <ErrorState message={error} onRetry={() => fetchNotes({ page: 1 })} />
      )}

      {!loading && !error && notes.length === 0 && (
        <EmptyState search={debouncedSearch} tag={activeTag} />
      )}

      {!loading && !error && notes.length > 0 && (
        <div className="rn-timeline">
          {notes.map((note) => (
            <ReleaseCard key={note.id ?? note.version} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}
