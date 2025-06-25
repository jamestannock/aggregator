export default function ObligationList({ obligations }) {
  if (!obligations.length)
    return <p className="italic text-gray-500">No obligations found.</p>;
  return (
    <ul className="space-y-3">
      {obligations.map((o, i) => (
        <li key={i} className="bg-white/70 rounded-lg p-4 shadow">
          {o}
        </li>
      ))}
    </ul>
  );
}
