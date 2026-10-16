// Mock of nuLiga clubTeams + nuScoreLive REST. One TG game "goes live" at startup and advances
// by one event every STEP_MS. Run: node mock-nuliga.mjs [port]
import http from "node:http";

const PORT = Number(process.argv[2] ?? 4555);
const STEP_MS = Number(process.env.STEP_MS ?? 6000);
const GROUP = "900001";
const MEETING = "9000001";
const started = Date.now();

// Script of the match. Codes: 15 start period, 14 stop period, 4 goal, 5 7m goal, 8 penalty, 2 timeout home, 16 end
const SCRIPT = [
  { code: 17, home: 0, guest: 0 },
  { code: 15, home: 0, guest: 0 },
  { code: 4, home: 1, guest: 0, team: true, last: "Schühle", first: "Nicolas", id: "PL-1" },
  { code: 4, home: 1, guest: 1, team: false, last: "Gegner", first: "Max", id: "PL-9" },
  { code: 8, home: 1, guest: 1, team: false, last: "Anonym", first: "", id: null },
  { code: 5, home: 2, guest: 1, team: true, last: "Frank", first: "Henry Eugen", id: "PL-2" },
  { code: 2, home: 2, guest: 1, team: true },
  { code: 4, home: 3, guest: 1, team: true, last: "Schühle", first: "Nicolas", id: "PL-1" },
  { code: 14, home: 3, guest: 1 },
  { code: 14, home: 3, guest: 1 }, // duplicate marker, must be collapsed
  { code: 15, home: 3, guest: 1 },
  { code: 4, home: 3, guest: 2, team: false, last: "Gegner", first: "Max", id: "PL-9" },
  { code: 9, home: 3, guest: 2, team: true, last: "Frank", first: "Henry Eugen", id: "PL-2" },
  { code: 4, home: 4, guest: 2, team: true, last: "Frank", first: "Henry Eugen", id: "PL-2" },
  { code: 14, home: 4, guest: 2 },
  { code: 16, home: 4, guest: 2 },
];

const state = () => Math.min(SCRIPT.length, 1 + Math.floor((Date.now() - started) / STEP_MS));
const finished = () => state() >= SCRIPT.length;
const version = () => `v-${state()}`;

function events() {
  return SCRIPT.slice(0, state()).map((e, i) => ({
    event: e.code,
    idx: (i + 1) * 3, // gaps on purpose
    second: SCRIPT[i].code === 14 && SCRIPT[i - 1]?.code === 14 ? (i - 1) * 120 : i * 120,
    personLastname: e.last ?? null,
    personFirstname: e.first ?? null,
    pointsHome: e.home,
    pointsGuest: e.guest,
    personId: e.id ? 1000 + i : null,
    meetingPersonId: e.id ?? null,
    teamHome: e.team ?? null,
  }));
}

function meeting(full) {
  const sc = SCRIPT[state() - 1];
  return {
    meetingID: MEETING,
    meetingUuid: full ? "uuid-mock" : null,
    teamHome: "TG Landshut",
    teamGuest: "Mock Gegner",
    scheduled: new Date(started - 10 * 60_000).toISOString().replace("Z", "+0000"),
    matchesHome: sc.home,
    matchesGuest: sc.guest,
    groupID: GROUP,
    courtHallName: "Landshut, Mockhalle",
    live: !finished(),
    halfTimeScoreHome: state() > 8 ? 3 : 0,
    halfTimeScoreGuest: state() > 8 ? 1 : 0,
    versionUid: version(),
    halftimeLength: 30,
    nuScoreLiveEnabled: true,
    events: [],
  };
}

const players = {
  meetingPersons: [
    { personId: 1, firstname: "Nicolas", lastname: "Schühle", nr: "7", personType: 0, teamHome: true, meetingPersonId: "PL-1" },
    { personId: 2, firstname: "Henry Eugen", lastname: "Frank", nr: "11", personType: 0, teamHome: true, meetingPersonId: "PL-2" },
    { personId: 9, firstname: "Max", lastname: "Gegner", nr: "5", personType: 0, teamHome: false, meetingPersonId: "PL-9" },
  ],
};

const json = (res, body, status = 200) => {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "max-age=3600, public" });
  res.end(JSON.stringify(body));
};
const html404 = (res) => {
  res.writeHead(404, { "content-type": "text/html" });
  res.end("<html><body>HTTP Status 404</body></html>");
};

let failMode = false; // toggled via /__fail to test resilience

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const p = url.pathname;
    console.log(new Date().toISOString().slice(11, 19), req.method, p);
    if (p === "/__fail") {
      failMode = url.searchParams.get("on") === "1";
      return json(res, { failMode });
    }
    if (p === "/clubTeams") {
      res.writeHead(200, { "content-type": "text/html" });
      return res.end(
        `<a href="/cgi-bin/WebObjects/nuLigaHBDE.woa/wa/groupPage?championship=BHV+2026%2F27&amp;group=${GROUP}">Mock Liga</a>`,
      );
    }
    if (failMode && p.startsWith("/api/1/")) {
      res.writeHead(503, { "content-type": "text/html" });
      return res.end("down");
    }
    // Like the real backend: /time/<t> must be a multiple of 15, otherwise 204 (meeting) / 500 (others).
    const tm = p.match(/\/time\/(\d+)$/);
    if (tm && Number(tm[1]) % 15 !== 0) {
      res.writeHead(p.includes("/meeting/") ? 204 : 500);
      return res.end();
    }
    let m;
    if ((m = p.match(/^\/api\/1\/meetings\/(\d+)\/time\/\d+$/))) {
      return m[1] === GROUP ? json(res, { meetings: [meeting(false)] }) : json(res, { meetings: [] });
    }
    if ((m = p.match(/^\/api\/1\/meeting\/(\d+)\/time\/\d+$/))) {
      return m[1] === MEETING ? json(res, meeting(true)) : html404(res);
    }
    if ((m = p.match(/^\/api\/1\/events\/(\d+)\/versions\/([^/]+)$/))) {
      return json(res, { events: events() });
    }
    if (/^\/api\/1\/players\/\d+\/time\/\d+$/.test(p)) return json(res, players);
    if ((m = p.match(/^\/api\/1\/groups\/(\d+)$/))) {
      return json(res, { name: "Mock Liga", league: "Mock Liga männlich", id: null });
    }
    html404(res);
  })
  .listen(PORT, () => console.log("mock nuLiga on", PORT));
