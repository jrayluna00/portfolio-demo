import type { Chunk, GuidanceSnapshot, PlaybookCard } from "./types";

export const PLAYBOOK: PlaybookCard[] = [
  {
    id: "currency-2026",
    title: "What is current FedRAMP guidance as of 2026?",
    analysis:
      "The FedRAMP Consolidated Rules for 2026 are the primary source of truth for current requirements. They took effect 4 July 2026, become mandatory for all stakeholders on 1 January 2027, and remain the supported ruleset through 31 December 2028. FedRAMP 20x Program Certification is the modern path (Classes A–C available; Class D/High is a later phase). Rev5 is still a live certification type during the transition, especially for agency-sponsored work, but FedRAMP will stop accepting new Rev5 applications on 11 June 2027. Do not treat pre-2026 templates, playbooks, or fedramp.gov/docs pages as current requirements unless you are answering a historical or still-in-flight legacy-agency SAP/SAR question — and even then, label that material as legacy.",
    tracks: ["20x", "rev5"],
    audiences: ["Assessors", "Providers", "Agencies", "Advisors"],
    lifecycle: ["start", "package"],
    tags: ["current", "consolidated rules", "2026", "20x", "rev5", "deadline"],
    citations: [
      {
        title: "FedRAMP Consolidated Rules for 2026",
        url: "https://www.fedramp.gov/2026/",
        issuer: "FedRAMP PMO",
      },
      {
        title: "Machine-readable rules (fedramp-consolidated-rules.json)",
        url: "https://github.com/FedRAMP/rules",
        issuer: "FedRAMP",
      },
      {
        title: "Propelling Change: FedRAMP Launches Consolidated Rules for 2026",
        url: "https://www.fedramp.gov/2026-06-25-propelling-change-fedramp-launches-consolidated-rules-for-2026/",
        issuer: "FedRAMP PMO",
      },
    ],
  },
  {
    id: "sap-not-required-program",
    title: "Is a Security Assessment Plan still required?",
    analysis:
      "For FedRAMP Program Certification (20x and Rev5 Program), FedRAMP does not require a standalone Security Assessment Plan (SAP) or Security Assessment Report (SAR). Independent Verification and Validation (IV&V) rules replace that paperwork model: the assessor verifies that implemented measures match what the provider documented, validates that those measures produce the intended results, and the provider carries the assessment summaries in the Security Decision Record and Certification Package Overview. For agency-sponsored Rev5 assessments, the sponsoring agency may still require a legacy SAP and SAR using the archived templates. In that hybrid case, produce the legacy SAP/SAR for the agency and still satisfy the 2026 IV&V, Certification Package Overview, and Security Decision Record rules for FedRAMP.",
    tracks: ["20x", "rev5"],
    audiences: ["Assessors", "Providers", "Agencies"],
    lifecycle: ["sap", "sar", "package"],
    tags: ["sap", "security assessment plan", "sar", "iv&v", "program certification"],
    citations: [
      {
        title: "Performing FedRAMP Assessments",
        url: "https://www.fedramp.gov/2026/assessors/fedramp-assessments/",
        issuer: "FedRAMP PMO",
      },
      {
        title: "Approaching FedRAMP Rev5 Assessments",
        url: "https://www.fedramp.gov/2026/assessors/fedramp-assessments/rev5/",
        issuer: "FedRAMP PMO",
      },
      {
        title: "Independent Verification and Validation ruleset (IVV)",
        url: "https://www.fedramp.gov/2026/reference/independent-verification-and-validation/",
        issuer: "FedRAMP PMO",
      },
    ],
  },
  {
    id: "sap-legacy-agency",
    title: "Developing a legacy SAP for an agency-sponsored Rev5 assessment",
    analysis:
      "When the sponsoring agency still wants a classic SAP, the 3PAO (independent assessor) owns the plan. Use the current archived FedRAMP SAP template from the Legacy Documentation Reference — not an old Initial-vs-Annual split template. Rev5 consolidated SAP into one template used for initial assessments, annual assessments, and significant change testing. The SAP should identify the authorization boundary and in-scope assets, the Rev5 baseline (and any agency overlays), the NIST SP 800-53A assessment objectives and methods (Examine / Interview / Test) that will be applied, sampling approach, rules of engagement, inherited/leveraged-service handling, penetration-testing plan if in scope, schedule, and data-handling constraints. FedRAMP training 200-B still describes the legacy SAP sections; treat it as historical method, then map each planned test to a 2026 IV&V verification or validation activity so the same fieldwork also supports the Certification Package. The agency (and historically the FedRAMP ISSO on JAB paths) reviews the SAP before testing starts so the assessment actually covers the stated boundary.",
    tracks: ["rev5"],
    audiences: ["Assessors", "Providers", "Agencies"],
    lifecycle: ["sap"],
    tags: [
      "sap",
      "security assessment plan",
      "3pao",
      "agency sponsor",
      "test cases",
      "800-53a",
    ],
    citations: [
      {
        title: "Legacy FedRAMP Security Assessment Plan (SAP) Template",
        url: "https://www.fedramp.gov/rev5/documents-templates/",
        issuer: "FedRAMP PMO (legacy)",
        note: "Archived Rev5 template. Confirm the agency still requires it.",
      },
      {
        title: "NIST SP 800-53A Rev 5.2.0 assessment procedures (in OSCAL catalog)",
        url: "https://csrc.nist.gov/pubs/sp/800/53a/r5/upd1/final",
        issuer: "NIST",
      },
      {
        title: "Approaching FedRAMP Rev5 Assessments",
        url: "https://www.fedramp.gov/2026/assessors/fedramp-assessments/rev5/",
        issuer: "FedRAMP PMO",
      },
    ],
  },
  {
    id: "testing-execution",
    title: "Executing the assessment (SAP fieldwork to evidence)",
    analysis:
      "Whether you wrote a legacy SAP or are working only to 2026 IV&V rules, assessment is of the operating cloud service — not of the words in the package. Verification asks: did the provider implement what it documented? Validation asks: does that implementation produce the intended results? Use quantitative evidence where it answers the question (configuration, event records, complete populations of automated checks). Sample when a full review adds little value. Interview engineers, then test those explanations. Every applicable FedRAMP rule must be assessed; that expanded 2026 ruleset is in-scope alongside Rev5 controls on a Rev5 assessment. Keep independence: you may advise, but you must be able to challenge claims and report disagreements. Do not start testing against an unapproved legacy SAP if the agency required SAP approval first.",
    tracks: ["20x", "rev5"],
    audiences: ["Assessors"],
    lifecycle: ["testing", "sap"],
    tags: ["testing", "examine", "interview", "test", "evidence", "sampling", "iv&v"],
    citations: [
      {
        title: "Performing FedRAMP Assessments",
        url: "https://www.fedramp.gov/2026/assessors/fedramp-assessments/",
        issuer: "FedRAMP PMO",
      },
      {
        title: "NIST SP 800-53A Rev 5 — assessment methods Examine, Interview, Test",
        url: "https://csrc.nist.gov/pubs/sp/800/53a/r5/upd1/final",
        issuer: "NIST",
      },
    ],
  },
  {
    id: "sar-legacy-agency",
    title: "Writing and submitting a legacy SAR package",
    analysis:
      "For agency-sponsored Rev5 work that still uses the classic package, the assessor writes the Security Assessment Report on the archived FedRAMP SAR template. The SAR is the attestation of what was tested, how, and what was found: scope actually assessed, deviations from the SAP, results mapped to NIST 800-53A objectives, residual risk, and a risk-based recommendation to the authorizing official. Attach SAR Appendix A (Risk Exposure Table) for every weakness found in testing, and complete the Security Requirements Traceability Matrix (Appendix B) for the applicable baseline. The CSP then opens or updates the POA&M from the RET. Submit the SAR with the rest of the authorization package the agency named in the Initial Authorization Package Checklist. In parallel, fold the same findings into the provider's Security Decision Record and Certification Package Overview so the 2026 package is complete — FedRAMP will review that modern package even when the agency still wants the Word SAR.",
    tracks: ["rev5"],
    audiences: ["Assessors", "Providers", "Agencies"],
    lifecycle: ["sar", "package"],
    tags: [
      "sar",
      "security assessment report",
      "ret",
      "risk exposure table",
      "poam",
      "authorization package",
    ],
    citations: [
      {
        title: "Legacy FedRAMP Security Assessment Report (SAR) Template",
        url: "https://www.fedramp.gov/rev5/documents-templates/",
        issuer: "FedRAMP PMO (legacy)",
      },
      {
        title: "FedRAMP Certification Package rule (FRC-CSO-PKG)",
        url: "https://www.fedramp.gov/2026/reference/fedramp-certification/",
        issuer: "FedRAMP PMO",
      },
      {
        title: "Approaching FedRAMP Rev5 Assessments",
        url: "https://www.fedramp.gov/2026/assessors/fedramp-assessments/rev5/",
        issuer: "FedRAMP PMO",
      },
    ],
  },
  {
    id: "package-2026",
    title: "What goes in a current FedRAMP Certification Package?",
    analysis:
      "Under FRC-CSO-PKG, a provider seeking certification MUST supply a complete Certification Package that includes at least: (1) information about the offering following the Certification Package Overview rules (CPO-CSO-OVR) — this overview replaces the historically required base SSP for Rev5 Program work; (2) implementation, validation, and assessment information for each relevant FedRAMP requirement, control, or Key Security Indicator as defined in the Security Decision Record rules (SDR-CSO-FRR); and (3) a real or example Ongoing Certification Report following CCM-OCR-AVL. The Security Decision Record is the persistently maintained record of security decisions; it is what replaced a traditional System Security Plan for 20x and for Rev5 Program Certification. Independent assessment summaries live with those artifacts, not in a separate SAR, unless an agency sponsor still demands the legacy SAR.",
    tracks: ["20x", "rev5"],
    audiences: ["Providers", "Assessors", "Agencies"],
    lifecycle: ["package", "ssp", "sar"],
    tags: [
      "certification package",
      "sdr",
      "security decision record",
      "ssp",
      "cpo",
      "frc-cso-pkg",
    ],
    citations: [
      {
        title: "FedRAMP Certification ruleset (FRC), including FRC-CSO-PKG",
        url: "https://www.fedramp.gov/2026/reference/fedramp-certification/",
        issuer: "FedRAMP PMO",
      },
      {
        title: "Rev5 package materials (CPO, SCG, SDR)",
        url: "https://www.fedramp.gov/2026/providers/rev5/package/",
        issuer: "FedRAMP PMO",
      },
      {
        title: "Certification Package Overview ruleset (CPO)",
        url: "https://www.fedramp.gov/2026/reference/certification-package-overview/",
        issuer: "FedRAMP PMO",
      },
    ],
  },
  {
    id: "sdr-replaces-ssp",
    title: "Security Decision Record vs System Security Plan",
    analysis:
      "The Security Decision Record replaced a traditional System Security Plan with a persistently maintained, verified, and validated record of the security decisions the cloud service provider makes over the life of the offering. The Certification Package Overview is the short, consistent summary that used to be buried in SSP front matter. For 20x, Key Security Indicators (not a 800-53 control-by-control SSP appendix) are the security-goal layer; each KSI maps to underlying NIST 800-53 controls but is assessed as an outcome with automated validation where possible. For Rev5 Program Certification, you still assess Rev5 controls, but you document them through the SDR and related 2026 artifacts rather than a giant SSP Appendix A Word file — unless the agency sponsor still requires that appendix.",
    tracks: ["20x", "rev5"],
    audiences: ["Providers", "Assessors", "Agencies"],
    lifecycle: ["ssp", "package"],
    tags: ["ssp", "sdr", "security decision record", "ksi", "system security plan"],
    citations: [
      {
        title: "Security Decision Record ruleset (SDR)",
        url: "https://www.fedramp.gov/2026/reference/security-decision-record/",
        issuer: "FedRAMP PMO",
      },
      {
        title: "Rev5 package materials",
        url: "https://www.fedramp.gov/2026/providers/rev5/package/",
        issuer: "FedRAMP PMO",
      },
    ],
  },
  {
    id: "nist-800-53-role",
    title: "How NIST SP 800-53 and 800-53A still apply",
    analysis:
      "NIST SP 800-53 Rev 5.2.0 remains the control catalog. FedRAMP Rev5 baselines (Low, Moderate, High, LI-SaaS) select from that catalog and add FedRAMP parameters and extra guidance. NIST SP 800-53A Rev 5.2.0 remains the assessment-procedure catalog: each control has assessment objectives and methods (Examine, Interview, Test) and assessment objects (policies, SSP/privacy plan, configurations, and so on). For a legacy SAP, those 53A procedures are the test cases. For 2026 Rev5 Program assessments, the same procedures are how you independently verify and validate each applicable Rev5 control, then record the result in the SDR. For 20x, start from the Key Security Indicator; use mapped 800-53 controls as the technical depth behind the KSI, not as a second, separate audit checklist — unless a specific 2026 control overlay (CTL) or Rev5 path says otherwise.",
    tracks: ["20x", "rev5"],
    audiences: ["Assessors", "Providers"],
    lifecycle: ["sap", "testing", "sar"],
    tags: ["nist", "800-53", "800-53a", "baseline", "assessment objective"],
    citations: [
      {
        title: "NIST SP 800-53 Rev 5.2.0 and SP 800-53A Rev 5.2.0 OSCAL catalog",
        url: "https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5",
        issuer: "NIST",
      },
      {
        title: "NIST SP 800-53 Rev 5 publication",
        url: "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
        issuer: "NIST",
      },
      {
        title: "FedRAMP Rev5 baselines (OSCAL profiles)",
        url: "https://github.com/OSCAL-Foundation/fedramp-resources/tree/main/baselines/rev5",
        issuer: "OSCAL Foundation / FedRAMP resources",
      },
    ],
  },
  {
    id: "inheritance-mas",
    title: "Inherited controls, leveraged services, and minimum assessment scope",
    analysis:
      "Inherited or leveraged IaaS/PaaS controls are not a free pass. The Minimum Assessment Scope (MAS) rules define what the independent assessment must actually cover. In a legacy SAP, list each leveraged FedRAMP-authorized service, the customer-responsibility matrix / CIS-CRM split, and which controls are inherited versus fully or partially implemented by the offering. The assessor still validates that inheritance is real (the leveraged authorization is current and the offering is configured to consume it) and tests the residual customer-implemented portions. In a legacy SAR, inherited risk from leveraged systems must be discussed, not omitted. Under 2026 rules, document the same facts in the Certification Package Overview and SDR, and assess MAS plus any applicable third-party information-resource rules. If the provider cannot show a current leveraged authorization, treat the control as implemented (and testable) by the offering itself.",
    tracks: ["20x", "rev5"],
    audiences: ["Assessors", "Providers"],
    lifecycle: ["sap", "testing", "sar", "package"],
    tags: [
      "inheritance",
      "leveraged",
      "iaas",
      "paas",
      "mas",
      "minimum assessment scope",
      "crm",
      "cis",
    ],
    citations: [
      {
        title: "Minimum Assessment Scope ruleset (MAS)",
        url: "https://www.fedramp.gov/2026/reference/minimum-assessment-scope/",
        issuer: "FedRAMP PMO",
      },
      {
        title: "Performing FedRAMP Assessments",
        url: "https://www.fedramp.gov/2026/assessors/fedramp-assessments/",
        issuer: "FedRAMP PMO",
      },
    ],
  },
  {
    id: "poam-vdr",
    title: "POA&M, RET, and the 2026 vulnerability rules",
    analysis:
      "Legacy Rev5 used the Risk Exposure Table (SAR Appendix A) as the assessor's list of weaknesses and the POA&M as the CSP's living tracker, plus deviation requests for risk adjustments, false positives, and operational requirements. The 2026 Consolidated Rules shift this to Vulnerability Detection and Response (VDR) and Vulnerability Evaluation and Reporting (VER), including the concept of an Accepted Vulnerability that will not be fully mitigated within the maximum overdue period. For a hybrid agency-sponsored assessment, populate the legacy RET/POA&M the agency expects and also meet VDR/VER so the Certification Package is current. Do not close a SAR finding that still exists in production just because a POA&M date is in the future — record it, rate it, and show the response path.",
    tracks: ["20x", "rev5"],
    audiences: ["Assessors", "Providers", "Agencies"],
    lifecycle: ["sar", "conmon", "package"],
    tags: ["poam", "poa&m", "ret", "vulnerability", "vdr", "ver", "deviation"],
    citations: [
      {
        title: "Vulnerability Detection and Response ruleset (VDR)",
        url: "https://www.fedramp.gov/2026/reference/vulnerability-detection-and-response/",
        issuer: "FedRAMP PMO",
      },
      {
        title: "Vulnerability Evaluation and Reporting ruleset (VER)",
        url: "https://www.fedramp.gov/2026/reference/vulnerability-evaluation-and-reporting/",
        issuer: "FedRAMP PMO",
      },
      {
        title: "Legacy POA&M and RET templates",
        url: "https://www.fedramp.gov/rev5/documents-templates/",
        issuer: "FedRAMP PMO (legacy)",
      },
    ],
  },
  {
    id: "annual-and-scr",
    title: "Annual assessment and significant changes",
    analysis:
      "Legacy FedRAMP used one SAP/SAR template for initial, annual, and significant-change testing, plus an Annual Assessment Controls Selection Worksheet for the yearly subset. Under 2026 rules, annual and ongoing work is Collaborative Continuous Monitoring plus a new independent assessment when IV&V says one is due. Grace periods for the new IV&V rules end on the first FedRAMP independent assessment started after 1 January 2027 — so the next annual or initial assessment after that date must follow the 2026 IV&V ruleset even if the system was authorized under old templates. Significant Change Notification (SCN) rules replace ad-hoc SCR emails; adaptive changes that do not introduce substantive new risk are treated differently from changes that need in-depth assessment. If an agency still wants a mini-SAP/SAR for an SCR, produce it as a legacy overlay and file the SCN artifacts for FedRAMP.",
    tracks: ["20x", "rev5"],
    audiences: ["Assessors", "Providers"],
    lifecycle: ["sap", "sar", "conmon", "change"],
    tags: ["annual", "significant change", "scr", "scn", "continuous monitoring", "conmon"],
    citations: [
      {
        title: "Independent Verification and Validation — Rev5 effective dates",
        url: "https://www.fedramp.gov/2026/reference/independent-verification-and-validation/",
        issuer: "FedRAMP PMO",
      },
      {
        title: "Significant Change Notification ruleset (SCN)",
        url: "https://www.fedramp.gov/2026/reference/significant-change-notification/",
        issuer: "FedRAMP PMO",
      },
      {
        title: "Collaborative Continuous Monitoring ruleset (CCM)",
        url: "https://www.fedramp.gov/2026/reference/collaborative-continuous-monitoring/",
        issuer: "FedRAMP PMO",
      },
    ],
  },
  {
    id: "assessor-recognition",
    title: "Who may perform the assessment",
    analysis:
      "Independent assessment for FedRAMP is performed by a FedRAMP-recognized independent assessment service (historically a 3PAO). Recognition rules (the FedRAMP Recognition ruleset) govern who may appear on the Marketplace as an assessor. The assessor plans and executes IV&V; the provider owns the Certification Package and must not silently edit the assessor's summaries. For legacy agency SAP/SAR work, the same recognized assessor typically authors both documents. Confirm Marketplace recognition is current before kicking off SAP development — an unrecognized firm cannot produce a FedRAMP-acceptable independent assessment.",
    tracks: ["20x", "rev5"],
    audiences: ["Assessors", "Providers"],
    lifecycle: ["start", "sap"],
    tags: ["3pao", "assessor", "recognition", "marketplace", "independence"],
    citations: [
      {
        title: "FedRAMP Recognition ruleset",
        url: "https://www.fedramp.gov/2026/assessors/rules/fedramp-recognition/",
        issuer: "FedRAMP PMO",
      },
      {
        title: "Assessor responsibilities",
        url: "https://www.fedramp.gov/2026/responsibilities/assessors/",
        issuer: "FedRAMP PMO",
      },
    ],
  },
  {
    id: "deadlines",
    title: "Transition deadlines that change SAP/SAR work",
    analysis:
      "Hold these dates when someone asks whether they should still build a classic SAP/SAR package: 4 July 2026 — Consolidated Rules take effect (optional adoption window for much of Rev5). 28 July 2026 — FedRAMP Ready goes legacy; no new Ready submissions. 1 January 2027 — Consolidated Rules become mandatory for all stakeholders; current Rev5 certifications must have adopted the new rules; IV&V grace ends on the first independent assessment started after this date. 11 June 2027 — FedRAMP stops accepting applications for new Rev5 certifications. Existing Rev5 certifications remain through at least 31 December 2028 unless otherwise directed. If a CSP is starting now without an agency that insists on Word SAP/SAR, steer them to 20x Program Certification and the 2026 package, not a new Rev5 SAP.",
    tracks: ["20x", "rev5"],
    audiences: ["Assessors", "Providers", "Agencies", "Advisors"],
    lifecycle: ["start", "package"],
    tags: ["deadline", "january 2027", "june 2027", "ready", "transition"],
    citations: [
      {
        title: "Important Dates for the Consolidated Rules for 2026",
        url: "https://www.fedramp.gov/2026/timeline/",
        issuer: "FedRAMP PMO",
      },
      {
        title: "Propelling Change: FedRAMP Launches Consolidated Rules for 2026",
        url: "https://www.fedramp.gov/2026-06-25-propelling-change-fedramp-launches-consolidated-rules-for-2026/",
        issuer: "FedRAMP PMO",
      },
    ],
  },
];

export function playbookChunks(): Chunk[] {
  return PLAYBOOK.map((card) => ({
    id: `playbook:${card.id}`,
    kind: "playbook",
    title: card.title,
    text: card.analysis,
    url: card.citations[0]?.url ?? "https://www.fedramp.gov/2026/",
    tracks: card.tracks,
    audiences: card.audiences,
    lifecycle: card.lifecycle,
    controlIds: [],
    ruleIds: [],
    tags: card.tags,
  }));
}

export function withPlaybook(snapshot: GuidanceSnapshot): GuidanceSnapshot {
  return {
    ...snapshot,
    chunks: [...playbookChunks(), ...snapshot.chunks],
  };
}
