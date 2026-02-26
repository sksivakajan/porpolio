import React, { useEffect, useState } from "react";

const HN_LATEST_API = "https://hn.algolia.com/api/v1/search_by_date?tags=story";
const DEFAULT_COUNT = 6;

function timeAgo(input) {
  if (!input) return "unknown";
  const now = Date.now();
  const then = typeof input === "number" ? input * 1000 : new Date(input).getTime();
  if (!Number.isFinite(then)) return "unknown";
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function HackerNewsSection({ count = DEFAULT_COUNT }) {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: "" });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setStatus({ loading: true, error: "" });

        const res = await fetch(HN_LATEST_API);
        if (!res.ok) throw new Error(`Hacker News API error: ${res.status}`);

        const data = await res.json();
        const hits = Array.isArray(data?.hits) ? data.hits : [];

        const normalized = hits
          .filter((item) => item?.title && item?.objectID)
          .slice(0, count)
          .map((item) => ({
            id: Number(item.objectID),
            title: item.title,
            by: item.author || "unknown",
            score: item.points ?? 0,
            comments: item.num_comments ?? 0,
            time: item.created_at,
            url: item.url || `https://news.ycombinator.com/item?id=${item.objectID}`,
          }));

        if (!alive) return;
        setPosts(normalized);
        setStatus({ loading: false, error: "" });
      } catch (e) {
        if (!alive) return;
        setStatus({ loading: false, error: e?.message || "Failed to fetch Hacker News" });
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [count, refreshKey]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button className="btn mini" onClick={() => setRefreshKey((k) => k + 1)} disabled={status.loading}>
          Refresh News
        </button>
      </div>

      <div className="grid2">
        {status.loading ? (
          <div className="card">
            <div className="cardTitle">Loading Hacker News...</div>
            <p className="cardBody">Fetching latest stories.</p>
          </div>
        ) : null}

        {status.error ? (
          <div className="card">
            <div className="cardTitle">Could not load Hacker News</div>
            <p className="cardBody">{status.error}</p>
          </div>
        ) : null}

        {!status.loading && !status.error && posts.length === 0 ? (
          <div className="card">
            <div className="cardTitle">No latest posts right now</div>
            <p className="cardBody">Try Refresh News in a moment.</p>
          </div>
        ) : null}

        {!status.loading &&
          !status.error &&
          posts.map((post) => (
            <article className="card hnCard" key={post.id}>
              <div className="hnTitle">{post.title}</div>
              <div className="tagRow">
                <span className="tag">by {post.by}</span>
                <span className="tag">score {post.score}</span>
                <span className="tag">{post.comments} comments</span>
                <span className="tag">{timeAgo(post.time)}</span>
              </div>
              <div className="projActions">
                <a className="btn mini" href={post.url} target="_blank" rel="noreferrer">
                  Open Story
                </a>
                <a
                  className="btn mini ghost"
                  href={`https://news.ycombinator.com/item?id=${post.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  HN Thread
                </a>
              </div>
            </article>
          ))}
      </div>
    </div>
  );
}
