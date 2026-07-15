import React, { useMemo } from "react";
import { QRCodeCanvas } from "qrcode.react";
import type { InvoiceTemplateProps, BillItem } from "../types";
import "./InvoiceTemplate1.css";

function formatCurrency(amount: number, nairaSymbol: string) {
  // Format as NGN currency with thousands separators
  const formatted = new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${nairaSymbol}${formatted}`;
}

const DefaultLeft: InvoiceTemplateProps["howToPayLeft"] = {
  title: "IN BANK PAYMENT",
  lines: [
    "HKDJH JH RFIUR JHF IUERHH DDFJHH",
    "RXJKLJCN, JH JHBL VHDH",
    "NFKJLDLJ, KJKJ VHDH GFDSDGDGS",
    "DJKHDBND KJHFKDF",
    "BHDJHDHDSHDFHHJHJ",
  ],
};

const DefaultRight: InvoiceTemplateProps["howToPayRight"] = {
  title: "ONLINE / TRANSFER / POS",
  lines: [
    "HHDJKJHKJH FIORU JH HJHDF JDF JHH",
    "NFKLDJNLJ JH, FKJHLKJ JHDKJ QDSKJDBDS",
    "DJBHDBJHDB  KHJKJDNDS",
    "HHHHH QHGHJKQPS HDBH",
  ],
};

const InvoiceTemplate1: React.FC<InvoiceTemplateProps> = ({
  councilName = "WARRI SOUTH",
  councilSubtitle = "LOCAL GOVERNMENT COUNCIL",
  councilAddress = "PMB 1010, WARRI",

  dateOfNotice = "",
  noticeNumber = "",
  contactAddress = "",

  crestLeftUrl,
  crestRightUrl,

  qrValue = "",
  qrLabel = "",

  billItems,
  complianceNote = "Compliance period is 14 days from the date of invoice.",

  howToPayLeft = DefaultLeft,
  howToPayRight = DefaultRight,

  enquiriesLine = "All enquiries in respect of this demand notice should be directed to WSLGC: 07066114522",

  leftSignerTitle = "TLG",
  rightSignerTitle = "HOD REVENUE",

  nairaSymbol = "₦",

  watermarkUrl,
}) => {
  const total = useMemo(
    () => billItems.reduce((sum: number, item: BillItem) => sum + (item.amount || 0), 0),
    [billItems]
  );

  return (
    <div className='page'>
      {/* Watermark */}
      {watermarkUrl ? (
        <img className='watermark' src={watermarkUrl} alt="watermark" />
      ) : null}

      {/* Header row with crests and council text */}
      <header className='header'>
        <div className='crestBox'>
          {crestLeftUrl ? <img src={crestLeftUrl} alt="crest-left" /> : <div className='crestPlaceholder' />}
        </div>

        <div className='headerText'>
          <div className='councilName'>{councilName}</div>
          <div className='councilSubtitle'>{councilSubtitle}</div>
          <div className='councilAddress'>{councilAddress}</div>
        </div>

        <div className='crestBox'>
          {crestRightUrl ? <img src={crestRightUrl} alt="crest-right" /> : <div className='crestPlaceholder' />}    
        </div>
      </header>

      {/* Notice meta + QR */}
      <section className='noticeRow'>
        <div className='metaCol'>
          <div className='metaField'>
            <div className='metaLabel'>DATE OF NOTICE:</div>
            <div className='metaValue'>{dateOfNotice || "\u00A0"}</div>
          </div>
          <div className='metaField'>
            <div className='metaLabel'>NOTICE NUMBER:</div>
            <div className='metaValue'>{noticeNumber || "\u00A0"}</div>
          </div>
        </div>

       
      </section>

      {/* Contact Address */}
      <section className='contactSection'>       
        <div className='metaField'>
            <div className='metaLabel'>CONTACT ADDRESS</div>
            <div className='metaValue'>{contactAddress || "\u00A0"}</div>
          </div>
         <div className='qrCol'>
          {qrValue ? (
            <div className='qrBox'>
              <QRCodeCanvas value={qrValue} size={110} includeMargin />
              {qrLabel ? <div className='qrLabel'>{qrLabel}</div> : null}
            </div>
          ) : (
            <div className='qrPlaceholder'>QR</div>
          )}
        </div>
      </section>

      {/* Title */}
      <div className='title'>DEMAND NOTICE / INVOICE</div>
      {/* Bill table */}
      <section className='tableSection'>
        <div className='tableHeader'>BILL DETAILS</div>
        <table className='table'>
          <thead>
            <tr>
              <th className={'colDescription'}>DESCRIPTION</th>
              <th className='colAmount'>AMOUNT ({nairaSymbol})</th>
            </tr>
          </thead>
          <tbody>
            {billItems.length === 0 ? (
              <tr>
                <td className='emptyCell' colSpan={2}>
                  No items
                </td>
              </tr>
            ) : (
              billItems.map((row, idx) => (
                <tr key={idx}>
                  <td className='descCell'>{row.description}</td>
                  <td className='amountCell'>{formatCurrency(row.amount || 0, nairaSymbol)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className='complianceNote'>{complianceNote}</div>

        <div className='totalRow'>
          <div className='totalLabel'>Total Amount Payable</div>
          <div className='totalValue'>
            {formatCurrency(total, nairaSymbol)}
          </div>
        </div>
      </section>

      {/* How to Pay */}
      <section className='howToPay'>
        <div className='howHeader'>HOW TO PAY</div>
        <div className='howColumns'>
          <div className='howCol'>
            <div className='howTitle'>{howToPayLeft?.title}</div>
            <ul className='howList'>
              {howToPayLeft?.lines?.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
          <div className='howCol'>
            <div className='howTitle'>{howToPayRight?.title}</div>
            <ul className='howList'>
              {howToPayRight?.lines?.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Footer signatures */}
      <footer className='footer'>
        <div className='footerNote'>{enquiriesLine}</div>
        <div className='signRow'>
          <div className='signBox'>
            <div className='signLine' />
            <div className='signTitle'>{leftSignerTitle}</div>
          </div>
          <div className='signBox'>
            <div className='signLine' />
            <div className='signTitle'>{rightSignerTitle}</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default InvoiceTemplate1;