<div className="flex justify-center mb-8">
            <button
              onClick={generatePodcast}
              disabled={generatingPodcast}
              className="px-4 py-2 text-sm bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors disabled:opacity-50"
            >
              {generatingPodcast ? 'Generating...' : 'Generate Podcast'}
            </button>
          </div>