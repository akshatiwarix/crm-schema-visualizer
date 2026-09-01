import { genericCrm } from "./generic";
import { salesforceCrm } from "./salesforce";
import { hubspotCrm } from "./hubspot";
import type { CrmSchema } from "@/lib/types";

export const presets: { id: string; label: string; schema: CrmSchema }[] = [
  { id: "generic", label: "Generic B2B CRM", schema: genericCrm },
  { id: "salesforce", label: "Salesforce-style", schema: salesforceCrm },
  { id: "hubspot", label: "HubSpot-style", schema: hubspotCrm },
];
