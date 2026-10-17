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
  { code: 8, home: 4, guest: 2, team: true, last: "Schühle", first: "Nicolas", id: "PL-1" },
  { code: 8, home: 4, guest: 2, team: false, last: "Gegner", first: "Max", id: "PL-9" },
  { code: 4, home: 5, guest: 2, team: true, last: "Huber", first: "Lukas", id: "PL-3" },
  { code: 8, home: 5, guest: 2, team: true, last: "Schühle", first: "Nicolas", id: "PL-1" },
  { code: 10, home: 5, guest: 2, team: true, last: "Huber", first: "Lukas", id: "PL-3" },
  { code: 9, home: 5, guest: 2, team: false, last: "Gegner", first: "Max", id: "PL-9" },
  { code: 9, home: 5, guest: 2, team: false, last: "Mustermann", first: "Tim", id: "PL-10" },
  { code: 8, home: 5, guest: 2, team: false, last: "Mustermann", first: "Tim", id: "PL-10" },
  { code: 4, home: 5, guest: 3, team: false, last: "Mustermann", first: "Tim", id: "PL-10" },
  { code: 14, home: 5, guest: 3 },
  { code: 16, home: 5, guest: 3 },
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

const LOGO_HOME = "15188f98-fb07-48ac-8c1a-fa6f96c9bc89";
const LOGO_GUEST = "cbeda5de-a29e-40c8-bfdd-a49a61dec111";
// A real 53x48 nuLiga crest (white JPEG backdrop), served for every logo id.
const LOGO_BYTES = Buffer.from(
  "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",
  "base64",
);

function meeting(full) {
  const sc = SCRIPT[state() - 1];
  return {
    meetingID: MEETING,
    meetingUuid: full ? "uuid-mock" : null,
    teamHome: "TG Landshut",
    teamGuest: "Mock Gegner",
    homeImgUrl: LOGO_HOME,
    guestImgUrl: LOGO_GUEST,
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
    { personId: 3, firstname: "Lukas", lastname: "Huber", nr: "9", personType: 0, teamHome: true, meetingPersonId: "PL-3" },
    { personId: 10, firstname: "Tim", lastname: "Mustermann", nr: "13", personType: 0, teamHome: false, meetingPersonId: "PL-10" },
    { personId: 4, firstname: "Jonas", lastname: "Bauer", nr: "3", personType: 0, teamHome: true, meetingPersonId: "PL-4" },
    { personId: 5, firstname: "Felix", lastname: "Maier", nr: "1", personType: 0, teamHome: true, meetingPersonId: "PL-5" },
    { personId: 11, firstname: "Paul", lastname: "Weber", nr: "22", personType: 0, teamHome: false, meetingPersonId: "PL-11" },
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
    if (/^\/api\/1\/images\/[0-9a-f-]{36}$/.test(p)) {
      res.writeHead(200, { "content-type": "image/jpeg" });
      return res.end(LOGO_BYTES);
    }
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
