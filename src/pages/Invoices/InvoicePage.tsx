import React from "react";
import InvoiceTemplate from "../../components/InvoiceTemplate1";
import type { BillItem,HowToPaySection } from "../../types";


const items: BillItem[] = [
  { description: "Business Premises Levy - Category B", amount: 35000 },
  { description: "Signage Permit (1 – 2 sqm)", amount: 12000 },
  { description: "Environmental Sanitation Levy", amount: 8000 },
];

const left: HowToPaySection = {
  title: "IN BANK PAYMENT",
  lines: [
    "Account Name: Warri South Local Government Council",
    "Bank: ABC Bank Plc",
    "Account Number: 0123456789",
    "Branch: Warri",
    "Narration: WSLGC - NOTICE NO.",
  ],
};

const right: HowToPaySection = {
  title: "ONLINE / TRANSFER / POS",
  lines: [
    "Visit: pay.ws-lgc.gov.ng",
    "Use Notice Number as reference",
    "POS is available at the Revenue Office",
    "Call support: +234 706 611 4522",
  ],
};

export default function InvoicePage() {
  return (
    <div style={{ padding: 16, background: "#f5f5f7" }}>
      <InvoiceTemplate
        councilName="WARRI SOUTH"
        councilSubtitle="LOCAL GOVERNMENT COUNCIL"
        councilAddress="PMB 1010, WARRI"
        dateOfNotice="2025-11-16"
        noticeNumber="WSLG-INV-000123"
        contactAddress={"12 Okumagba Avenue,\nWarri, Delta State.\nAttn: Mr. John Doe"}
        crestLeftUrl="/assets/images/coat-of-arm.png"
        crestRightUrl="/assets/images/delta-logo.png"
        qrValue="https://pay.ws-lgc.gov.ng/invoices/WSLG-INV-000123"
        qrLabel="Scan to verify"
        billItems={items}
        complianceNote="Compliance period is 14 days from the date of invoice."
        howToPayLeft={left}
        howToPayRight={right}
        enquiriesLine="All enquiries in respect of this demand notice should be directed to WSLGC: 07066114522"
        leftSignerTitle="TLG"
        rightSignerTitle="HOD REVENUE"
        nairaSymbol="₦"
        watermarkUrl="/assets/images/delta-water-mark.png"
      />
    </div>
  );
}