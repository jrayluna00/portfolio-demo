import { test } from "node:test";
import assert from "node:assert/strict";
import { displayControlId, extractControlIds, extractRuleIds, normalizeControlId } from "./ids.ts";
import { PLAYBOOK } from "./playbook.ts";
import { briefQuestion } from "./expert.ts";
import { buildIndex, parseQuery } from "./search.ts";
import { withPlaybook } from "./playbook.ts";
import type { GuidanceSnapshot } from "./types.ts";

test("parses NIST and FedRAMP-style control ids", () => {
  assert.equal(normalizeControlId("AC-2"), "ac-2");
  assert.equal(displayControlId("ac-2.1"), "AC-2(1)");
  assert.deepEqual(extractControlIds("Assess AC-2(1) and CA-7"), ["ac-2.1", "ca-7"]);
  assert.deepEqual(extractRuleIds("See FRC-CSO-PKG and KSI-IAM-MFA"), ["FRC-CSO-PKG", "KSI-IAM-MFA"]);
});

test("SAP questions are classified as assessment-plan work", () => {
  const query = parseQuery("What belongs in the SAP for an agency-sponsored Rev5 assessment?");
  assert.ok(query.lifecycle.includes("sap"));
  assert.ok(query.tracks.includes("rev5"));
  assert.ok(query.audiences.includes("Agencies"));
});

const fixture: GuidanceSnapshot = {
  generatedAt: "2026-08-24T00:00:00.000Z",
  sources: [],
  rulesVersion: "2026.07.14.01",
  nistCatalogVersion: "5.2.0",
  nistCatalogTitle: "NIST SP 800-53 Rev 5.2.0",
  chunks: [],
  rules: [
    {
      id: "FRC-CSO-PKG",
      name: "FedRAMP Certification Package",
      statement:
        "Providers seeking a Certification MUST supply a complete FedRAMP Certification Package to FedRAMP for initial certification.",
      force: "MUST",
      following: [],
      related: ["CPO-CSO-OVR", "SDR-CSO-FRR"],
      ruleset: "FRC",
      rulesetName: "FedRAMP Certification",
      subset: "CSO",
      tracks: ["20x", "rev5"],
      audiences: ["Providers"],
      url: "https://www.fedramp.gov/2026/reference/fedramp-certification/",
    },
    {
      id: "IVV-IAS-VIM",
      name: "Verify Implementation",
      statement:
        "Assessors MUST verify that the measures implemented by the cloud service offering matches the measures they documented to meet FedRAMP Practices.",
      force: "MUST",
      following: [],
      related: [],
      ruleset: "IVV",
      rulesetName: "Independent Verification and Validation",
      subset: "IAS",
      tracks: ["20x", "rev5"],
      audiences: ["Assessors"],
      url: "https://www.fedramp.gov/2026/reference/independent-verification-and-validation/",
    },
  ],
  definitions: [
    {
      id: "FRD-SAR",
      term: "Security Assessment Report",
      definition: "Legacy independent assessment report used in agency-sponsored Rev5 packages.",
      alts: ["SAR"],
    },
  ],
  ksis: [],
  controls: [
    {
      id: "ac-2",
      displayId: "AC-2",
      title: "Account Management",
      family: "Access Control",
      parent: null,
      statement: "Define and manage system accounts.",
      guidance: "Account types include individual, group, and service.",
      methods: ["EXAMINE", "INTERVIEW", "TEST"],
      objectives: ["system accounts are managed"],
      baselines: { low: true, moderate: true, high: true, lisaas: true },
      fedrampGuidance: [],
      fedrampParameters: [],
    },
  ],
};

test("20x SAP question says a standalone SAP is not required", () => {
  const snapshot = withPlaybook(fixture);
  const briefing = briefQuestion(
    "Do I still need a Security Assessment Plan for FedRAMP 20x?",
    snapshot,
    buildIndex(snapshot.chunks),
  );
  const text = briefing.analysis.join(" ").toLowerCase();
  assert.match(text, /does not require a standalone security assessment plan/);
  assert.match(briefing.currency, /2026/);
  assert.ok(briefing.citations.some((cite) => cite.url.includes("fedramp.gov/2026")));
});

test("AC-2 lookup cites NIST methods and FedRAMP baselines", () => {
  const snapshot = withPlaybook(fixture);
  const briefing = briefQuestion("What does 800-53A require when assessing AC-2?", snapshot, buildIndex(snapshot.chunks));
  assert.equal(briefing.controls[0]?.control.displayId, "AC-2");
  assert.ok(briefing.controls[0]?.control.methods.includes("TEST"));
  assert.match(briefing.analysis.join(" "), /AC-2/);
});

test("certification package question quotes FRC-CSO-PKG", () => {
  const snapshot = withPlaybook(fixture);
  const briefing = briefQuestion(
    "What must be in a FedRAMP Certification Package under FRC-CSO-PKG?",
    snapshot,
    buildIndex(snapshot.chunks),
  );
  assert.ok(briefing.quotes.some((quote) => quote.id === "FRC-CSO-PKG"));
});

test("playbook covers SAP through SAR", () => {
  const stages = new Set(PLAYBOOK.flatMap((card) => card.lifecycle));
  assert.ok(stages.has("sap"));
  assert.ok(stages.has("sar"));
  assert.ok(stages.has("package"));
});
