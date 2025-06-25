export default function ObligationList({ obligations }) {
  if (!obligations.length)
    return <p className="italic text-gray-500">No obligations found.</p>;
  return (
    <ul className="list-disc list-inside space-y-2">
      {obligations.map((o,i) => <li key={i}>{o}</li>)}
    </ul>
  );
}
