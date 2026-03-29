import { useEffect, useState } from 'react';
import api, { classes } from '../lib/api';

interface Student {
  _id: string;
  firstName: string;
  lastName?: string;
  rollNumber?: string;
}

export default function ApiExample() {
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // GET /api/students directly via generic helper
    api
      .get<Student[]>('/students')
      .then((data) => setStudents(data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Students fetched via fetch-based client</h1>
      <ul>
        {students.map((s) => (
          <li key={s._id}>
            {s.firstName} {s.lastName || ''} ({s.rollNumber})
          </li>
        ))}
      </ul>
    </div>
  );
}
