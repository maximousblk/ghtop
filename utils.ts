import { Colors, opn } from "./deps.ts";

const GITHUB_WEB: string = "https://github.com";
const CLIENT_ID: string = "7d3b8efdf0fc91cefabb";
const GITHUB_API: string = "https://api.github.com";

export async function sleep(interval: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, interval);
  });
}

export async function parseQS(res: Response) {
  return JSON.parse(
    `{"${
      decodeURIComponent(await res.text())
        .replaceAll("&", '","')
        .replaceAll("=", '":"')
    }"}`,
  );
}

export async function githubAuthDevice() {
  const auth_endpoint =
    `${GITHUB_WEB}/login/device/code?client_id=${CLIENT_ID}`;
  const auth = await fetch(auth_endpoint, { method: "POST" }).then(
    async (res) => await parseQS(res),
  );

  console.log("Verification code:", Colors.green(auth.user_code));
  console.log("Visit", auth.verification_uri, "and enter the code");
  await sleep(3000);
  await opn(auth.verification_uri);
  Deno.stdout.writeSync(
    new TextEncoder().encode("Waiting for authorization..."),
  );

  const poll_endpoint =
    `${GITHUB_WEB}/login/oauth/access_token?client_id=${CLIENT_ID}&device_code=${auth.device_code}&grant_type=urn:ietf:params:oauth:grant-type:device_code`;
  while (true) {
    await sleep(auth.interval * 1000);
    Deno.stdout.writeSync(new TextEncoder().encode("."));

    const poll = await fetch(poll_endpoint, { method: "POST" }).then(
      async (res) => await parseQS(res),
    );

    if (poll.access_token) {
      console.log("\nAuthentication successful\n");
      return poll.access_token;
    }
  }
}

export async function fetchEvents(token: string) {
  const response = await fetch(`${GITHUB_API}/events?per_page=100`, {
    headers: {
      Authorization: "token " + token,
    },
  });
  const rate_limit = Number(response.headers.get("X-RateLimit-Remaining"));
  if (rate_limit < 1000) {
    console.log(
      "🚨🚨🚨 ",
      Colors.bgRed("!!! WARNING !!!"),
      "only",
      rate_limit,
      "calls remaining",
      " 🚨🚨🚨",
    );
  }
  return await response.json();
}

export const lfmt = {
  user: (login: string) => Colors.cyan(String(login)),
  event: (event: string) => Colors.magenta(String(event)),
  target: (target: string) => Colors.green(String(target)),
  ntarget: (number: string) => Colors.green("#" + String(number)),
  repo: (repo: string) => Colors.yellow(String(repo)),
  body: (body: string) => {
    if (body) {
      return Colors.dim(
        `("${
          String(body)
            .replaceAll(/\r?\n|\r/g, "")
            .substring(0, 30)
        }${body.length > 30 ? "..." : ""}")`,
      );
    }
  },
};
