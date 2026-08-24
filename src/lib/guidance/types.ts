export type GuidanceKind =
  | "narrative"
  | "rule"
  | "definition"
  | "ksi"
  | "control"
  | "playbook";

export type CertificationTrack = "20x" | "rev5";
export type Audience = "Assessors" | "Providers" | "Agencies" | "Advisors" | "FedRAMP";
export type LifecycleStage =
  | "start"
  | "ssp"
  | "sap"
  | "testing"
  | "sar"
  | "package"
  | "conmon"
  | "change";

export type Citation = {
  title: string;
  url: string;
  issuer: string;
  note?: string;
  retrievedAt?: string;
};

export type Chunk = {
  id: string;
  kind: GuidanceKind;
  title: string;
  text: string;
  url: string;
  path?: string;
  tracks: CertificationTrack[];
  audiences: Audience[];
  lifecycle: LifecycleStage[];
  controlIds: string[];
  ruleIds: string[];
  tags: string[];
};

export type RuleRecord = {
  id: string;
  name: string;
  statement: string;
  force: string;
  note?: string;
  following: string[];
  related: string[];
  ruleset: string;
  rulesetName: string;
  subset: string;
  tracks: CertificationTrack[];
  audiences: Audience[];
  url: string;
};

export type DefinitionRecord = {
  id: string;
  term: string;
  definition: string;
  alts: string[];
};

export type KsiRecord = {
  id: string;
  name: string;
  familyId: string;
  familyName: string;
  statement: string;
  controls: string[];
  url: string;
};

export type ControlRecord = {
  id: string;
  displayId: string;
  title: string;
  family: string;
  parent: string | null;
  statement: string;
  guidance: string;
  methods: string[];
  objectives: string[];
  baselines: {
    low: boolean;
    moderate: boolean;
    high: boolean;
    lisaas: boolean;
  };
  fedrampGuidance: string[];
  fedrampParameters: string[];
};

export type GuidanceSource = {
  id: string;
  title: string;
  url: string;
  version?: string;
};

export type GuidanceSnapshot = {
  generatedAt: string;
  sources: GuidanceSource[];
  rulesVersion: string | null;
  nistCatalogVersion: string | null;
  nistCatalogTitle: string | null;
  chunks: Chunk[];
  rules: RuleRecord[];
  definitions: DefinitionRecord[];
  ksis: KsiRecord[];
  controls: ControlRecord[];
};

export type PlaybookCard = {
  id: string;
  title: string;
  analysis: string;
  tracks: CertificationTrack[];
  audiences: Audience[];
  lifecycle: LifecycleStage[];
  tags: string[];
  citations: Citation[];
};

export type ParsedQuery = {
  raw: string;
  normalized: string;
  tokens: string[];
  expanded: string[];
  controlIds: string[];
  ruleIds: string[];
  tracks: CertificationTrack[];
  audiences: Audience[];
  lifecycle: LifecycleStage[];
};

export type RankedHit = {
  chunk: Chunk;
  score: number;
};

export type OfficialQuote = {
  id: string;
  name: string;
  statement: string;
  force?: string;
  url: string;
  kind: "rule" | "ksi" | "definition" | "narrative";
};

export type ControlBrief = {
  control: ControlRecord;
  ksis: KsiRecord[];
};

export type ExpertBriefing = {
  question: string;
  headline: string;
  currency: string;
  analysis: string[];
  quotes: OfficialQuote[];
  controls: ControlBrief[];
  citations: Citation[];
  hits: RankedHit[];
  tracks: CertificationTrack[];
  lifecycle: LifecycleStage[];
};
