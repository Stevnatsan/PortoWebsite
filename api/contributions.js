// Vercel serverless function.
// GitHub's contribution calendar is only exposed through the GraphQL API,
// which requires authentication even for public data — so the token lives
// here (server side) instead of in the browser.

const QUERY = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays { date contributionCount }
          }
        }
      }
    }
  }
`;

export default async function handler(req, res) {
  const login = process.env.GITHUB_USERNAME || "Stevnatsan";
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return res.status(500).json({ error: "GITHUB_TOKEN is not configured" });
  }

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: QUERY, variables: { login } }),
    });

    if (!response.ok) {
      return res.status(502).json({ error: "GitHub API error" });
    }

    const payload = await response.json();
    const calendar =
      payload?.data?.user?.contributionsCollection?.contributionCalendar;

    if (!calendar) {
      return res.status(502).json({ error: "No contribution data returned" });
    }

    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json(calendar);
  } catch (err) {
    return res.status(502).json({ error: "Failed to reach GitHub" });
  }
}
