import { sprintf } from "./deps.ts";
import { fetchEvents, githubAuthDevice, lfmt, sleep } from "./utils.ts";

let GITHUB_TOKEN: string;
let logged_events: any[] = [];

async function auth() {
  const env_token = Deno.env.get("GITHUB_TOKEN");
  if (env_token) {
    GITHUB_TOKEN = env_token;
  } else {
    GITHUB_TOKEN = await githubAuthDevice();
  }
  return GITHUB_TOKEN;
}

async function logEvents(event: any) {
  if (logged_events.includes(event.id)) {
    logged_events.push(event.id);
    return;
  }

  const login: string = event.actor.login;
  const repo: string = event.repo.name;
  let logf: string = "";

  if (login.includes("bot")) return;

  const event_ignore = [
    "PublicEvent",
    "GollumEvent",
    "ForkEvent",
    "PushEvent",
    "CommitCommentEvent",
    "CreateEvent",
    "DeleteEvent",
  ];

  if (event_ignore.includes(event.type)) {
    return;
  } else if (event.type == "WatchEvent") {
    logf = sprintf(
      "🌟 %s %s %s ",
      lfmt.user(login),
      lfmt.event("starred"),
      lfmt.repo(repo),
    );
  } else if (event.type == "ReleaseEvent") {
    const tag = event.payload.release.tag_name;
    logf = sprintf(
      "🚀 %s %s %s of %s",
      lfmt.user(login),
      lfmt.event("released"),
      lfmt.target(tag),
      lfmt.repo(repo),
    );
  } else if (event.type == "IssuesEvent") {
    const action = event.payload.action;
    const issue = event.payload.issue;

    if (action == "closed") {
      logf = sprintf(
        "📪 %s %s issue %s on %s %s",
        lfmt.user(login),
        lfmt.event("closed"),
        lfmt.ntarget(issue.number),
        lfmt.repo(repo),
        lfmt.body(issue.title),
      );
    } else if (action == "opened") {
      logf = sprintf(
        "📬 %s %s issue %s on %s %s",
        lfmt.user(login),
        lfmt.event("opened"),
        lfmt.ntarget(issue.number),
        lfmt.repo(repo),
        lfmt.body(issue.title),
      );
    } else if (action == "reopened") {
      logf = sprintf(
        "📬 %s %s issue %s on %s %s",
        lfmt.user(login),
        lfmt.event("reopened"),
        lfmt.ntarget(issue.number),
        lfmt.repo(repo),
        lfmt.body(issue.title),
      );
    } else {
      console.log(
        "#### uncaught event ####",
        event.type,
        action,
        "Please report this :)",
      );
    }
  } else if (event.type == "IssueCommentEvent") {
    const issue = event.payload.issue;
    logf = sprintf(
      "💬 %s %s on issue %s of %s %s",
      lfmt.user(login),
      lfmt.event("commented"),
      lfmt.ntarget(issue.number),
      lfmt.repo(repo),
      lfmt.body(issue.title),
    );
  } else if (event.type == "PullRequestEvent") {
    const action = event.payload.action;
    const pull = event.payload.pull_request;

    if (action == "closed") {
      if (pull.merged) {
        logf = sprintf(
          "🙌 %s %s pull request %s on %s %s",
          lfmt.user(login),
          lfmt.event("merged"),
          lfmt.ntarget(pull.number),
          lfmt.repo(repo),
          lfmt.body(pull.title),
        );
      } else {
        logf = sprintf(
          "😭 %s %s pull request %s on %s %s",
          lfmt.user(login),
          lfmt.event("regected"),
          lfmt.ntarget(pull.number),
          lfmt.repo(repo),
          lfmt.body(pull.title),
        );
      }
    } else if (action == "opened") {
      logf = sprintf(
        "🙏 %s %s pull request %s on %s %s",
        lfmt.user(login),
        lfmt.event("opened"),
        lfmt.ntarget(pull.number),
        lfmt.repo(repo),
        lfmt.body(pull.title),
      );
    } else if (action == "reopened") {
      logf = sprintf(
        "🙏 %s %s pull request %s on %s %s",
        lfmt.user(login),
        lfmt.event("reopened"),
        lfmt.ntarget(pull.number),
        lfmt.repo(repo),
        lfmt.body(pull.title),
      );
    } else {
      console.log(
        "#### uncaught event ####",
        event.type,
        action,
        "Please report this :)",
      );
    }
  } else if (event.type == "PullRequestReviewEvent") {
    const review = event.payload.review;
    const pull = event.payload.pull_request;
    if (review.state == "approved") {
      logf = sprintf(
        "👍 %s %s pull request %s on %s %s",
        lfmt.user(login),
        lfmt.event("approved"),
        lfmt.ntarget(pull.number),
        lfmt.repo(repo),
        lfmt.body(pull.title),
      );
    } else if (review.state == "commented") {
      logf = sprintf(
        "👀 %s %s pull request %s on %s %s",
        lfmt.user(login),
        lfmt.event("reviewed"),
        lfmt.ntarget(pull.number),
        lfmt.repo(repo),
        lfmt.body(pull.title),
      );
    } else if (review.state == "dismissed") {
      logf = sprintf(
        "🔄 %s %s for pull request %s on %s %s",
        lfmt.user(login),
        lfmt.event("dismissed reviews"),
        lfmt.ntarget(pull.number),
        lfmt.repo(repo),
        lfmt.body(pull.title),
      );
    } else if (review.state == "changes_requested") {
      logf = sprintf(
        "🧐 %s %s to pull request %s on %s %s",
        lfmt.user(login),
        lfmt.event("requested changes"),
        lfmt.ntarget(pull.number),
        lfmt.repo(repo),
        lfmt.body(pull.title),
      );
    } else {
      console.log(
        "#### uncaught event ####",
        event.type,
        review.state,
        "Please report this :)",
      );
    }
  } else if (event.type == "PullRequestReviewCommentEvent") {
    const pull = event.payload.pull_request;
    const comment = event.payload.comment;

    logf = sprintf(
      "💬 %s %s on pull request %s on %s %s",
      lfmt.user(login),
      lfmt.event("replied to a review"),
      lfmt.ntarget(pull.number),
      lfmt.repo(repo),
      lfmt.body(comment.body),
    );
  } else if (event.type == "MemberEvent") {
    const action = event.payload.action;
    const member = event.payload.member;

    if (action == "added") {
      logf = sprintf(
        "👋 %s %s a new member %s",
        lfmt.user(login),
        lfmt.event("added"),
        lfmt.target(member.login),
      );
    } else if (action == "edited") {
      const changes = event.payload.changes;
      logf = sprintf(
        "💪 %s %s %s for %s %s",
        lfmt.user(login),
        lfmt.event("updated permissions"),
        lfmt.target(member.login),
        lfmt.body(changes),
      );
    } else {
      console.log(
        "#### uncaught event ####",
        event.type,
        action,
        "Please report this :)",
      );
    }
  } else {
    logf = sprintf(
      "❓ %s %s %s",
      lfmt.user(event.actor.login),
      lfmt.event(event.type),
      lfmt.repo(event.repo.name),
    );
  }

  if (!logf) {
    console.log(
      "#### uncaught event ####",
      event.type,
      "Please report this :)",
    );
  }
  console.log(logf);
}

async function main() {
  while (true) {
    const events = await fetchEvents(GITHUB_TOKEN);
    for (let event of events) {
      logEvents(event);
      await sleep(300);
    }
    await sleep(300);
  }
}

await auth();

main();
