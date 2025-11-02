import React, { useEffect, useState } from 'react';

export default function Admin() {
  const [packages, setPackages] = useState([]);

  const fetchPackages = async () => {
    const res = await fetch('/api/packages');
    const data = await res.json();
    setPackages(data);
  };

  const handleDelete = async (id) => {
    await fetch(`/api/packages/${id}`, { method: 'DELETE' });
    fetchPackages();
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin Panel</h1>
      <table border="1">
        <thead>
          <tr>
            <th>ID</th>
            <th>Recipient</th>
            <th>Address</th>
            <th>Notes</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {packages.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.recipient}</td>
              <td>{p.address}</td>
              <td>{p.notes}</td>
              <td>{p.status || 'pending'}</td>
              <td>
                <button onClick={() => handleDelete(p.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
