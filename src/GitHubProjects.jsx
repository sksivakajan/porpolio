import React, { useEffect, useMemo, useState } from "react";

export default function GitHubProjects({ username = "sksivakajan", previewCount = 6 }) {
  const [repos, setRepos] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: "" });
  const [lastFetched, setLastFetched] = useState(null);
  const [rateRemaining, setRateRemaining] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const pinnedLikeSort = useMemo(() => {
    return (a, b) => {
      const stars = (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0);
      if (stars !== 0) return stars;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    };
  }, []);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setStatus({ loading: true, error: "" });

        const perPage = 100;
        let page = 1;
        let accum = [];

        const token = typeof import.meta !== "undefined" ? import.meta.env?.VITE_GITHUB_TOKEN : undefined;
        const headers = token ? { Authorization: `token ${token}` } : {};

        while (alive) {
          const url = `https://api.github.com/users/${username}/repos?per_page=${perPage}&page=${page}&sort=updated`;
          const res = await fetch(url, { headers });

          // capture rate limit info
          try {
            const rem = res.headers.get("x-ratelimit-remaining");
            if (rem != null) setRateRemaining(Number(rem));
          } catch {}

          if (!res.ok) {
            if (res.status === 403) {
              // likely rate-limited
              const msg = `GitHub API rate limited (${res.status})`;
              throw new Error(msg);
            }
            throw new Error(`GitHub API error: ${res.status}`);
          }

          const data = await res.json();
          const list = Array.isArray(data) ? data : [];

          accum = accum.concat(list);

          // Stop if we fetched fewer than a full page (no more pages)
          if (list.length < perPage) break;

          page += 1;
        }

        const filtered = (accum || [])
          .filter((r) => !r.fork)
          .sort(pinnedLikeSort);

        if (!alive) return;
        setRepos(filtered);
        setLastFetched(new Date().toLocaleString());
        setStatus({ loading: false, error: "" });
      } catch (e) {
        if (!alive) return;
        setStatus({ loading: false, error: e?.message || "Failed to load repos" });
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [username, pinnedLikeSort, refreshKey]);

  const visibleRepos = showAll ? repos : repos.slice(0, previewCount);
  const canToggle = repos.length > previewCount;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          {lastFetched ? `Last fetched: ${lastFetched}` : status.loading ? "Fetching..." : "Not fetched yet"}
          {rateRemaining != null ? ` • Rate left: ${rateRemaining}` : null}
        </div>
        <div>
          <button className="btn mini" onClick={() => setRefreshKey((k) => k + 1)} disabled={status.loading}>
            Refresh
          </button>
        </div>
      </div>

      <div className="grid3">
      {status.loading && (
        <div className="card">
          <div className="cardTitle">Loading projects…</div>
          <p className="cardBody">Fetching from GitHub API.</p>
        </div>
      )}

      {status.error && (
        <div className="card">
          <div className="cardTitle">Couldn’t load GitHub projects</div>
          <p className="cardBody">{status.error}</p>
          <p className="cardBody">Tip: GitHub rate limit may be hit. Refresh later.</p>
        </div>
      )}

      {!status.loading &&
        !status.error &&
        visibleRepos.map((r) => (
          <article className="card proj" key={r.id}>
            <div className="projTop">
              <div className="projTitle">{r.name}</div>
              <div className="projBadge">★ {r.stargazers_count ?? 0}</div>
            </div>

            <p className="projDesc">{r.description || "No description provided."}</p>

            <div className="tagRow">
              {r.language ? <span className="tag">{r.language}</span> : null}
              <span className="tag">
                Updated: {new Date(r.updated_at).toLocaleDateString()}
              </span>
            </div>

            <div className="projActions">
              <a className="btn mini" href={r.html_url} target="_blank" rel="noreferrer">
                View Repo
              </a>
              {r.homepage ? (
                <a className="btn mini ghost" href={r.homepage} target="_blank" rel="noreferrer">
                  Live
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {!status.loading && !status.error && canToggle ? (
        <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
          <button className="btn mini ghost" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Show less -" : "Show all +"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
