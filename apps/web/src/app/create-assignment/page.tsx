export default function CreateAssignment() {
  return (
    <div className="p-10">
      <h1 className="text-4xl font-bold mb-4">Create Assignment</h1>
      <p className="text-gray-600 mb-8">Create a new assignment for your students</p>
      
      <div className="mt-10 max-w-2xl">
        <form className="flex flex-col gap-5">
          <div>
            <label className="block mb-2 font-medium text-gray-800">
              Assignment Title
            </label>
            <input 
              type="text" 
              placeholder="Enter assignment title"
              className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-800">
              Description
            </label>
            <textarea 
              placeholder="Enter assignment description"
              rows={4}
              className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-800">
              Assign To
            </label>
            <select 
              className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option>Select a group</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-800">
              Due Date
            </label>
            <input 
              type="date"
              className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex gap-2.5 mt-5">
            <button 
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white border-none rounded-md cursor-pointer text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Create Assignment
            </button>
            <button 
              type="button"
              className="px-6 py-3 bg-gray-200 text-gray-800 border-none rounded-md cursor-pointer text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
