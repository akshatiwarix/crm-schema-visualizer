import type { CrmSchema } from "@/lib/types";

/**
 * Shown via "Load Example" in the custom-JSON panel. Deliberately small but
 * exercises every relationship kind a pasted schema can use: a plain lookup
 * (Task -> Project), a self-referencing hierarchy (Employee -> manager), and
 * a many-to-many via a junction object (ProjectMember between Project and
 * Employee).
 */
export const exampleCustomSchema: CrmSchema = {
  name: "Example Custom Schema",
  objects: [
    {
      name: "Project",
      fields: [
        { name: "id", type: "id", required: true },
        { name: "name", type: "string", required: true },
        { name: "status", type: "picklist", picklistValues: ["Planned", "Active", "Done"] },
      ],
    },
    {
      name: "Task",
      fields: [
        { name: "id", type: "id", required: true },
        { name: "title", type: "string", required: true },
        { name: "done", type: "boolean" },
        { name: "projectId", type: "id", required: true, description: "Foreign key to Project." },
      ],
    },
    {
      name: "Employee",
      fields: [
        { name: "id", type: "id", required: true },
        { name: "name", type: "string", required: true },
        { name: "title", type: "string" },
        { name: "managerId", type: "id", description: "Foreign key to Employee (reporting hierarchy)." },
      ],
    },
    {
      name: "ProjectMember",
      fields: [
        { name: "id", type: "id", required: true },
        { name: "projectId", type: "id", required: true },
        { name: "employeeId", type: "id", required: true },
        { name: "role", type: "picklist", picklistValues: ["Owner", "Contributor", "Reviewer"] },
      ],
    },
  ],
  relationships: [
    { from: "Task", to: "Project", kind: "lookup", fieldName: "projectId" },
    { from: "Employee", to: "Employee", kind: "hierarchy", fieldName: "managerId" },
    { from: "ProjectMember", to: "Project", kind: "junction", fieldName: "projectId" },
    { from: "ProjectMember", to: "Employee", kind: "junction", fieldName: "employeeId" },
  ],
};
