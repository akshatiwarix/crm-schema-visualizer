import type { CrmSchema } from "@/lib/types";

export const hubspotCrm: CrmSchema = {
  name: "HubSpot-style",
  objects: [
    {
      name: "Company",
      fields: [
        { name: "id", type: "id", required: true },
        { name: "name", type: "string", required: true },
        { name: "domain", type: "string" },
        { name: "industry", type: "picklist", picklistValues: ["Technology", "Retail", "Healthcare", "Education", "Finance"] },
        { name: "numberOfEmployees", type: "number" },
      ],
    },
    {
      name: "Contact",
      fields: [
        { name: "id", type: "id", required: true },
        { name: "firstName", type: "string", required: true },
        { name: "lastName", type: "string", required: true },
        { name: "email", type: "email", required: true },
        { name: "lifecycleStage", type: "picklist", picklistValues: ["Subscriber", "Lead", "MQL", "SQL", "Opportunity", "Customer"] },
        { name: "companyId", type: "id", description: "Foreign key to Company (primary association)." },
      ],
    },
    {
      name: "Deal",
      fields: [
        { name: "id", type: "id", required: true },
        { name: "dealName", type: "string", required: true },
        { name: "amount", type: "currency" },
        { name: "dealStage", type: "picklist", required: true, picklistValues: ["Appointment Scheduled", "Qualified To Buy", "Presentation Scheduled", "Contract Sent", "Closed Won", "Closed Lost"] },
        { name: "closeDate", type: "date" },
        { name: "companyId", type: "id", required: true, description: "Foreign key to Company." },
      ],
    },
    {
      name: "Ticket",
      fields: [
        { name: "id", type: "id", required: true },
        { name: "subject", type: "string", required: true },
        { name: "pipelineStage", type: "picklist", required: true, picklistValues: ["New", "Waiting on Contact", "Waiting on Us", "Closed"] },
        { name: "priority", type: "picklist", picklistValues: ["Low", "Medium", "High", "Urgent"] },
        { name: "contactId", type: "id", description: "Foreign key to Contact." },
        { name: "companyId", type: "id", description: "Foreign key to Company." },
      ],
    },
  ],
  relationships: [
    { from: "Contact", to: "Company", kind: "lookup", fieldName: "companyId" },
    { from: "Deal", to: "Company", kind: "lookup", fieldName: "companyId" },
    { from: "Ticket", to: "Contact", kind: "lookup", fieldName: "contactId" },
    { from: "Ticket", to: "Company", kind: "lookup", fieldName: "companyId" },
  ],
};
