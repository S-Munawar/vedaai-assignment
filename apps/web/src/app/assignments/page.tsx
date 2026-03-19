export default function Assignments() {
  return (
    <div className="p-10">
      <h1 className="text-4xl font-bold mb-4">Assignments</h1>
      <p className="text-gray-600 mb-8">View and manage all your assignments</p>
      
      <div className="mt-7">
        <div className="flex gap-2.5 mb-5">
          <button className="px-4 py-2 bg-blue-600 text-white border-none rounded-md cursor-pointer text-sm hover:bg-blue-700 transition-colors">
            All
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-800 border-none rounded-md cursor-pointer text-sm hover:bg-gray-300 transition-colors">
            Pending
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-800 border-none rounded-md cursor-pointer text-sm hover:bg-gray-300 transition-colors">
            Reviewed
          </button>
        </div>
      </div>

      <div className="mt-7">
        <h2 className="text-2xl font-semibold mb-4">Assignments List</h2>
        <p className="text-gray-600">No assignments yet. Create your first assignment to get started.</p>
      </div>
    </div>
  );
}
