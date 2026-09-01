import type { CrmSchema } from "@/lib/types";

export const salesforceCrm: CrmSchema = {
  name: "Salesforce-style",
  objects: [
    {
      name: "Account",
      fields: [
        { name: "Id", type: "id", required: true },
        { name: "Name", type: "string", required: true },
        { name: "Industry", type: "picklist", picklistValues: ["Technology", "Manufacturing", "Retail", "Healthcare", "Finance"] },
        { name: "AnnualRevenue", type: "currency" },
        { name: "ParentId", type: "id", description: "Foreign key to Account (parent account hierarchy)." },
      ],
    },
    {
      name: "Contact",
      fields: [
        { name: "Id", type: "id", required: true },
        { name: "FirstName", type: "string" },
        { name: "LastName", type: "string", required: true },
        { name: "Email", type: "email" },
        { name: "AccountId", type: "id", required: true, description: "Foreign key to Account." },
      ],
    },
    {
      name: "Opportunity",
      fields: [
        { name: "Id", type: "id", required: true },
        { name: "Name", type: "string", required: true },
        { name: "Amount", type: "currency" },
        { name: "StageName", type: "picklist", required: true, picklistValues: ["Prospecting", "Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"] },
        { name: "CloseDate", type: "date", required: true },
        { name: "AccountId", type: "id", required: true, description: "Foreign key to Account." },
      ],
    },
    {
      name: "Lead",
      fields: [
        { name: "Id", type: "id", required: true },
        { name: "FirstName", type: "string" },
        { name: "LastName", type: "string", required: true },
        { name: "Company", type: "string", required: true },
        { name: "Email", type: "email" },
        { name: "Status", type: "picklist", picklistValues: ["Open", "Working", "Qualified", "Converted", "Unqualified"] },
      ],
    },
    {
      name: "Case",
      fields: [
        { name: "Id", type: "id", required: true },
        { name: "Subject", type: "string", required: true },
        { name: "Status", type: "picklist", required: true, picklistValues: ["New", "Working", "Escalated", "Closed"] },
        { name: "Priority", type: "picklist", picklistValues: ["Low", "Medium", "High", "Urgent"] },
        { name: "AccountId", type: "id", description: "Foreign key to Account." },
        { name: "ContactId", type: "id", description: "Foreign key to Contact." },
      ],
    },
    {
      name: "Campaign",
      fields: [
        { name: "Id", type: "id", required: true },
        { name: "Name", type: "string", required: true },
        { name: "Type", type: "picklist", picklistValues: ["Webinar", "Email", "Conference", "Advertisement"] },
        { name: "StartDate", type: "date" },
        { name: "EndDate", type: "date" },
      ],
    },
    {
      name: "CampaignMember",
      fields: [
        { name: "Id", type: "id", required: true },
        { name: "CampaignId", type: "id", required: true, description: "Foreign key to Campaign." },
        { name: "ContactId", type: "id", required: true, description: "Foreign key to Contact." },
        { name: "Status", type: "picklist", picklistValues: ["Sent", "Responded"] },
      ],
    },
  ],
  relationships: [
    { from: "Account", to: "Account", kind: "hierarchy", fieldName: "ParentId" },
    { from: "Contact", to: "Account", kind: "lookup", fieldName: "AccountId" },
    { from: "Opportunity", to: "Account", kind: "lookup", fieldName: "AccountId" },
    { from: "Case", to: "Account", kind: "lookup", fieldName: "AccountId" },
    { from: "Case", to: "Contact", kind: "lookup", fieldName: "ContactId" },
    { from: "CampaignMember", to: "Campaign", kind: "junction", fieldName: "CampaignId" },
    { from: "CampaignMember", to: "Contact", kind: "junction", fieldName: "ContactId" },
  ],
};
