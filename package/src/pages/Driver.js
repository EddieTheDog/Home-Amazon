import React, { useState } from 'react';

export default function Driver() {
  const [scannedCode, setScannedCode] = useState('');
  const [packageData, setPackageData] = useState(null);
  const [photo, setPhoto] = useState(null);

  const handleScan = async () => {
    const res = await fetch(`/api/packages/${scannedCode}`);
    const data = await res.json();
    setPackageData(data);
  };

  const handlePhotoChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleDeliver = async () => {
    if (!packageData) return;
    const formData = new FormData();
    formData.append('photo', photo);
    formData.append('status', 'delivered');

    await fetch(`/api/packages/${scannedCode}/deliver`, {
      method: 'POST',
      body: formData,
    });

    alert('Package marked as delivered!');
    setPackageData(null);
    setScannedCode('');
    setPhoto(null);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Driver Panel</h1>
      <input
        placeholder="Scan Package Code"
        value={scannedCode}
        onChange={(e) => setScannedCode(e.target.value)}
      />
      <button onClick={handleScan}>Lookup Package</button>

      {packageData && (
        <div>
          <h3>{packageData.recipient}</h3>
          <p>Address: {packageData.address}</p>
          <p>Notes: {packageData.notes}</p>
          <input type="file" accept="image/*" onChange={handlePhotoChange} />
          <button onClick={handleDeliver}>Deliver Package</button>
        </div>
      )}
    </div>
  );
}
