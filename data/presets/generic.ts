import type { CrmSchema } from "@/lib/types";

export const genericCrm: CrmSchema = {
  name: "Generic B2B CRM",
  objects: [
    {
      name: "Account",
      fields: [
        { name: "id", type: "id", required: true },
        { name: "name", type: "string", required: true },
        { name: "industry", type: "picklist", picklistValues: ["Software", "Manufacturing", "Retail", "Healthcare", "Finance"] },
        { name: "website", type: "string" },
        { name: "employeeCount", type: "number" },
      ],
    },
    {
      name: "Contact",
      fields: [
        { name: "id", type: "id", required: true },
        { name: "firstName", type: "string", required: true },
        { name: "lastName", type: "string", required: true },
        { name: "email", type: "email", required: true },
        { name: "phone", type: "phone" },
        { name: "accountId", type: "id", required: true, description: "Foreign key to Account." },
      ],
    },
    {
      name: "Deal",
      fields: [
        { name: "id", type: "id", required: true },
        { name: "name", type: "string", required: true },
        { name: "amount", type: "currency", required: true },
        { name: "stage", type: "picklist", required: true, picklistValues: ["Prospecting", "Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"] },
        { name: "closeDate", type: "date", required: true },
        { name: "accountId", type: "id", required: true, description: "Foreign key to Account." },
      ],
    },
    {
      name: "Activity",
      fields: [
        { name: "id", type: "id", required: true },
        { name: "type", type: "picklist", required: true, picklistValues: ["Call", "Email", "Meeting", "Task"] },
        { name: "subject", type: "string", required: true },
        { name: "dueDate", type: "date" },
        { name: "dealId", type: "id", description: "Foreign key to Deal." },
        { name: "contactId", type: "id", description: "Foreign key to Contact." },
      ],
    },
  ],
  relationships: [
    { from: "Contact", to: "Account", kind: "lookup", fieldName: "accountId" },
    { from: "Deal", to: "Account", kind: "lookup", fieldName: "accountId" },
    { from: "Activity", to: "Deal", kind: "lookup", fieldName: "dealId" },
    { from: "Activity", to: "Contact", kind: "lookup", fieldName: "contactId" },
  ],
};
