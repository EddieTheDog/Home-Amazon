import React, { useState } from 'react';
import QRCode from 'qrcode.react';

export default function FrontDesk() {
  const [packageInfo, setPackageInfo] = useState({ recipient: '', address: '', notes: '' });
  const [generatedCode, setGeneratedCode] = useState('');
  const [nextId, setNextId] = useState(0);

  const handleChange = (e) => {
    setPackageInfo({ ...packageInfo, [e.target.name]: e.target.value });
  };

  const handleGenerate = async () => {
    const id = Date.now() + nextId;
    setNextId(nextId + 1);
    setGeneratedCode(id);

    await fetch('/api/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...packageInfo, id }),
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><body>');
    printWindow.document.write(`<h2>Package Barcode</h2><div>${generatedCode}</div>`);
    printWindow.document.write('<div><canvas id="barcode"></canvas></div>');
    printWindow.document.write('</body></html>');
    printWindow.print();
    printWindow.close();
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Front Desk</h1>
      <input name="recipient" placeholder="Recipient Name" onChange={handleChange} />
      <input name="address" placeholder="Address" onChange={handleChange} />
      <input name="notes" placeholder="Notes" onChange={handleChange} />
      <button onClick={handleGenerate}>Generate Package</button>
      {generatedCode && (
        <>
          <h3>Generated Code: {generatedCode}</h3>
          <QRCode value={generatedCode.toString()} />
          <button onClick={handlePrint}>Print Barcode</button>
        </>
      )}
    </div>
  );
}
