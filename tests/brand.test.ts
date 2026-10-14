import test from "node:test"; import assert from "node:assert/strict";
import { ORIGINAL as O, OPEN_SOURCE_CONFIRMED, operatorFrom, safeHttpsUrl } from "../lib/brand";
import { seed } from "../lib/seed";

test("official URLs are exactly the ones supplied by the owner", () => {
  assert.equal(O.creatorUrl, "https://vxnuprasad.github.io/");
  assert.deepEqual(O.links.map(l => l.href), ["https://vxnuprasad.github.io/", "https://greynodlabs.com", "https://greynoddigital.github.io"]);
  assert.equal(O.repoUrl, "https://github.com/greynoddigital/myfit-tracker");
});
test("footer text matches the approved copy; every link is https", () => {
  assert.equal(O.tagline, "Your fitness journey, one day at a time.");
  assert.equal(O.closing, "Built for healthier habits. Shared with everyone.");
  for (const u of [O.creatorUrl, O.repoUrl, ...O.links.map(l => l.href)]) assert.ok(safeHttpsUrl(u), u);
});
test("no claim that a legal entity owns the project (GreyNod LLP is only proposed)", () => {
  assert.doesNotMatch(JSON.stringify(O), /LLP|Pvt|Ltd|registered|certified/i);
});
test("open-source label stays off until a licence is confirmed", () => assert.equal(OPEN_SOURCE_CONFIRMED, false));
test("safeHttpsUrl rejects non-https, credentials and junk", () => {
  for (const bad of ["http://x.com", "javascript:alert(1)", "https://user:pw@x.com", "not a url", "", undefined, "data:text/html,hi"]) assert.equal(safeHttpsUrl(bad), undefined, String(bad));
  assert.equal(safeHttpsUrl(" https://example.org/a "), "https://example.org/a");
});
test("operatorFrom: name required, control chars stripped, length capped, bad URL dropped", () => {
  assert.equal(operatorFrom({}), undefined); assert.equal(operatorFrom({ name: "   " }), undefined);
  assert.deepEqual(operatorFrom({ name: " Jo\u0000 Doe ", url: "http://nope" }), { name: "Jo Doe", url: undefined });
  assert.equal(operatorFrom({ name: "x".repeat(200) })!.name.length, 60);
  assert.equal(operatorFrom({ name: "Jo", url: "https://jo.example" })!.url, "https://jo.example/");
});
test("seed contains only neutral placeholder profile data (no real personal values)", () => {
  assert.equal(seed.profile.name, "");
  assert.deepEqual(seed.profile, { name: "", dob: "1990-01-01", heightCm: 170, startKg: 70, goalKg: 65 });
});
import { PUBLISHER } from "../lib/brand";
test("publisher brand is GreyNod Labs at the official https URL; description is accurate (no removed food feature)", () => {
  assert.equal(PUBLISHER.name, "GreyNod Labs"); assert.equal(PUBLISHER.url, "https://greynodlabs.com"); assert.ok(safeHttpsUrl(PUBLISHER.url));
  assert.match(O.description, /GreyNod Labs/); assert.doesNotMatch(O.description, /food/i);
});
