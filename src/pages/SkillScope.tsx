import { useParams } from 'react-router-dom';

export default function SkillScopePage() {
  const { id } = useParams();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">SkillScope™</h1>
      <p>Skill ID: {id}</p>
      <p>Dynamic content coming soon (KB + user context).</p>
    </div>
  );
}