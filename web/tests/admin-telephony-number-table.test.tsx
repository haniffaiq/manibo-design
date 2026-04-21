import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdminTelephonyNumberTable } from "@/components/admin-telephony-number-table";

afterEach(() => {
  cleanup();
});

describe("AdminTelephonyNumberTable", () => {
  it("renders number inventory rows with tenant and assistant columns", () => {
    render(
      <AdminTelephonyNumberTable
        rows={[
          {
            id: "number-1",
            phoneNumber: "+15551230000",
            providerLabel: "Telnyx",
            tenantLabel: "Demo Clinic",
            assignmentLabel: "clinic_registrator",
            statusLabel: "Ready",
            statusVariant: "success",
            active: true,
            canToggleActive: true,
          },
        ]}
        loading={false}
        onSelectRow={() => undefined}
      />,
    );

    expect(screen.getAllByText("+15551230000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Demo Clinic").length).toBeGreaterThan(0);
  });
});
