export default function MyGroups() {
  return (
    <div className="p-10">
      <h1 className="text-4xl font-bold mb-4">My Groups</h1>
      <p className="text-gray-600 mb-8">Manage your student groups and classroom settings</p>
      
      <div className="mt-7">
        <button className="px-5 py-2.5 bg-blue-600 text-white border-none rounded-md cursor-pointer text-sm font-medium hover:bg-blue-700 transition-colors">
          + Create New Group
        </button>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">Your Groups</h2>
        <p className="text-gray-600">No groups yet. Create your first group to get started.</p>
      </div>
    </div>
  );
}
