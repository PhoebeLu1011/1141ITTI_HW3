import React, { useEffect, useState } from "react";

export default function GithubRepos({
  username = "PhoebeLu1011",
  limit = 6,
  token = "" // 可選：放 GitHub Personal Access Token（只需 public_repo 權限）
}) {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let canceled = false;

    async function load() {
      setLoading(true);
      setErr("");
      try {
        const headers = token
          ? { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" }
          : { Accept: "application/vnd.github+json" };

        // 取使用者公開 repos
        const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`, { headers });
        if (!res.ok) {
          const msg = `GitHub API 錯誤（${res.status} ${res.statusText}）`;
          throw new Error(msg);
        }
        const data = await res.json();

        // 依最近更新排序，並過濾 fork/archived（可依需求調整）
        const sorted = data
          .filter(r => !r.fork && !r.archived)
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
          .slice(0, limit);

        if (!canceled) setRepos(sorted);
      } catch (e) {
        if (!canceled) setErr(e.message || "載入失敗");
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    load();
    return () => { canceled = true; };
  }, [username, limit, token]);

  return (
    <section style={styles.wrap}>
      <h2 style={styles.title}>My GitHub Repo.</h2>

      {loading && (
        <div style={styles.grid}>
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} style={{ ...styles.card, ...styles.skeleton }}>
              <div style={styles.skelTitle} />
              <div style={styles.skelLine} />
              <div style={styles.skelMeta} />
            </div>
          ))}
        </div>
      )}

      {!loading && err && (
        <div style={styles.errorBox}>
          讀取失敗：{err}
        </div>
      )}

      {!loading && !err && (
        <div style={styles.grid}>
          {repos.map(repo => (
            <article key={repo.id} style={styles.card}>
              <a href={repo.html_url} target="_blank" rel="noreferrer" style={styles.cardTitle}>
                {repo.name}
              </a>
              <p style={styles.desc}>{repo.description || "（無描述）"}</p>
              <div style={styles.meta}>
                <span>⭐ {repo.stargazers_count}</span>
                <span>🍴 {repo.forks_count}</span>
                <span>🕒 {new Date(repo.updated_at).toLocaleDateString()}</span>
              </div>
              <div style={styles.tagsRow}>
                {repo.language && <span style={styles.tag}>{repo.language}</span>}
                {repo.topics && repo.topics.slice(0, 3).map(t => (
                  <span key={t} style={{ ...styles.tag, ...styles.tagSoft }}>{t}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

// 簡單樣式（避免依賴外部 CSS/Tailwind）
const styles = {
  wrap: {
    fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
    background: '#f9fbfc',
    padding: '20px',
    borderRadius: 16,
    border: '1px solid #e5e7eb'
  },
  title: {
    margin: '0 0 12px',
    color: '#192A5D',
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: '.2px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 16
  },
  card: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: 16,
    boxShadow: '0 2px 6px rgba(0,0,0,.05)',
    transition: 'transform .15s ease, box-shadow .15s ease'
  },
  cardTitle: {
    color: '#192A5D',
    fontWeight: 700,
    textDecoration: 'none',
    fontSize: 16
  },
  desc: {
    fontSize: 14,
    color: '#475569',
    margin: '8px 0 10px',
    minHeight: 36
  },
  meta: {
    display: 'flex',
    gap: 12,
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8
  },
  tagsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8
  },
  tag: {
    fontSize: 12,
    padding: '4px 8px',
    borderRadius: 999,
    background: '#e6eef5',
    color: '#1e293b'
  },
  tagSoft: {
    background: '#eef2f7',
    color: '#334155',
    border: '1px dashed #cbd5e1'
  },
  errorBox: {
    background: '#fff1f2',
    color: '#9f1239',
    border: '1px solid #fecdd3',
    borderRadius: 12,
    padding: 12
  },
  // skeleton
  skeleton: {
    position: 'relative',
    overflow: 'hidden'
  },
  skelTitle: {
    height: 18,
    width: '60%',
    background: '#e5e7eb',
    borderRadius: 6,
    marginBottom: 10
  },
  skelLine: {
    height: 12,
    width: '100%',
    background: '#e5e7eb',
    borderRadius: 6,
    marginBottom: 8
  },
  skelMeta: {
    height: 10,
    width: '40%',
    background: '#e5e7eb',
    borderRadius: 6
  }
};
