export type BillItem = {
  description: string;
  amount: number; // amount in naira
};

export type HowToPaySection = {
  title: string;
  lines: string[];
};

export type InvoiceTemplateProps = {
  councilName?: string; // default: "WARRI SOUTH"
  councilSubtitle?: string; // default: "LOCAL GOVERNMENT COUNCIL"
  councilAddress?: string; // default: "PMB 1010, WARRI"

  dateOfNotice?: string; // e.g. "2025-11-16"
  noticeNumber?: string; // e.g. "WSLG-INV-000123"
  contactAddress?: string;

  crestLeftUrl?: string; // e.g. Nigeria coat of arms
  crestRightUrl?: string; // e.g. LGA logo

  qrValue?: string; // value to encode in QR
  qrLabel?: string; // small caption under QR

  billItems: BillItem[];

  complianceNote?: string; // default: "Compliance period is 14 days from the date of invoice."

  howToPayLeft?: HowToPaySection;
  howToPayRight?: HowToPaySection;

  enquiriesLine?: string; // default footer text

  leftSignerTitle?: string; // default: "TLG"
  rightSignerTitle?: string; // default: "HOD REVENUE"

  nairaSymbol?: string; // default: "₦"

  watermarkUrl?: string; // optional watermark behind table
};