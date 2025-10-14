import { useEffect, useState } from 'react';

const LawyerList = () => {
  const [lawyers, setLawyers] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/lawyers')
      .then(res => res.json())
      .then(data => setLawyers(data));
  }, []);

  return (
    <div>
      <h2>Available Lawyers</h2>
      <ul>
        {lawyers.map(l => (
          <li key={l.email}>{l.name} ({l.email})</li>
        ))}
      </ul>
    </div>
  );
};

export default LawyerList;
