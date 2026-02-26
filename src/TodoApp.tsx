export default function TodoApp() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              Todo <span className="text-yellow-300">AI</span>
            </h1>
            <p className="text-xl text-white/80">
              Intelligent task management with natural language suggestions
            </p>
          </div>
          
          {/* Stats Dashboard */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-white text-center">
              <div className="text-3xl font-bold">0</div>
              <div className="text-sm opacity-80">Total Tasks</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-white text-center">
              <div className="text-3xl font-bold">0</div>
              <div className="text-sm opacity-80">Pending</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-white text-center">
              <div className="text-3xl font-bold">0</div>
              <div className="text-sm opacity-80">Completed</div>
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Add a new task (e.g., 'Write a report' or 'Email client')"
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-all"
              />
              <button className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors">
                Add
              </button>
            </div>
            
            {/* AI Suggestions */}
            <div className="mt-4">
              <p className="text-sm font-semibold text-purple-600 mb-2">
                AI Suggestions:
              </p>
              <div className="flex gap-2 flex-wrap">
                <button className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors">
                  ⚡ High priority
                </button>
                <button className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors">
                  📅 Due today
                </button>
                <button className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors">
                  🎯 Important
                </button>
              </div>
            </div>
          </div>

          {/* Todo List */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white mb-4">Your Tasks</h2>
            
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="text-center py-8 text-gray-400">
                <div className="text-6xl mb-2">📝</div>
                <p>No tasks yet. Add your first task above!</p>
              </div>
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-4">Completed</h2>
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="text-center py-8 text-gray-400">
                <div className="text-6xl mb-2">✅</div>
                <p>No completed tasks yet</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}