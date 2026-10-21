import re

import httpx

from ..config import settings

API = "https://api.github.com"
GH_RE = re.compile(
    r"github\.com/([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))(?:/([A-Za-z0-9._-]+))?",
    re.I,
)
IGNORE = {"features", "about", "pricing", "orgs", "topics", "sponsors",
          "settings", "login", "marketplace", "apps"}


def _headers(accept: str = "application/vnd.github+json") -> dict:
    h = {"Accept": accept, "User-Agent": "InterviewPro"}
    if settings.github_token:
        h["Authorization"] = f"Bearer {settings.github_token}"
    return h


def _get(client: httpx.Client, path: str, params=None, accept=None):
    return client.get(
        f"{API}{path}",
        params=params,
        headers=_headers(accept or "application/vnd.github+json"),
    )


def find_github_refs(text: str):
    users, repos = [], []
    for m in GH_RE.finditer(text):
        user, repo = m.group(1), m.group(2)
        if user.lower() in IGNORE:
            continue
        if user not in users:
            users.append(user)
        if repo:
            repo = re.sub(r"\.git$", "", repo).rstrip(".")
            if repo and (user, repo) not in repos:
                repos.append((user, repo))
    return users, repos


def _summarize(client: httpx.Client, full_name: str, data: dict | None = None):
    if data is None:
        r = _get(client, f"/repos/{full_name}")
        if r.status_code == 404:
            return None
        r.raise_for_status()
        data = r.json()

    lr = _get(client, f"/repos/{full_name}/languages")
    languages = list(lr.json().keys())[:5] if lr.status_code == 200 else []

    rd = _get(client, f"/repos/{full_name}/readme",
              accept="application/vnd.github.raw+json")
    readme = rd.text[:400] if rd.status_code == 200 else ""

    return {
        "name": data.get("full_name"),
        "description": data.get("description"),
        "languages": languages,
        "main_language": data.get("language"),
        "stars": data.get("stargazers_count"),
        "is_fork": data.get("fork"),
        "last_push": data.get("pushed_at"),
        "readme_excerpt": readme,
    }


def check_portfolio(cv_text: str, max_repos: int = 6) -> dict:
    users, repo_refs = find_github_refs(cv_text)
    result = {"found": bool(users), "users": users, "repos": [], "errors": []}
    if not users:
        return result

    seen = set()
    with httpx.Client(timeout=10) as client:
        # 1) repo yang disebut spesifik di CV
        for owner, name in repo_refs:
            if len(result["repos"]) >= max_repos:
                break
            full = f"{owner}/{name}"
            try:
                s = _summarize(client, full)
                if s is None:
                    result["errors"].append(f"Repo {full} tidak ditemukan / private")
                elif full.lower() not in seen:
                    seen.add(full.lower())
                    result["repos"].append(s)
            except Exception as e:
                result["errors"].append(f"{full}: {e}")

        # 2) repo terbaru (non-fork) dari tiap username
        for u in users:
            if len(result["repos"]) >= max_repos:
                break
            try:
                r = _get(client, f"/users/{u}/repos",
                         params={"sort": "pushed", "per_page": 30, "type": "owner"})
                if r.status_code == 404:
                    result["errors"].append(f"Username GitHub {u} tidak ditemukan")
                    continue
                r.raise_for_status()
                for d in r.json():
                    if len(result["repos"]) >= max_repos:
                        break
                    if d.get("fork") or d["full_name"].lower() in seen:
                        continue
                    seen.add(d["full_name"].lower())
                    s = _summarize(client, d["full_name"], data=d)
                    if s:
                        result["repos"].append(s)
            except Exception as e:
                result["errors"].append(f"{u}: {e}")
    return result
